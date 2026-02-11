import api from './api';

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

export const inventarioService = {
  getStockPorAlmacen: async (almacenId?: number): Promise<StockPorAlmacen[]> => {
    const params = almacenId != null ? { almacen_id: almacenId } : {};
    const response = await api.get<StockPorAlmacen[]>('/inventario', { params });
    return response.data;
  },

  getStockPorLote: async (almacenId?: number): Promise<StockPorLote[]> => {
    const params = almacenId != null ? { almacen_id: almacenId } : {};
    const response = await api.get<StockPorLote[]>('/inventario/por-lote', { params });
    return response.data;
  },
};
