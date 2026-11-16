import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'jwt_access_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/** Epoch milliseconds when the token expires, or null if it has no readable `exp`. */
export function getTokenExpiry(token: string): number | null {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token)
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

/** A malformed token counts as expired; a token without `exp` is left for the server to judge. */
export function isTokenExpired(token: string): boolean {
  try {
    jwtDecode(token)
  } catch {
    return true
  }
  const expiry = getTokenExpiry(token)
  return expiry !== null && expiry <= Date.now()
}
