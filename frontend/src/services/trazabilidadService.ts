import api from './api';

export interface TrazabilidadProducto {
  producto: {
    id: number;
    codigo: string;
    nombre: string;
  };
  trazabilidad: {
    ingresos: any[];
    ventas: any[];
    movimientos: any[];
  };
}

export interface TrazabilidadLote {
  lote: string;
  ingresos: any[];
  ventas: any[];
  movimientos: any[];
}

export const trazabilidadService = {
  trazarProducto: async (productoId: number, lote?: string): Promise<TrazabilidadProducto | null> => {
    const params = lote ? { lote } : {};
    const response = await api.get<TrazabilidadProducto | null>(
      `/trazabilidad/producto/${productoId}`,
      { params },
    );
    return response.data;
  },

  trazarLote: async (lote: string): Promise<TrazabilidadLote> => {
    const response = await api.get<TrazabilidadLote>(`/trazabilidad/lote/${encodeURIComponent(lote)}`);
    return response.data;
  },
};
