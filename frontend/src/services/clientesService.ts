import api from './api';

export interface Cliente {
  id: number;
  nombre: string;
  razon_social?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  telefono_secundario?: string;
  zona?: string;
  gps?: string;
  email?: string;
  fotografia?: string;
  observaciones?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClienteDto {
  nombre: string;
  razon_social?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  telefono_secundario?: string;
  zona?: string;
  gps?: string;
  email?: string;
  fotografia?: string;
  observaciones?: string;
  activo?: boolean;
}

export const clientesService = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>('/clientes');
    return response.data;
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  create: async (data: CreateClienteDto): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateClienteDto>): Promise<Cliente> => {
    const response = await api.patch<Cliente>(`/clientes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },
};
