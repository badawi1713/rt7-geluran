import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/types'

export interface AuthUserData {
  jwt?: string
  nama?: string
  email?: string
  role_name?: string
  [key: string]: unknown
}

export interface AuthUser {
  role: string[]
  displayName: string
  email?: string
  raw: AuthUserData
}

export interface SignInPayload {
  no_wa: string
  password: string
}

function toUser(data: AuthUserData): AuthUser {
  return {
    role: data.role_name ? [data.role_name.toLowerCase()] : [],
    displayName: data.nama || 'Anonymous',
    email: data.email,
    raw: data,
  }
}

export async function signIn(payload: SignInPayload) {
  const res = await api.post<ApiResponse<AuthUserData>>('/v1/api/auth', payload, {
    skipSessionCheck: true,
  })
  const data = res.data?.data
  if (!data?.jwt) throw new Error('Gagal masuk. Silakan coba lagi.')
  return { token: data.jwt, user: toUser(data) }
}

/** Validates the stored token with the server and returns the signed-in user. */
export async function fetchCurrentUser() {
  const res = await api.get<ApiResponse<AuthUserData>>('/v1/api/access-token')
  const data = res.data?.data
  if (!data) throw new Error('Gagal akses dengan token.')
  return toUser(data)
}
