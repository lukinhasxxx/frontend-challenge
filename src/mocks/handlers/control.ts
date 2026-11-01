import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { isEthAmount } from '@/lib/eth'
import { updateEdition } from '../catalog'
import { db } from '../db/store'
import { emitStaleEvent, getLastEvent, replayLastEvent, resetEvents } from '../events'
import { apiError, parseBody } from '../http'
import { resetSettlements, settleOrder, toOrder } from '../orders'
import { getScenario, SCENARIOS } from '../scenarios'
import { dropConnections, getSocketStats } from '../socket'

/**
 * Endpoints de controle da simulação, usados pelo painel Mock DevTools e pelos
 * testes E2E. Toda mudança passa pelo banco e é publicada pelo socket — nunca
 * direto no estado da interface.
 */

const editionChangeSchema = z
  .object({
    editionId: z.string().min(1),
    priceEth: z.string().refine(isEthAmount, 'Use um valor ETH como 0.4500.').optional(),
    available: z.number().int().min(0).optional(),
  })
  .refine((body) => body.priceEth !== undefined || body.available !== undefined, 'Informe preço ou disponibilidade.')

const settleSchema = z.object({ status: z.enum(['confirmed', 'declined']), orderId: z.string().optional() })

const dropSchema = z.object({ downForMs: z.number().int().min(0).max(60_000).default(5_000) })

export const controlHandlers = [
  http.get('/__mock/state', () => {
    const state = db.read()
    return HttpResponse.json({
      scenario: getScenario(),
      scenarios: SCENARIOS,
      socket: getSocketStats(),
      lastEvent: getLastEvent(),
      nfts: state.nfts.map(({ id, name, version, editions }) => ({ id, name, version, editions })),
      pendingOrders: state.orders.filter((o) => o.status === 'pending').map(toOrder),
    })
  }),

  http.post('/__mock/reset', () => {
    db.reset()
    resetEvents()
    resetSettlements()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/__mock/session/expire', () => {
    const past = new Date(Date.now() - 1_000).toISOString()
    db.write((state) => {
      state.sessions.forEach((session) => (session.expiresAt = past))
    })
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/__mock/nfts/:nftId', async ({ request, params }) => {
    try {
      const { editionId, ...change } = await parseBody(request, editionChangeSchema)
      const nft = updateEdition(String(params.nftId), editionId, change)
      return nft ? HttpResponse.json(nft) : apiError(404, 'NOT_FOUND', 'NFT ou edição não encontrado.')
    } catch (thrown) {
      if (thrown instanceof Response) return thrown
      throw thrown
    }
  }),

  // Força o resultado do pagamento: o pedido indicado ou o pendente mais recente.
  http.post('/__mock/orders/settle', async ({ request }) => {
    try {
      const { status, orderId } = await parseBody(request, settleSchema)
      const pending = db.read().orders.filter((o) => o.status === 'pending')
      const target = orderId ? pending.find((o) => o.id === orderId) : pending.at(-1)
      if (!target) return apiError(404, 'NOT_FOUND', 'Nenhum pedido pendente.')
      return HttpResponse.json(settleOrder(target.id, status))
    } catch (thrown) {
      if (thrown instanceof Response) return thrown
      throw thrown
    }
  }),

  http.post('/__mock/socket/drop', async ({ request }) => {
    const body: unknown = await request.json().catch(() => ({}))
    const { downForMs } = dropSchema.parse(body ?? {})
    dropConnections(downForMs)
    return HttpResponse.json(getSocketStats())
  }),

  http.post('/__mock/events/replay-last', () => {
    const event = replayLastEvent()
    return event ? HttpResponse.json(event) : apiError(404, 'NOT_FOUND', 'Nenhum evento emitido ainda.')
  }),

  http.post('/__mock/events/stale', () => {
    const event = emitStaleEvent()
    return event ? HttpResponse.json(event) : apiError(404, 'NOT_FOUND', 'Altere um NFT ou pedido antes de emitir um evento antigo.')
  }),
]
