import type { Nft, NftUpdatedEvent, Order, OrderUpdatedEvent, RealtimeEvent } from '@/api/contracts'
import { broadcast } from './socket'

let lastEvent: RealtimeEvent | null = null
/** Snapshot anterior de cada NFT/pedido alterado, para simular eventos antigos. */
const previousNfts = new Map<string, Nft>()
const previousOrders = new Map<string, { order: Order; userId: string }>()

function nftUpdatedEvent(nft: Nft): NftUpdatedEvent {
  return {
    eventId: crypto.randomUUID(),
    type: 'nft.updated',
    resourceId: nft.id,
    version: nft.version,
    occurredAt: new Date().toISOString(),
    payload: nft,
  }
}

function orderUpdatedEvent(order: Order, userId: string): OrderUpdatedEvent {
  return {
    eventId: crypto.randomUUID(),
    type: 'order.updated',
    resourceId: order.id,
    version: order.version,
    occurredAt: new Date().toISOString(),
    userId,
    payload: order,
  }
}

export function publish(event: RealtimeEvent) {
  lastEvent = event
  broadcast(event)
}

/** Chamado sempre que preço/disponibilidade de um NFT muda no banco. */
export function publishNftUpdated(previous: Nft, next: Nft) {
  previousNfts.set(next.id, previous)
  publish(nftUpdatedEvent(next))
}

/** Chamado quando o status de um pedido muda (só o dono recebe). */
export function publishOrderUpdated(previous: Order, next: Order, userId: string) {
  previousOrders.set(next.id, { order: previous, userId })
  publish(orderUpdatedEvent(next, userId))
}

export function getLastEvent() {
  return lastEvent
}

/** Reenvia o último evento com o MESMO eventId (duplicata). */
export function replayLastEvent() {
  if (!lastEvent) return null
  broadcast(lastEvent)
  return lastEvent
}

/** Emite um evento novo (eventId inédito) com a versão ANTERIOR do último recurso alterado. */
export function emitStaleEvent() {
  if (!lastEvent) return null
  let stale: RealtimeEvent | null = null
  if (lastEvent.type === 'nft.updated') {
    const previous = previousNfts.get(lastEvent.resourceId)
    if (previous) stale = nftUpdatedEvent(previous)
  } else {
    const previous = previousOrders.get(lastEvent.resourceId)
    if (previous) stale = orderUpdatedEvent(previous.order, previous.userId)
  }
  if (stale) broadcast(stale)
  return stale
}

export function resetEvents() {
  lastEvent = null
  previousNfts.clear()
  previousOrders.clear()
}
