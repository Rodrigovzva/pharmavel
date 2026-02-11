import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimientoInventario } from '../../entities/movimiento-inventario.entity';
import { IngresoDetalle } from '../../entities/ingreso-detalle.entity';
import { VentaDetalle } from '../../entities/venta-detalle.entity';
import { Producto } from '../../entities/producto.entity';

@Injectable()
export class TrazabilidadService {
  constructor(
    @InjectRepository(MovimientoInventario)
    private movimientoRepository: Repository<MovimientoInventario>,
    @InjectRepository(IngresoDetalle)
    private ingresoDetalleRepository: Repository<IngresoDetalle>,
    @InjectRepository(VentaDetalle)
    private ventaDetalleRepository: Repository<VentaDetalle>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
  ) {}

  async trazarProducto(productoId: number, lote?: string) {
    const producto = await this.productoRepository.findOne({
      where: { id: productoId },
    });

    if (!producto) {
      return null;
    }

    // Obtener ingresos del producto
    const ingresos = await this.ingresoDetalleRepository.find({
      where: {
        producto_id: productoId,
        ...(lote && { lote }),
      },
      relations: ['ingreso', 'ingreso.proveedor', 'ingreso.almacen'],
      order: { created_at: 'DESC' },
    });

    // Obtener ventas del producto
    const ventas = await this.ventaDetalleRepository.find({
      where: {
        producto_id: productoId,
        ...(lote && { lote }),
      },
      relations: ['venta', 'venta.cliente'],
      order: { created_at: 'DESC' },
    });

    // Obtener movimientos de inventario
    const movimientos = await this.movimientoRepository.find({
      where: {
        producto_id: productoId,
        ...(lote && { lote }),
      },
      relations: ['almacen', 'usuario'],
      order: { created_at: 'DESC' },
    });

    return {
      producto,
      trazabilidad: {
        ingresos,
        ventas,
        movimientos,
      },
    };
  }

  async trazarLote(lote: string) {
    const ingresos = await this.ingresoDetalleRepository.find({
      where: { lote },
      relations: ['producto', 'ingreso', 'ingreso.proveedor'],
    });

    const ventas = await this.ventaDetalleRepository.find({
      where: { lote },
      relations: ['producto', 'venta', 'venta.cliente'],
    });

    const movimientos = await this.movimientoRepository.find({
      where: { lote },
      relations: ['producto', 'almacen'],
    });

    return {
      lote,
      ingresos,
      ventas,
      movimientos,
    };
  }
}
