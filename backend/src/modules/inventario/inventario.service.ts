import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimientoInventario } from '../../entities/movimiento-inventario.entity';

export interface StockPorAlmacen {
  almacen_id: number;
  almacen_nombre: string;
  producto_id: number;
  producto_codigo: string;
  producto_nombre: string;
  cantidad: number;
  lote?: string;
}

export interface StockPorLote {
  almacen_id: number;
  almacen_nombre: string;
  producto_id: number;
  producto_codigo: string;
  producto_nombre: string;
  lote: string;
  cantidad: number;
  fecha_vencimiento: string;
}

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(MovimientoInventario)
    private movimientoRepository: Repository<MovimientoInventario>,
  ) {}

  /**
   * Obtiene el stock actual por producto y almacén.
   * Usa el stock_actual del último movimiento de cada (producto_id, almacen_id).
   */
  async getStockPorAlmacen(almacenId?: number): Promise<StockPorAlmacen[]> {
    const qb = this.movimientoRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.producto', 'producto')
      .leftJoinAndSelect('m.almacen', 'almacen')
      .orderBy('m.created_at', 'DESC');

    if (almacenId != null) {
      qb.where('m.almacen_id = :almacenId', { almacenId });
    }

    const movimientos = await qb.getMany();

    const seen = new Set<string>();
    const result: StockPorAlmacen[] = [];
    for (const m of movimientos) {
      const key = `${m.producto_id}-${m.almacen_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const almacen = (m as any).almacen;
      const producto = (m as any).producto;
      result.push({
        almacen_id: m.almacen_id,
        almacen_nombre: almacen?.nombre ?? '',
        producto_id: m.producto_id,
        producto_codigo: producto?.codigo ?? '',
        producto_nombre: producto?.nombre ?? '',
        cantidad: Number(m.stock_actual ?? 0),
        lote: m.lote,
      });
    }
    return result.sort((a, b) => a.almacen_nombre.localeCompare(b.almacen_nombre) || a.producto_nombre.localeCompare(b.producto_nombre));
  }

  /**
   * Obtiene el stock por lote (almacén, producto, lote) con fecha de vencimiento.
   * Cantidad = suma ENTRADA - suma SALIDA por (almacen_id, producto_id, lote).
   */
  async getStockPorLote(almacenId?: number): Promise<StockPorLote[]> {
    const qb = this.movimientoRepository
      .createQueryBuilder('m')
      .leftJoin('m.producto', 'p')
      .leftJoin('m.almacen', 'a');

    if (almacenId != null) {
      qb.where('m.almacen_id = :almacenId', { almacenId });
    }

    qb
      .select('m.almacen_id', 'almacen_id')
      .addSelect('a.nombre', 'almacen_nombre')
      .addSelect('m.producto_id', 'producto_id')
      .addSelect('p.codigo', 'producto_codigo')
      .addSelect('p.nombre', 'producto_nombre')
      .addSelect('m.lote', 'lote')
      .addSelect('MAX(m.fecha_vencimiento)', 'fecha_vencimiento')
      .addSelect(
        `SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.cantidad ELSE -m.cantidad END)`,
        'cantidad',
      )
      .groupBy('m.almacen_id')
      .addGroupBy('a.nombre')
      .addGroupBy('m.producto_id')
      .addGroupBy('p.codigo')
      .addGroupBy('p.nombre')
      .addGroupBy('m.lote')
      .having('SUM(CASE WHEN m.tipo = \'ENTRADA\' THEN m.cantidad ELSE -m.cantidad END) > 0');

    const rows = await qb.getRawMany();
    const result: StockPorLote[] = rows.map((r) => ({
      almacen_id: r.almacen_id,
      almacen_nombre: r.almacen_nombre ?? '',
      producto_id: r.producto_id,
      producto_codigo: r.producto_codigo ?? '',
      producto_nombre: r.producto_nombre ?? '',
      lote: r.lote ?? '',
      cantidad: Number(r.cantidad ?? 0),
      fecha_vencimiento: r.fecha_vencimiento
        ? new Date(r.fecha_vencimiento).toISOString().slice(0, 10)
        : '',
    }));

    return result.sort((a, b) => {
      const fvA = a.fecha_vencimiento || '9999-12-31';
      const fvB = b.fecha_vencimiento || '9999-12-31';
      return fvA.localeCompare(fvB) || a.producto_nombre.localeCompare(b.producto_nombre);
    });
  }
}
