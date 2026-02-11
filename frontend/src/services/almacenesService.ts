import api from './api';

export interface Almacen {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  observaciones?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAlmacenDto {
  nombre: string;
  direccion?: string;
  telefono?: string;
  observaciones?: string;
  activo?: boolean;
}

export const almacenesService = {
  getAll: async (): Promise<Almacen[]> => {
    const response = await api.get<Almacen[]>('/almacenes');
    return response.data;
  },

  getById: async (id: number): Promise<Almacen> => {
    const response = await api.get<Almacen>(`/almacenes/${id}`);
    return response.data;
  },

  create: async (data: CreateAlmacenDto): Promise<Almacen> => {
    const response = await api.post<Almacen>('/almacenes', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateAlmacenDto>): Promise<Almacen> => {
    const response = await api.patch<Almacen>(`/almacenes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/almacenes/${id}`);
  },
};
