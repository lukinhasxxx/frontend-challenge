import type { Order } from '@/api/contracts'
import { updateEdition } from './catalog'
import type { DbOrder } from './db/schema'
import { db } from './db/store'
import { publishOrderUpdated } from './events'

/** Tempo que a "rede" leva para confirmar ou recusar o pagamento. */
export const SETTLE_DELAY_MS = 1_800

const EXPLORER: Record<Order['network'], string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function toOrder({ userId: _u, idempotencyKey: _k, requestHash: _h, settleAs: _s, settleAt: _a, ...order }: DbOrder): Order {
  return order
}

function randomTxHash() {
  return `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Liquida um pedido pendente (estados terminais: confirmado ou recusado) e publica `order.updated`.
 * Confirmado: tira do carrinho só os itens e quantidades comprados e baixa o estoque.
 * Pedido que já não está pendente não muda (idempotente).
 */
export function settleOrder(orderId: string, status: 'confirmed' | 'declined'): Order | null {
  const result = db.write((state) => {
    const order = state.orders.find((o) => o.id === orderId)
    if (!order || order.status !== 'pending') return null
    const previous = toOrder(structuredClone(order))

    order.status = status
    order.version += 1
    order.updatedAt = new Date().toISOString()
    order.settleAs = null
    order.settleAt = null
    if (status === 'confirmed') {
      order.txHash = randomTxHash()
      order.explorerUrl = `${EXPLORER[order.network]}${order.txHash}`
      const owner = `user:${order.userId}` as const
      const cart = state.carts[owner] ?? []
      for (const line of order.lines) {
        const item = cart.find((i) => i.editionId === line.editionId)
        if (item) item.quantity -= line.quantity
      }
      state.carts[owner] = cart.filter((i) => i.quantity > 0)
    } else {
      order.failureReason = 'O pagamento foi recusado pela carteira. Nenhum valor foi cobrado.'
    }
    return { previous, next: toOrder(structuredClone(order)), userId: order.userId }
  })
  if (!result) return null
  clearTimeout(timers.get(orderId))
  timers.delete(orderId)

  if (status === 'confirmed') {
    for (const line of result.next.lines) {
      const edition = db.read().nfts.find((n) => n.id === line.nftId)?.editions.find((e) => e.id === line.editionId)
      if (edition) updateEdition(line.nftId, line.editionId, { available: Math.max(0, edition.available - line.quantity) })
    }
  }
  publishOrderUpdated(result.previous, result.next, result.userId)
  return result.next
}

/** Agenda a liquidação automática (cenários `default` e `payment-declined`). */
export function scheduleSettlement(order: Pick<DbOrder, 'id' | 'status' | 'settleAs' | 'settleAt'>) {
  if (order.status !== 'pending' || !order.settleAs || !order.settleAt || timers.has(order.id)) return
  const status = order.settleAs
  const wait = Math.max(0, new Date(order.settleAt).getTime() - Date.now())
  timers.set(
    order.id,
    setTimeout(() => settleOrder(order.id, status), wait),
  )
}

/** Boot do mock: um refresh perde os timers, então os pedidos pendentes são reagendados. */
export function resumeSettlements() {
  db.read().orders.forEach(scheduleSettlement)
}

/** Consulta REST de pedido vencido: liquida antes de responder (não depende do timer). */
export function settleIfDue(order: DbOrder) {
  if (order.status === 'pending' && order.settleAs && order.settleAt && new Date(order.settleAt).getTime() <= Date.now()) {
    settleOrder(order.id, order.settleAs)
  }
}

export function resetSettlements() {
  timers.forEach(clearTimeout)
  timers.clear()
}
