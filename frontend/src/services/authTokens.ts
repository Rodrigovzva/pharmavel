/**
 * Holder del token en memoria. Lo actualiza el auth store (login/rehidratación)
 * y lo lee el interceptor de api. Evita dependencia de timing con localStorage.
 */

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAuthTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
}

export function getAccessTokenFromMemory(): string | null {
  return accessToken;
}

export function getRefreshTokenFromMemory(): string | null {
  return refreshToken;
}
