import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ingreso } from '../../entities/ingreso.entity';
import { IngresoDetalle } from '../../entities/ingreso-detalle.entity';
import { Producto } from '../../entities/producto.entity';
import { MovimientoInventario } from '../../entities/movimiento-inventario.entity';
import { CreateIngresoDto } from './dto/create-ingreso.dto';

@Injectable()
export class IngresosService {
  constructor(
    @InjectRepository(Ingreso)
    private ingresoRepository: Repository<Ingreso>,
    @InjectRepository(IngresoDetalle)
    private detalleRepository: Repository<IngresoDetalle>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(MovimientoInventario)
    private movimientoRepository: Repository<MovimientoInventario>,
    private dataSource: DataSource,
  ) {}

  private async getStockActual(productoId: number, almacenId: number): Promise<number> {
    const ultimo = await this.movimientoRepository.findOne({
      where: { producto_id: productoId, almacen_id: almacenId },
      order: { created_at: 'DESC' },
    });
    return ultimo ? Number(ultimo.stock_actual ?? 0) : 0;
  }

  private async generarNumeroDocumento(): Promise<string> {
    const year = new Date().getFullYear();
    const inicioYear = new Date(year, 0, 1);
    const finYear = new Date(year + 1, 0, 1);
    const count = await this.ingresoRepository
      .createQueryBuilder('i')
      .where('i.fecha >= :inicio', { inicio: inicioYear })
      .andWhere('i.fecha < :fin', { fin: finYear })
      .getCount();
    return `ING-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  async create(dto: CreateIngresoDto, userId: number): Promise<Ingreso> {
    if (!dto.detalles?.length) {
      throw new BadRequestException('El ingreso debe tener al menos un detalle.');
    }

    const almacenId = Number(dto.almacen_id);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const numeroDoc = await this.generarNumeroDocumento();
      const fechaIngreso = dto.fecha ? new Date(dto.fecha) : new Date();
      const fechaSolo = new Date(fechaIngreso.getFullYear(), fechaIngreso.getMonth(), fechaIngreso.getDate());

      let total = 0;
      const detallesCalculados: Array<{
        producto_id: number;
        lote: string;
        cantidad: number;
        precio_unitario: number;
        fecha_vencimiento: Date;
        subtotal: number;
      }> = [];

      for (const det of dto.detalles) {
        const producto = await this.productoRepository.findOne({ where: { id: det.producto_id } });
        if (!producto) throw new NotFoundException(`Producto con ID ${det.producto_id} no encontrado`);
        const cant = Number(det.cantidad);
        const precio = Number(det.precio_unitario);
        const subtotal = cant * precio;
        total += subtotal;
        const fv = det.fecha_vencimiento ? new Date(det.fecha_vencimiento) : new Date();
        const fvSolo = new Date(fv.getFullYear(), fv.getMonth(), fv.getDate());
        detallesCalculados.push({
          producto_id: Number(det.producto_id),
          lote: String(det.lote || 'LOTE-1'),
          cantidad: cant,
          precio_unitario: precio,
          fecha_vencimiento: fvSolo,
          subtotal,
        });
      }

      const ingreso = queryRunner.manager.create(Ingreso, {
        numero_documento: numeroDoc,
        fecha: fechaSolo,
        proveedor_id: Number(dto.proveedor_id),
        almacen_id: almacenId,
        usuario_id: userId,
        total: Number(total.toFixed(2)),
        observaciones: dto.observaciones ?? null,
        estado: 'COMPLETADO',
      });
      const ingresoGuardado = await queryRunner.manager.save(ingreso);

      const stockRestante = new Map<number, number>();
      for (const det of detallesCalculados) {
        if (!stockRestante.has(det.producto_id)) {
          stockRestante.set(det.producto_id, await this.getStockActual(det.producto_id, almacenId));
        }
      }

      for (const det of detallesCalculados) {
        const detalle = queryRunner.manager.create(IngresoDetalle, {
          ingreso_id: ingresoGuardado.id,
          producto_id: det.producto_id,
          lote: det.lote,
          fecha_vencimiento: det.fecha_vencimiento,
          cantidad: det.cantidad,
          precio_unitario: det.precio_unitario,
          subtotal: det.subtotal,
        });
        await queryRunner.manager.save(detalle);

        const stockAnterior = stockRestante.get(det.producto_id)!;
        const stockActual = stockAnterior + det.cantidad;
        stockRestante.set(det.producto_id, stockActual);

        const movimiento = queryRunner.manager.create(MovimientoInventario, {
          producto_id: det.producto_id,
          almacen_id: almacenId,
          usuario_id: userId,
          tipo: 'ENTRADA',
          origen: 'INGRESO',
          origen_id: ingresoGuardado.id,
          lote: det.lote,
          fecha_vencimiento: det.fecha_vencimiento,
          cantidad: det.cantidad,
          stock_anterior: stockAnterior,
          stock_actual: stockActual,
          observaciones: `Ingreso ${numeroDoc}`,
        });
        await queryRunner.manager.save(movimiento);
      }

      await queryRunner.commitTransaction();
      return this.findOne(ingresoGuardado.id);
    } catch (err: any) {
      try {
        await queryRunner.rollbackTransaction();
      } catch (_) {}
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      throw new BadRequestException(err?.message || 'Error al registrar el ingreso.');
    } finally {
      try {
        await queryRunner.release();
      } catch (_) {}
    }
  }

  async findAll(): Promise<Ingreso[]> {
    return this.ingresoRepository.find({
      relations: ['proveedor', 'almacen', 'detalles', 'detalles.producto'],
      order: { fecha: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Ingreso> {
    const ingreso = await this.ingresoRepository.findOne({
      where: { id },
      relations: ['proveedor', 'almacen', 'detalles', 'detalles.producto'],
    });
    if (!ingreso) throw new NotFoundException(`Ingreso con ID ${id} no encontrado`);
    return ingreso;
  }
}
