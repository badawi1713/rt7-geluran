import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { SessionExpiredError, getErrorMessage } from './api'

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      /** Show a toast when this query fails. Defaults to true. */
      toastOnError?: boolean
    }
    mutationMeta: {
      successMessage?: string
    }
  }
}

// The session-expired toast is shown once by the auth provider, so skip it here.
function shouldToast(error: unknown) {
  return !(error instanceof SessionExpiredError)
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.toastOnError === false || !shouldToast(error)) return
      toast.error(getErrorMessage(error))
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.successMessage) toast.success(mutation.meta.successMessage)
    },
    onError: (error) => {
      if (shouldToast(error)) toast.error(getErrorMessage(error))
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof SessionExpiredError) return false
        const status = axios.isAxiosError(error) ? error.response?.status : undefined
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
  },
})
