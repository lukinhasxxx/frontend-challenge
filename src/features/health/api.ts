import { queryOptions } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { HealthResponse } from '@/api/contracts/health'

export const healthQueryOptions = queryOptions({
  queryKey: ['health'],
  queryFn: async ({ signal }) => (await api.get<HealthResponse>('/health', { signal })).data,
})
