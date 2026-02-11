import api from './api';

export interface Proveedor {
  id: number;
  nombre: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  observaciones?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProveedorDto {
  nombre: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  observaciones?: string;
  activo?: boolean;
}

export const proveedoresService = {
  getAll: async (): Promise<Proveedor[]> => {
    const res = await api.get<Proveedor[]>('/proveedores');
    return res.data;
  },
  getById: async (id: number): Promise<Proveedor> => {
    const res = await api.get<Proveedor>(`/proveedores/${id}`);
    return res.data;
  },
  create: async (data: CreateProveedorDto): Promise<Proveedor> => {
    const res = await api.post<Proveedor>('/proveedores', data);
    return res.data;
  },
  update: async (id: number, data: Partial<CreateProveedorDto>): Promise<Proveedor> => {
    const res = await api.patch<Proveedor>(`/proveedores/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/proveedores/${id}`);
  },
};
