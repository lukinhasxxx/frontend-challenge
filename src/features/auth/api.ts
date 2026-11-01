import { queryOptions, useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AuthResponse, LoginRequest, RegisterRequest, SessionResponse } from '@/api/contracts'
import { ApiClientError } from '@/api/errors'
import { authToken } from '@/api/session-storage'

/** Sessão atual ou `null` para visitante (token ausente, inválido ou expirado). */
export const sessionQueryOptions = queryOptions({
  queryKey: ['auth', 'session'],
  queryFn: async ({ signal }): Promise<SessionResponse | null> => {
    if (!authToken.get()) return null
    try {
      return (await api.get<SessionResponse>('/auth/session', { signal })).data
    } catch (error) {
      // 401: o interceptor já removeu o token e avisou a sessão; aqui vira visitante.
      if (error instanceof ApiClientError && error.status === 401) return null
      throw error
    }
  },
  staleTime: 5 * 60_000,
})

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (body: LoginRequest) => (await api.post<AuthResponse>('/auth/login', body)).data,
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (body: RegisterRequest) => (await api.post<AuthResponse>('/auth/register', body)).data,
  })
}

/** Encerra a sessão no servidor; falha de rede não impede o logout local. */
export async function logoutRequest() {
  try {
    await api.post('/auth/logout')
  } catch {
    // O token é descartado localmente de qualquer forma.
  }
}
