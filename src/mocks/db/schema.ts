import type { Nft, Order, Quote, User, Wallet } from '@/api/contracts'

/** Incrementar ao mudar o formato: força um novo seed em quem tem dados antigos. */
export const DB_SCHEMA_VERSION = 5

export type DbUser = User & {
  /** SHA-256 de `${salt}:${senha}` — nunca guardamos a senha em claro. */
  passwordHash: string
  salt: string
}

export type DbSession = {
  token: string
  userId: string
  expiresAt: string
}

export type DbCartItem = {
  nftId: string
  editionId: string
  quantity: number
}

export type DbCoupon = {
  code: string
  percentOff: number
  expiresAt: string
}

export type DbWallet = Wallet & { userId: string }

export type DbQuote = Quote & { ownerKey: string; createdAt: string }

export type DbOrder = Order & {
  userId: string
  idempotencyKey: string
  /** Hash do corpo da requisição: mesma chave + corpo diferente = conflito. */
  requestHash: string
}

/** Dono de um carrinho: usuário autenticado ou visitante (X-Guest-Id). */
export type CartOwnerKey = `user:${string}` | `guest:${string}`

export type DbState = {
  schemaVersion: number
  users: DbUser[]
  sessions: DbSession[]
  nfts: Nft[]
  favorites: { userId: string; nftId: string }[]
  carts: Record<CartOwnerKey, DbCartItem[]>
  coupons: DbCoupon[]
  wallets: DbWallet[]
  quotes: DbQuote[]
  orders: DbOrder[]
}
