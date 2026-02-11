import axios from 'axios';
import {
  getAccessTokenFromMemory,
  getRefreshTokenFromMemory,
  setAuthTokens,
} from './authTokens';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

console.log('API URL configurada:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/** Obtiene el access token: memoria (store) → access_token → auth-storage. */
function getAccessToken(): string | null {
  const fromMemory = getAccessTokenFromMemory();
  if (fromMemory) return fromMemory;
  const direct = localStorage.getItem('access_token');
  if (direct) return direct;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.state?.accessToken ?? data?.accessToken ?? null;
  } catch {
    return null;
  }
}

/** Obtiene el refresh token: memoria → refresh_token → auth-storage. */
function getRefreshToken(): string | null {
  const fromMemory = getRefreshTokenFromMemory();
  if (fromMemory) return fromMemory;
  const direct = localStorage.getItem('refresh_token');
  if (direct) return direct;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.state?.refreshToken ?? data?.refreshToken ?? null;
  } catch {
    return null;
  }
}

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const url = config.url ?? '';
    const esAuth = url.includes('/auth/login') || url.includes('/auth/refresh');
    const token = getAccessToken();

    if (!esAuth && !token) {
      setAuthTokens(null, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      return Promise.reject(new Error('Sesión no válida. Redirigiendo al login.'));
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { 'Content-Type': 'application/json' } },
          );

          const { access_token } = response.data;
          setAuthTokens(access_token, getRefreshToken());
          localStorage.setItem('access_token', access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          setAuthTokens(null, null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // 401 sin refresh token: sesión inválida, ir a login
      setAuthTokens(null, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default api;
