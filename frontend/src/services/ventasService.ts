import api from './api';

export interface VentaDetalleDto {
  producto_id: number;
  lote: string;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
}

export interface CreateVentaDto {
  cliente_id: number;
  almacen_id: number;
  fecha?: string;
  detalles: VentaDetalleDto[];
  descuento?: number;
  tipo_pago?: string;
  /** Fecha límite de pago (solo para ventas a crédito). Formato YYYY-MM-DD. */
  fecha_limite_pago?: string;
  observaciones?: string;
}

export interface VentaDetalle {
  id: number;
  producto_id: number;
  producto?: { id: number; nombre: string; codigo: string; unidad_medida?: string; descripcion?: string };
  lote: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  created_at: string;
}

export interface Venta {
  id: number;
  numero_factura: string;
  fecha: string;
  cliente_id: number;
  cliente?: { id: number; nombre: string; nit?: string; direccion?: string; razon_social?: string };
  almacen_id?: number;
  almacen?: { id: number; nombre: string };
  usuario_id: number;
  subtotal: number;
  descuento: number;
  total: number;
  tipo_pago: string;
  estado: string;
  observaciones?: string;
  detalles?: VentaDetalle[];
  created_at: string;
  updated_at: string;
}

export const ventasService = {
  getAll: async (): Promise<Venta[]> => {
    const response = await api.get<Venta[]>('/ventas');
    return response.data;
  },

  getById: async (id: number): Promise<Venta> => {
    const response = await api.get<Venta>(`/ventas/${id}`);
    return response.data;
  },

  create: async (data: CreateVentaDto): Promise<Venta> => {
    const payload: Record<string, unknown> = {
      cliente_id: Number(data.cliente_id),
      almacen_id: Number(data.almacen_id),
      detalles: data.detalles.map((d) => ({
        producto_id: Number(d.producto_id),
        lote: String(d.lote || 'LOTE-1').trim() || 'LOTE-1',
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
        descuento: Number(d.descuento ?? 0),
      })),
      descuento: Number(data.descuento ?? 0),
      tipo_pago: String(data.tipo_pago || 'CONTADO'),
      ...(data.observaciones != null && data.observaciones !== '' && { observaciones: data.observaciones }),
    };
    if ((data.tipo_pago || '').toUpperCase() === 'CREDITO' && data.fecha_limite_pago?.trim()) {
      payload.fecha_limite_pago = data.fecha_limite_pago.trim();
    }
    const response = await api.post<Venta>('/ventas', payload);
    return response.data;
  },

  anular: async (id: number): Promise<Venta> => {
    const response = await api.patch<Venta>(`/ventas/${id}/anular`, {});
    return response.data;
  },
};
