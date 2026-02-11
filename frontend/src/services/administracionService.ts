import api from './api';

export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  email?: string;
  activo: boolean;
  rol_id: number;
  rol?: { id: number; nombre: string };
  created_at?: string;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  permisos?: Permiso[];
}

export interface Permiso {
  id: number;
  nombre: string;
  recurso: string;
  accion: string;
  descripcion?: string;
}

export interface Auditoria {
  id: number;
  usuario_id: number;
  usuario?: { id: number; nombre: string; username?: string };
  accion: string;
  modulo: string;
  descripcion?: string;
  ip_address?: string;
  created_at: string;
}

export interface Parametro {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string;
  tipo: string;
}

export const administracionService = {
  getUsuarios: async (): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>('/administracion/usuarios');
    return data;
  },

  getRoles: async (): Promise<Rol[]> => {
    const { data } = await api.get<Rol[]>('/administracion/roles');
    return data;
  },

  getPermisos: async (): Promise<Permiso[]> => {
    const { data } = await api.get<Permiso[]>('/administracion/permisos');
    return data;
  },

  getAuditoria: async (filters?: { usuario_id?: number; modulo?: string }): Promise<Auditoria[]> => {
    const { data } = await api.get<Auditoria[]>('/administracion/auditoria', { params: filters });
    return data;
  },

  getParametros: async (): Promise<Parametro[]> => {
    const { data } = await api.get<Parametro[]>('/administracion/parametros');
    return data;
  },

  updateParametro: async (id: number, valor: string): Promise<Parametro> => {
    const { data } = await api.patch<Parametro>(`/administracion/parametros/${id}`, { valor });
    return data;
  },

  /** Crear rol */
  crearRol: async (payload: {
    nombre: string;
    descripcion?: string;
    activo?: boolean;
    permiso_ids?: number[];
  }): Promise<Rol> => {
    const { data } = await api.post<Rol>('/administracion/roles', payload);
    return data;
  },

  /** Crear usuario (llama a POST /auth/register) */
  crearUsuario: async (payload: {
    username: string;
    password: string;
    nombre: string;
    apellido: string;
    email?: string;
    rol_id: number;
  }): Promise<Usuario> => {
    const { data } = await api.post<Usuario>('/auth/register', payload);
    return data;
  },
};
