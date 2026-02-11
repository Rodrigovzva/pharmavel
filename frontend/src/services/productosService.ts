import api from './api';

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria?: string;
  descripcion?: string;
  unidad_medida: string;
  precio_compra: number;
  precio_venta: number;
  stock_minimo: number;
  imagen?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductoDto {
  codigo: string;
  nombre: string;
  categoria?: string;
  descripcion?: string;
  unidad_medida?: string;
  precio_compra?: number;
  precio_venta?: number;
  stock_minimo?: number;
  imagen?: string;
  activo?: boolean;
}

export const productosService = {
  getAll: async (): Promise<Producto[]> => {
    const response = await api.get<Producto[]>('/productos');
    return response.data;
  },

  getById: async (id: number): Promise<Producto> => {
    const response = await api.get<Producto>(`/productos/${id}`);
    return response.data;
  },

  getByCodigo: async (codigo: string): Promise<Producto> => {
    const response = await api.get<Producto>(`/productos/codigo/${codigo}`);
    return response.data;
  },

  create: async (data: CreateProductoDto): Promise<Producto> => {
    const response = await api.post<Producto>('/productos', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateProductoDto>): Promise<Producto> => {
    const response = await api.patch<Producto>(`/productos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/productos/${id}`);
  },
};
