import type { EthAmount, IsoDate } from './common'

export type CartLine = {
  nftId: string
  editionId: string
  quantity: number
  /** Dados atuais do catálogo, para exibição. */
  name: string
  image: string
  editionLabel: string
  unitPriceEth: EthAmount
  available: number
}

export type Cart = {
  lines: CartLine[]
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
