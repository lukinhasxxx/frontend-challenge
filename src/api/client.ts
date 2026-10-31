import axios, { isCancel } from 'axios'
import { toApiClientError } from './errors'
import { emitSessionInvalid } from './session-events'
import { authToken, getGuestId } from './session-storage'

export const API_TIMEOUT_MS = 10_000

/** Instância única do Axios usada por todas as features. */
export const api = axios.create({ baseURL: '/api', timeout: API_TIMEOUT_MS })

api.interceptors.request.use((config) => {
  const token = authToken.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Guest-Id'] = getGuestId()
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Cancelamentos (AbortSignal do TanStack Query) seguem como estão.
    if (isCancel(error)) return Promise.reject(error)

    const apiError = toApiClientError(error)
    const tokenRejected = apiError.code === 'SESSION_EXPIRED' || apiError.code === 'UNAUTHENTICATED'
    if (apiError.status === 401 && tokenRejected && authToken.get()) {
      authToken.clear()
      emitSessionInvalid(apiError.code as 'SESSION_EXPIRED' | 'UNAUTHENTICATED')
    }
    return Promise.reject(apiError)
  },
)
