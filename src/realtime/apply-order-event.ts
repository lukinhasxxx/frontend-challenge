import type { QueryClient } from '@tanstack/react-query'
import type { Order, OrderUpdatedEvent } from '@/api/contracts'
import { orderKeys } from '@/features/checkout/api'
import type { ApplyResult } from './apply-nft-event'

const MAX_SEEN_EVENTS = 200
const seenEventIds = new Set<string>()

/**
 * Aplica `order.updated` no cache do pedido. Duplicatas (mesmo eventId) e versões antigas
 * são descartadas: um pedido confirmado/recusado (terminal) nunca volta a "pendente".
 */
export function applyOrderEvent(queryClient: QueryClient, event: OrderUpdatedEvent): ApplyResult {
  if (seenEventIds.has(event.eventId)) return 'duplicate'
  seenEventIds.add(event.eventId)
  if (seenEventIds.size > MAX_SEEN_EVENTS) seenEventIds.delete(seenEventIds.values().next().value!)

  const cached = queryClient.getQueryData<Order>(orderKeys.detail(event.resourceId))
  if (cached && event.version <= cached.version) return 'stale'
  queryClient.setQueryData<Order>(orderKeys.detail(event.resourceId), event.payload)
  return 'applied'
}
