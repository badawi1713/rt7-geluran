import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearToken, getToken, isTokenExpired } from './token'

export const SESSION_EXPIRED_MESSAGE = 'Maaf, sesi sudah berakhir. Silakan login kembali'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Set on requests (like sign-in) where a 401 means bad credentials, not an expired session. */
    skipSessionCheck?: boolean
  }
}

export class SessionExpiredError extends Error {
  constructor(message = SESSION_EXPIRED_MESSAGE) {
    super(message)
    this.name = 'SessionExpiredError'
  }
}

type SessionExpiredListener = (message: string) => void
const listeners = new Set<SessionExpiredListener>()

/** Subscribe to session expiry (expired JWT before a request, or a 401 from the server). */
export function onSessionExpired(listener: SessionExpiredListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Several requests can fail at once with an expired token; notify only once per session.
let expiryNotified = false

export function resetSessionExpiry() {
  expiryNotified = false
}

export function expireSession(message = SESSION_EXPIRED_MESSAGE) {
  clearToken()
  if (expiryNotified) return
  expiryNotified = true
  listeners.forEach((listener) => listener(message))
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (!token || config.skipSessionCheck) return config

  // Don't send a request we already know the server will reject.
  if (isTokenExpired(token)) {
    expireSession()
    return Promise.reject(new SessionExpiredError())
  }

  config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ServerError>) => {
    const status = error.response?.status
    const config = error.config
    if (!config || config.skipSessionCheck) return Promise.reject(error)

    // Expired/invalid token -> 401. No token at all (e.g. cleared in another tab) -> 403.
    const sentToken = !!config.headers?.Authorization
    if (status === 401 || (status === 403 && !sentToken)) {
      const message = error.response?.data?.rd || SESSION_EXPIRED_MESSAGE
      expireSession(message)
      return Promise.reject(new SessionExpiredError(message))
    }
    return Promise.reject(error)
  },
)

/** Error bodies seen from the backend: `{ message, errors[] }` or `{ rd }`. */
interface ServerError {
  message?: string
  rd?: string
  errors?: string[]
}

function serverMessage(data: ServerError | undefined) {
  return data?.message || data?.rd || data?.errors?.[0]
}

/** Same message rules as the original redux actions. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof SessionExpiredError) return error.message
  if (axios.isAxiosError<ServerError>(error)) {
    if (!error.response) return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
    const fromServer = serverMessage(error.response.data)
    if (error.response.status >= 500) {
      return fromServer || 'Maaf, terjadi kesalahan. Silakan dicoba kembali.'
    }
    return fromServer || error.message
  }
  if (error instanceof Error) return error.message
  return 'Maaf, terjadi kesalahan. Silakan dicoba kembali.'
}
