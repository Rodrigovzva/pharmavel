import api from './api';

export interface IngresoDetalleDto {
  producto_id: number;
  lote: string;
  cantidad: number;
  precio_unitario: number;
  fecha_vencimiento: string;
}

export interface CreateIngresoDto {
  proveedor_id: number;
  almacen_id: number;
  fecha?: string;
  detalles: IngresoDetalleDto[];
  observaciones?: string;
}

export interface IngresoDetalle {
  id: number;
  producto_id: number;
  producto?: { id: number; nombre: string; codigo: string; unidad_medida?: string; descripcion?: string };
  lote: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  fecha_vencimiento: string;
  created_at: string;
}

export interface Ingreso {
  id: number;
  numero_documento: string;
  fecha: string;
  proveedor_id: number;
  proveedor?: { id: number; nombre: string; nit?: string; direccion?: string };
  almacen_id: number;
  almacen?: { id: number; nombre: string };
  usuario_id: number;
  total: number;
  estado: string;
  observaciones?: string;
  detalles?: IngresoDetalle[];
  created_at: string;
  updated_at: string;
}

export const ingresosService = {
  getAll: async (): Promise<Ingreso[]> => {
    const res = await api.get<Ingreso[]>('/ingresos');
    return res.data;
  },
  getById: async (id: number): Promise<Ingreso> => {
    const res = await api.get<Ingreso>(`/ingresos/${id}`);
    return res.data;
  },
  create: async (data: CreateIngresoDto): Promise<Ingreso> => {
    const payload = {
      proveedor_id: data.proveedor_id,
      almacen_id: data.almacen_id,
      detalles: data.detalles.map((d) => ({
        producto_id: d.producto_id,
        lote: d.lote || 'LOTE-1',
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        fecha_vencimiento: d.fecha_vencimiento
          ? new Date(d.fecha_vencimiento).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      })),
      ...(data.observaciones && { observaciones: data.observaciones }),
    };
    const res = await api.post<Ingreso>('/ingresos', payload);
    return res.data;
  },
};
