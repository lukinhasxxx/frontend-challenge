import type { IsoDate } from './common'
import type { Nft } from './nft'
import type { Order } from './order'

type EventBase<TType extends string, TPayload> = {
  /** Identidade estável: o mesmo evento reenviado mantém o mesmo id. */
  eventId: string
  type: TType
  /** Id do recurso afetado (NFT ou pedido). */
  resourceId: string
  /** Versão do recurso após a mudança. Eventos com versão <= atual são ignorados. */
  version: number
  occurredAt: IsoDate
  payload: TPayload
}

export type NftUpdatedEvent = EventBase<'nft.updated', Nft>

/** Só é entregue ao dono do pedido. */
export type OrderUpdatedEvent = EventBase<'order.updated', Order> & { userId: string }

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent
export type RealtimeEventType = RealtimeEvent['type']
