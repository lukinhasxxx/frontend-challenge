import type { Nft, NftUpdatedEvent, RealtimeEvent } from '@/api/contracts'
import { broadcast } from './socket'

let lastEvent: RealtimeEvent | null = null
/** Snapshot anterior de cada NFT alterado, para simular eventos antigos. */
const previousNfts = new Map<string, Nft>()

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

export function publish(event: RealtimeEvent) {
  lastEvent = event
  broadcast(event)
}

/** Chamado sempre que preço/disponibilidade de um NFT muda no banco. */
export function publishNftUpdated(previous: Nft, next: Nft) {
  previousNfts.set(next.id, previous)
  publish(nftUpdatedEvent(next))
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

/** Emite um evento novo (eventId inédito) com a versão ANTERIOR do último NFT alterado. */
export function emitStaleNftEvent() {
  if (lastEvent?.type !== 'nft.updated') return null
  const previous = previousNfts.get(lastEvent.resourceId)
  if (!previous) return null
  const stale = nftUpdatedEvent(previous)
  broadcast(stale)
  return stale
}

export function resetEvents() {
  lastEvent = null
  previousNfts.clear()
}
