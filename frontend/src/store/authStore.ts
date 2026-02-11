import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, AuthResponse } from '../services/authService';
import { setAuthTokens } from '../services/authTokens';

let rehydrated = false;
/** Resuelve cuando el store persistido ha rehidratado y los tokens están en localStorage. */
export function waitForRehydration(): Promise<void> {
  if (rehydrated) return Promise.resolve();
  return Promise.race([
    new Promise<void>((resolve) => {
      const check = () => {
        if (rehydrated) resolve();
        else setTimeout(check, 20);
      };
      check();
    }),
    new Promise<void>((r) => setTimeout(r, 2000)),
  ]);
}

interface User {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  email?: string;
  rol: {
    id: number;
    nombre: string;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (authData: AuthResponse) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await authService.login({ username, password });
          set({
            user: response.user,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
          });
          setAuthTokens(response.access_token, response.refresh_token);
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
        } catch (error: any) {
          console.error('Error en login:', error);
          const message = error.response?.data?.message || error.message || 'Error al iniciar sesión';
          throw new Error(message);
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          setAuthTokens(null, null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      },

      setAuth: (authData: AuthResponse) => {
        set({
          user: authData.user,
          accessToken: authData.access_token,
          refreshToken: authData.refresh_token,
          isAuthenticated: true,
        });
        setAuthTokens(authData.access_token, authData.refresh_token);
        localStorage.setItem('access_token', authData.access_token);
        localStorage.setItem('refresh_token', authData.refresh_token);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // Sincronizar tokens a localStorage cuando se rehidrata (recarga/pestaña nueva)
      // para que el interceptor de api encuentre el token en las peticiones.
      onRehydrateStorage: () => (state) => {
        rehydrated = true;
        if (state?.accessToken) {
          setAuthTokens(state.accessToken, state.refreshToken ?? null);
          localStorage.setItem('access_token', state.accessToken);
        }
        if (state?.refreshToken) localStorage.setItem('refresh_token', state.refreshToken);
      },
    },
  ),
);
