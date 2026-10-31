import type { EthAmount, IsoDate } from './common'

export type QuoteRequest = {
  couponCode?: string
}

export type QuoteLine = {
  nftId: string
  editionId: string
  name: string
  editionLabel: string
  quantity: number
  unitPriceEth: EthAmount
  lineTotalEth: EthAmount
}

export type QuoteCoupon = {
  code: string
  percentOff: number
}

/** Mudanças detectadas desde a última cotação/carrinho. */
export type QuoteIssue =
  | { type: 'price-changed'; nftId: string; editionId: string; previousPriceEth: EthAmount; currentPriceEth: EthAmount }
  | { type: 'quantity-reduced'; nftId: string; editionId: string; requested: number; available: number }
  | { type: 'sold-out'; nftId: string; editionId: string }

/** Cotação: referência para finalizar o pedido. */
export type Quote = {
  id: string
  lines: QuoteLine[]
  coupon: QuoteCoupon | null
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  issues: QuoteIssue[]
  expiresAt: IsoDate
}
