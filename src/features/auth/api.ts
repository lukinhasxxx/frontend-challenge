import { queryOptions } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { SessionResponse } from '@/api/contracts'
import { authToken } from '@/api/session-storage'

/** Sessão atual ou `null` para visitante. Fluxos completos de auth chegam na Fase 4. */
export const sessionQueryOptions = queryOptions({
  queryKey: ['auth', 'session'],
  queryFn: async ({ signal }) => {
    if (!authToken.get()) return null
    return (await api.get<SessionResponse>('/auth/session', { signal })).data
  },
  staleTime: 5 * 60_000,
})
