import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Venta } from '../../entities/venta.entity';
import { VentaDetalle } from '../../entities/venta-detalle.entity';
import { Producto } from '../../entities/producto.entity';
import { MovimientoInventario } from '../../entities/movimiento-inventario.entity';
import { CuentaCobrar } from '../../entities/cuenta-cobrar.entity';
import { CreateVentaDto } from './dto/create-venta.dto';

@Injectable()
export class VentasService {
  private readonly logger = new Logger(VentasService.name);

  constructor(
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
    @InjectRepository(VentaDetalle)
    private ventaDetalleRepository: Repository<VentaDetalle>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(MovimientoInventario)
    private movimientoRepository: Repository<MovimientoInventario>,
    private dataSource: DataSource,
  ) {}

  /**
   * Obtiene el stock disponible de un producto en un almacén.
   * Misma lógica que Inventario (suma ENTRADA - SALIDA) para que coincida con lo que ve el usuario.
   */
  private async getStockActual(productoId: number, almacenId: number): Promise<number> {
    const result = await this.movimientoRepository
      .createQueryBuilder('m')
      .select(
        `SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.cantidad ELSE -m.cantidad END)`,
        'total',
      )
      .where('m.producto_id = :productoId', { productoId })
      .andWhere('m.almacen_id = :almacenId', { almacenId })
      .getRawOne<{ total: string | null }>();
    const total = result?.total != null ? Number(result.total) : 0;
    return Math.max(0, total);
  }

  async create(createVentaDto: CreateVentaDto, userId: number): Promise<Venta> {
    if (!createVentaDto.detalles?.length) {
      throw new BadRequestException('La venta debe tener al menos un detalle.');
    }

    const almacenId = Number(createVentaDto.almacen_id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar stock en almacén antes de crear la venta (suma por producto si hay varias líneas)
      const cantidadPorProducto = new Map<number, number>();
      for (const detalleDto of createVentaDto.detalles) {
        const pid = Number(detalleDto.producto_id);
        const cant = Number(detalleDto.cantidad);
        cantidadPorProducto.set(pid, (cantidadPorProducto.get(pid) ?? 0) + cant);
      }
      for (const [productoId, cantidadSolicitada] of cantidadPorProducto) {
        const producto = await this.productoRepository.findOne({ where: { id: productoId } });
        if (!producto) {
          throw new NotFoundException(`Producto con ID ${productoId} no encontrado`);
        }
        const stockDisponible = await this.getStockActual(productoId, almacenId);
        if (cantidadSolicitada > stockDisponible) {
          throw new BadRequestException(
            `Stock insuficiente en el almacén para "${(producto as any).nombre}" (cód. ${(producto as any).codigo}). Disponible: ${stockDisponible}, solicitado: ${cantidadSolicitada}. Registre ingresos de inventario primero.`,
          );
        }
      }

      // Generar número de factura
      const numeroFactura = await this.generarNumeroFactura();

      // Calcular totales
      let subtotal = 0;
      const detalles = [];

      for (const detalleDto of createVentaDto.detalles) {
        const producto = await this.productoRepository.findOne({
          where: { id: detalleDto.producto_id },
        });

        if (!producto) {
          throw new NotFoundException(
            `Producto con ID ${detalleDto.producto_id} no encontrado`,
          );
        }

        const cant = Number(detalleDto.cantidad);
        const precioUnit = Number(detalleDto.precio_unitario);
        const descLinea = Number(detalleDto.descuento || 0);
        const subtotalDetalle = cant * precioUnit - descLinea;
        subtotal += subtotalDetalle;

        detalles.push({
          producto_id: Number(detalleDto.producto_id),
          lote: String(detalleDto.lote || 'LOTE-1'),
          cantidad: cant,
          precio_unitario: precioUnit,
          descuento: descLinea,
          subtotal: subtotalDetalle,
        });
      }

      const descGlobal = Number(createVentaDto.descuento || 0);
      const total = Number((subtotal - descGlobal).toFixed(2));

      const fechaVenta = createVentaDto.fecha ? new Date(createVentaDto.fecha) : new Date();
      const fechaSolo = new Date(fechaVenta.getFullYear(), fechaVenta.getMonth(), fechaVenta.getDate());

      // Crear venta usando el manager de la transacción
      const tipoPagoStr = String(createVentaDto.tipo_pago || 'CONTADO').toUpperCase();
      let fechaLimitePagoVal: Date | null = null;
      const flpStr = createVentaDto.fecha_limite_pago != null ? String(createVentaDto.fecha_limite_pago).trim() : '';
      if (flpStr !== '') {
        const parsed = new Date(flpStr);
        if (!Number.isNaN(parsed.getTime())) {
          fechaLimitePagoVal = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        }
      }
      const venta = queryRunner.manager.create(Venta, {
        numero_factura: numeroFactura,
        fecha: fechaSolo,
        cliente_id: Number(createVentaDto.cliente_id),
        almacen_id: almacenId,
        usuario_id: userId,
        subtotal: Number(subtotal.toFixed(2)),
        descuento: descGlobal,
        total,
        tipo_pago: tipoPagoStr,
        fecha_limite_pago: fechaLimitePagoVal,
        estado: 'COMPLETADO',
        observaciones: createVentaDto.observaciones ?? null,
      });

      const ventaGuardada = await queryRunner.manager.save(venta);

      // Stock restante por producto (mismo producto en varias líneas)
      const stockRestantePorProducto = new Map<number, number>();
      for (const detalle of detalles) {
        if (!stockRestantePorProducto.has(detalle.producto_id)) {
          stockRestantePorProducto.set(
            detalle.producto_id,
            await this.getStockActual(detalle.producto_id, almacenId),
          );
        }
      }

      // Crear detalles y movimientos de inventario (usando stock real del almacén)
      for (const detalle of detalles) {
        const ventaDetalle = queryRunner.manager.create(VentaDetalle, {
          venta_id: ventaGuardada.id,
          producto_id: detalle.producto_id,
          lote: detalle.lote,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          descuento: detalle.descuento,
          subtotal: detalle.subtotal,
        });
        await queryRunner.manager.save(ventaDetalle);

        const restante = stockRestantePorProducto.get(detalle.producto_id)!;
        const stockAnterior = restante;
        const stockActual = restante - detalle.cantidad;
        stockRestantePorProducto.set(detalle.producto_id, stockActual);
        const fechaVenc = new Date();
        const fechaVencSolo = new Date(fechaVenc.getFullYear(), fechaVenc.getMonth(), fechaVenc.getDate());

        const movimiento = queryRunner.manager.create(MovimientoInventario, {
          producto_id: detalle.producto_id,
          almacen_id: Number(createVentaDto.almacen_id),
          usuario_id: userId,
          tipo: 'SALIDA',
          origen: 'VENTA',
          origen_id: ventaGuardada.id,
          lote: detalle.lote,
          fecha_vencimiento: fechaVencSolo,
          cantidad: detalle.cantidad,
          stock_anterior: stockAnterior,
          stock_actual: stockActual,
          observaciones: `Venta ${numeroFactura}`,
        });

        await queryRunner.manager.save(movimiento);
      }

      // Si es venta a crédito, crear cuenta por cobrar
      if (tipoPagoStr === 'CREDITO') {
        let fechaVenc: Date;
        if (fechaLimitePagoVal != null) {
          fechaVenc = fechaLimitePagoVal;
        } else {
          fechaVenc = new Date(fechaSolo);
          fechaVenc.setDate(fechaVenc.getDate() + 30); // 30 días por defecto
        }
        const cuentaCobrar = queryRunner.manager.create(CuentaCobrar, {
          cliente_id: Number(createVentaDto.cliente_id),
          venta_id: ventaGuardada.id,
          numero_documento: numeroFactura,
          monto_total: total,
          monto_pagado: 0,
          fecha_emision: fechaSolo,
          fecha_vencimiento: fechaVenc,
          estado: 'PENDIENTE',
          observaciones: `Venta a crédito ${numeroFactura}`,
        });
        await queryRunner.manager.save(cuentaCobrar);
      }

      await queryRunner.commitTransaction();
      return this.findOne(ventaGuardada.id);
    } catch (error: any) {
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackErr) {
        this.logger.warn('Error en rollback', rollbackErr);
      }
      this.logger.error('Error al crear venta', error?.message, error?.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const message = error?.message || String(error) || 'Error al registrar la venta. Revise los datos e intente de nuevo.';
      throw new BadRequestException(message);
    } finally {
      try {
        await queryRunner.release();
      } catch (_) {}
    }
  }

  async findAll(): Promise<Venta[]> {
    return this.ventaRepository.find({
      relations: ['cliente', 'almacen', 'usuario', 'detalles', 'detalles.producto'],
      order: { fecha: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Venta> {
    const venta = await this.ventaRepository.findOne({
      where: { id },
      relations: ['cliente', 'almacen', 'usuario', 'detalles', 'detalles.producto'],
    });
    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    return venta;
  }

  async anular(id: number, userId: number): Promise<Venta> {
    const venta = await this.findOne(id);
    if (venta.estado === 'ANULADO') {
      throw new BadRequestException('La venta ya está anulada');
    }

    venta.estado = 'ANULADO';
    await this.ventaRepository.save(venta);

    // Revertir movimientos de inventario
    // TODO: Implementar reversión de stock

    return venta;
  }

  private async generarNumeroFactura(): Promise<string> {
    const year = new Date().getFullYear();
    const inicioYear = new Date(year, 0, 1);
    const finYear = new Date(year + 1, 0, 1);
    const count = await this.ventaRepository
      .createQueryBuilder('v')
      .where('v.fecha >= :inicio', { inicio: inicioYear })
      .andWhere('v.fecha < :fin', { fin: finYear })
      .getCount();
    return `FAC-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}
