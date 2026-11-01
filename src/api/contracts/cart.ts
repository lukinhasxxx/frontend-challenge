import type { EthAmount, IsoDate } from './common'
import type { Nft } from './nft'

export type CartLine = {
  nftId: string
  editionId: string
  quantity: number
  /** Dados atuais do catálogo, para exibição. */
  name: string
  image: string
  tokenId: string
  editionLabel: string
  unitPriceEth: EthAmount
  lineTotalEth: EthAmount
  /** Preço que o usuário viu ao adicionar; preenchido só quando mudou desde então. */
  previousUnitPriceEth: EthAmount | null
  available: number
}

/** Carrinho do dono atual: usuário autenticado (Bearer) ou visitante (`X-Guest-Id`). */
export type Cart = {
  lines: CartLine[]
  /** Soma das quantidades (badge do header). */
  itemCount: number
  couponCode: string | null
  updatedAt: IsoDate
}

export type AddCartItemRequest = {
  nftId: string
  editionId: string
  quantity: number
}

export type UpdateCartItemRequest = {
  quantity: number
}

export type ApplyCouponRequest = {
  code: string
}

/** GET /favorites */
export type FavoritesResponse = {
  items: Nft[]
}

export type AddFavoriteRequest = {
  nftId: string
}
