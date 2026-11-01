import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { Order, Quote } from '@/api/contracts'
import { addEth, compareEth } from '@/lib/eth'
import { buyerProfileSchema, walletNetworkSchema, walletProviderSchema } from '@/lib/validation'
import { requireSession } from '../auth'
import { buildQuote } from '../cart'
import { updateEdition } from '../catalog'
import type { DbOrder } from '../db/schema'
import { db } from '../db/store'
import { apiError, IDEMPOTENT_REPLAY_HEADER, parseBody, withScenario } from '../http'
import { getScenario, type Scenario } from '../scenarios'

const createOrderSchema = z.object({
  quoteId: z.string().min(1),
  walletId: z.string().min(1),
  network: walletNetworkSchema,
  provider: walletProviderSchema,
  buyer: buyerProfileSchema,
})

const PRICE_BUMP_ETH = '0.1000'

/** Edições já alteradas pelos cenários de checkout (uma vez cada, para a nova confirmação passar). */
const scenarioTouched = new Set<string>()

/**
 * Cenários `price-changed` e `sold-out`: o catálogo muda bem na hora da revalidação.
 * Passa pelo mesmo caminho do painel (banco + `nft.updated`), então a tela também recebe o evento.
 */
function applyCheckoutScenario(scenario: Scenario, quote: Quote) {
  if (scenario !== 'price-changed' && scenario !== 'sold-out') return
  const line = quote.lines.find((l) => !scenarioTouched.has(`${scenario}:${l.editionId}`))
  if (!line) return
  scenarioTouched.add(`${scenario}:${line.editionId}`)
  updateEdition(line.nftId, line.editionId, scenario === 'price-changed' ? { priceEth: addEth(line.unitPriceEth, PRICE_BUMP_ETH) } : { available: 0 })
}

/** A cotação que o usuário revisou ainda vale? (mesmos itens, preços, cupom e total) */
function sameQuote(reviewed: Quote, current: Quote) {
  const key = (q: Quote) => q.lines.map((l) => `${l.editionId}:${l.quantity}:${l.unitPriceEth}`).join('|')
  return (
    key(reviewed) === key(current) &&
    (reviewed.coupon?.code ?? null) === (current.coupon?.code ?? null) &&
    compareEth(reviewed.totalEth, current.totalEth) === 0
  )
}

/** JSON com chaves ordenadas: o mesmo conteúdo sempre gera o mesmo hash. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

async function hashBody(body: unknown) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(body)))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function toOrder({ userId: _userId, idempotencyKey: _key, requestHash: _hash, ...order }: DbOrder): Order {
  return order
}

export const orderHandlers = [
  /**
   * Criação idempotente: a mesma `Idempotency-Key` com o mesmo corpo devolve o mesmo pedido
   * (inclusive depois de um timeout); com outro corpo, 409. A cotação é refeita no servidor.
   */
  http.post(
    '/api/orders',
    withScenario(async ({ request }) => {
      const { user } = requireSession(request)
      const key = request.headers.get('idempotency-key')?.trim()
      if (!key) throw apiError(422, 'VALIDATION_ERROR', 'O header Idempotency-Key é obrigatório.')
      const body = await parseBody(request, createOrderSchema)
      const requestHash = await hashBody(body)

      const existing = db.read().orders.find((o) => o.userId === user.id && o.idempotencyKey === key)
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw apiError(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa de compra já foi enviada com outros dados. Revise o pedido e envie de novo.')
        }
        return HttpResponse.json<Order>(toOrder(existing), { status: 200, headers: { [IDEMPOTENT_REPLAY_HEADER]: 'true' } })
      }

      const owner = `user:${user.id}` as const
      const reviewed = db.read().quotes.find((q) => q.id === body.quoteId && q.ownerKey === owner)
      if (reviewed) applyCheckoutScenario(getScenario(request), reviewed)

      const state = db.read()
      const current = buildQuote(state, owner)
      if (!current.lines.length) throw apiError(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')
      const expired = !reviewed || new Date(reviewed.expiresAt).getTime() <= Date.now()
      if (expired || current.issues.length > 0 || !sameQuote(reviewed, current)) {
        throw apiError(409, 'QUOTE_STALE', 'Os valores do pedido mudaram. Revise e confirme novamente.')
      }

      const wallet = state.wallets.find((w) => w.id === body.walletId && w.userId === user.id)
      if (!wallet) throw apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
      const connection = state.walletConnections[user.id]
      if (!connection || connection.walletId !== wallet.id || connection.provider !== body.provider || connection.network !== body.network) {
        throw apiError(409, 'WALLET_NOT_CONNECTED', 'Conecte a carteira selecionada antes de confirmar a compra.')
      }

      const now = new Date().toISOString()
      const order: DbOrder = {
        id: `ord-${crypto.randomUUID().slice(0, 8)}`,
        status: 'pending',
        lines: current.lines,
        coupon: current.coupon,
        subtotalEth: current.subtotalEth,
        discountEth: current.discountEth,
        networkFeeEth: current.networkFeeEth,
        totalEth: current.totalEth,
        network: body.network,
        provider: body.provider,
        walletAddress: wallet.address,
        buyer: body.buyer,
        txHash: null,
        explorerUrl: null,
        failureReason: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
        userId: user.id,
        idempotencyKey: key,
        requestHash,
      }
      db.write((draft) => {
        draft.orders.push(order)
      })
      return HttpResponse.json<Order>(toOrder(order), { status: 201 })
    }),
  ),

  http.get(
    '/api/orders/:orderId',
    withScenario(({ request, params }) => {
      const { user } = requireSession(request)
      const order = db.read().orders.find((o) => o.id === params.orderId && o.userId === user.id)
      if (!order) throw apiError(404, 'NOT_FOUND', 'Pedido não encontrado.')
      return HttpResponse.json<Order>(toOrder(order))
    }),
  ),
]
