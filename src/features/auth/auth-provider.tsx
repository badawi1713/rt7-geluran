import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { expireSession, onSessionExpired, resetSessionExpiry } from '@/lib/api'
import { clearToken, getToken, getTokenExpiry, isTokenExpired, setToken } from '@/lib/token'
import { type AuthUser, type SignInPayload, fetchCurrentUser, signIn } from './api'

type AuthStatus = 'checking' | 'authenticated' | 'guest'

interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  signIn: (payload: SignInPayload) => Promise<void>
  isSigningIn: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const sessionQueryKey = ['auth', 'session'] as const

// setTimeout overflows past ~24.8 days and fires immediately, so clamp long waits.
const MAX_TIMEOUT = 2 ** 31 - 1

function readInitialToken() {
  const token = getToken()
  if (!token) return null
  if (isTokenExpired(token)) {
    clearToken()
    queueMicrotask(() => toast.error('Maaf, sesi sudah berakhir. Silakan login kembali'))
    return null
  }
  return token
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setTokenState] = useState<string | null>(readInitialToken)

  const session = useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchCurrentUser,
    enabled: !!token,
    staleTime: Infinity,
    retry: false,
    meta: { toastOnError: false },
  })

  const endSession = useCallback(() => {
    clearToken()
    setTokenState(null)
    queryClient.clear()
  }, [queryClient])

  // Expired token or 401 anywhere in the app: drop the session; the route guard redirects.
  useEffect(
    () =>
      onSessionExpired((message) => {
        endSession()
        toast.error(message)
      }),
    [endSession],
  )

  // Sign out as soon as the token's `exp` passes, even if the user is idle.
  useEffect(() => {
    if (!token) return
    const expiry = getTokenExpiry(token)
    if (expiry === null) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      const wait = expiry - Date.now()
      if (wait <= 0) return expireSession()
      timer = setTimeout(schedule, Math.min(wait, MAX_TIMEOUT))
    }
    schedule()
    return () => clearTimeout(timer)
  }, [token])

  // The stored token was rejected while validating it on load.
  useEffect(() => {
    if (session.isError && token) {
      endSession()
      toast.error('Gagal akses dengan token.')
    }
  }, [session.isError, token, endSession])

  const signInMutation = useMutation({
    mutationFn: signIn,
    onSuccess: ({ token: newToken, user }) => {
      setToken(newToken)
      resetSessionExpiry()
      queryClient.setQueryData(sessionQueryKey, user)
      setTokenState(newToken)
      toast.success('Selamat datang')
    },
  })

  const signOut = useCallback(() => {
    endSession()
    toast('Terima kasih')
  }, [endSession])

  let status: AuthStatus = 'guest'
  if (token && session.data) status = 'authenticated'
  else if (token && !session.isError) status = 'checking'

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session.data ?? null,
      signIn: async (payload) => {
        await signInMutation.mutateAsync(payload)
      },
      isSigningIn: signInMutation.isPending,
      signOut,
    }),
    [status, session.data, signInMutation, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
