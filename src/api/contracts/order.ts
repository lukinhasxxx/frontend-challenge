import type { EthAmount, IsoDate } from './common'
import type { QuoteCoupon, QuoteLine } from './quote'
import type { Network } from './wallet'

/** `confirmed` e `declined` são terminais. */
export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export type CreateOrderRequest = {
  quoteId: string
  walletId: string
  network: Network
  buyer: { name: string; email: string }
}

/** Recibo: snapshot imutável no momento da criação do pedido. */
export type Order = {
  id: string
  status: OrderStatus
  lines: QuoteLine[]
  coupon: QuoteCoupon | null
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  network: Network
  walletAddress: string
  buyer: { name: string; email: string }
  txHash: string | null
  explorerUrl: string | null
  failureReason: string | null
  /** Incrementa a cada mudança de status. */
  version: number
  createdAt: IsoDate
  updatedAt: IsoDate
}
