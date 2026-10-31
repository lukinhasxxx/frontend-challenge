import { QueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/api/errors'

const MAX_RETRIES = 2

/**
 * Política de cache/retry (documentar no ARCHITECTURE.md):
 * - staleTime 30s: evita refetch em navegação rápida; tempo real cobre mudanças.
 * - retry só para falhas transitórias (rede/timeout/5xx); 4xx nunca é repetido.
 * - mutations nunca fazem retry automático (evita operações duplicadas).
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiClientError && !error.isTransient) return false
          return failureCount < MAX_RETRIES
        },
      },
      mutations: { retry: false },
    },
  })
}
