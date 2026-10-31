import { http, HttpResponse } from 'msw'
import type { HealthResponse } from '@/api/contracts'
import { withScenario } from '../http'

export const healthHandlers = [
  http.get(
    '/api/health',
    withScenario(() => HttpResponse.json<HealthResponse>({ status: 'ok', time: new Date().toISOString() })),
  ),
]
