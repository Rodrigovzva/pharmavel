import api from './api';

export interface CuentaCobrar {
  id: number;
  cliente_id: number;
  venta_id?: number;
  numero_documento: string;
  monto_total: number;
  monto_pagado: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  fecha_pago?: string;
  estado: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  cliente?: { id: number; nombre: string; nit?: string; direccion?: string };
  venta?: { id: number; numero_factura?: string; almacen_id?: number; almacen?: { id: number; nombre: string } };
}

export const cuentasCobrarService = {
  getAll: async (): Promise<CuentaCobrar[]> => {
    const response = await api.get<CuentaCobrar[]>('/cuentas-cobrar');
    return response.data;
  },

  getVencidas: async (): Promise<CuentaCobrar[]> => {
    const response = await api.get<CuentaCobrar[]>('/cuentas-cobrar/vencidas');
    return response.data;
  },

  getPorVencer: async (dias: number = 7): Promise<CuentaCobrar[]> => {
    const response = await api.get<CuentaCobrar[]>('/cuentas-cobrar/por-vencer', { params: { dias } });
    return response.data;
  },

  getById: async (id: number): Promise<CuentaCobrar> => {
    const response = await api.get<CuentaCobrar>(`/cuentas-cobrar/${id}`);
    return response.data;
  },

  registrarPago: async (id: number, monto: number): Promise<CuentaCobrar> => {
    const response = await api.post<CuentaCobrar>(`/cuentas-cobrar/${id}/pago`, { monto });
    return response.data;
  },

  sincronizar: async (): Promise<{ creadas: number; ventas: unknown[] }> => {
    const response = await api.post<{ creadas: number; ventas: unknown[] }>('/cuentas-cobrar/sincronizar');
    return response.data;
  },
};
