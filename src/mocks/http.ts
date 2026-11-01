import { delay, HttpResponse, type DefaultBodyType, type HttpResponseResolver, type PathParams } from 'msw'
import type { z } from 'zod'
import type { ApiError, ErrorCode } from '@/api/contracts'
import { createRng } from './rng'
import { getScenario, type Scenario } from './scenarios'

const DEFAULT_LATENCY_MS = 150
const SLOW_LATENCY_MS = 2_500
/** Maior que o timeout do Axios (10 s). */
const TIMEOUT_DELAY_MS = 12_000

/** Marca a resposta de uma requisição idempotente repetida (mesma chave, mesmo corpo). */
export const IDEMPOTENT_REPLAY_HEADER = 'Idempotent-Replayed'

const latencyRng = createRng(42)
let outOfOrderCounter = 0

async function applyLatency(scenario: Scenario) {
  switch (scenario) {
    case 'slow':
      return delay(SLOW_LATENCY_MS)
    case 'variable-latency':
      return delay(latencyRng.int(200, 1_800))
    case 'out-of-order': {
      // 2000, 1550, 1100, 650, 200, 2000… cada requisição é mais rápida que a anterior.
      const step = outOfOrderCounter++ % 5
      return delay(2_000 - step * 450)
    }
    default:
      return delay(DEFAULT_LATENCY_MS)
  }
}

export function apiError(status: number, code: ErrorCode, message: string, fieldErrors?: Record<string, string>) {
  return HttpResponse.json<ApiError>({ code, message, ...(fieldErrors && { fieldErrors }) }, { status })
}

type Resolver = HttpResponseResolver<PathParams, DefaultBodyType, DefaultBodyType>

/**
 * Envolve um handler REST aplicando o cenário ativo (latência, falhas, timeout).
 * Handlers podem lançar uma `Response` (ex.: `throw apiError(...)`) para encerrar.
 */
export function withScenario(resolver: Resolver): Resolver {
  return async (info) => {
    const scenario = getScenario(info.request)
    await applyLatency(scenario)

    if (scenario === 'offline') return HttpResponse.error()
    if (scenario === 'error-500') return apiError(500, 'INTERNAL_ERROR', 'Falha temporária no servidor. Tente novamente.')

    let response: Awaited<ReturnType<Resolver>>
    try {
      response = await resolver(info)
    } catch (thrown) {
      if (thrown instanceof Response) return thrown
      throw thrown
    }

    // A operação aconteceu, mas a resposta chega tarde demais para o cliente. A repetição
    // idempotente (pedido já existente) responde na hora: é assim que o cliente se recupera.
    const replayed = response instanceof Response && response.headers.get(IDEMPOTENT_REPLAY_HEADER) === 'true'
    if (scenario === 'timeout' && !replayed) await delay(TIMEOUT_DELAY_MS)
    return response
  }
}

/** Lê e valida o corpo JSON; lança 422 com erros por campo. */
export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  const body: unknown = await request.json().catch(() => null)
  const result = schema.safeParse(body)
  if (result.success) return result.data

  const fieldErrors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || '_root'
    fieldErrors[field] ??= issue.message
  }
  throw apiError(422, 'VALIDATION_ERROR', 'Dados inválidos.', fieldErrors)
}
