import { http, HttpResponse } from 'msw'
import type { HealthResponse } from '@/api/contracts/health'

export const healthHandlers = [
  http.get('/api/health', () =>
    HttpResponse.json<HealthResponse>({ status: 'ok', time: new Date().toISOString() }),
  ),
]
