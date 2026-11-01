import type { EthAmount, IsoDate } from './common'
import type { QuoteCoupon, QuoteLine } from './quote'
import type { EnsSuffix, WalletNetwork, WalletProvider } from './wallet'

/** `confirmed` e `declined` são terminais. */
export type OrderStatus = 'pending' | 'confirmed' | 'declined'

/** "Perfil do colecionador" do Figma (Pagamento). */
export type BuyerProfile = {
  displayName: string
  username: string
  profileName: string
  email: string
  referralCode: string
  ensName: string
  ensSuffix: EnsSuffix
  secondaryAddress: string
  /** "Observação do colecionador (opcional)". */
  note: string
}

/**
 * `POST /api/orders` (header `Idempotency-Key` obrigatório). A API recalcula a cotação:
 * se mudou desde `quoteId`, responde 409 `QUOTE_STALE` e nada é criado.
 */
export type CreateOrderRequest = {
  quoteId: string
  walletId: string
  network: WalletNetwork
  provider: WalletProvider
  buyer: BuyerProfile
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
  network: WalletNetwork
  provider: WalletProvider
  walletAddress: string
  buyer: BuyerProfile
  txHash: string | null
  explorerUrl: string | null
  failureReason: string | null
  /** Incrementa a cada mudança de status. */
  version: number
  createdAt: IsoDate
  updatedAt: IsoDate
}
