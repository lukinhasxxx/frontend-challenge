import type { EthAmount, IsoDate } from './common'

export const NFT_CATEGORIES = ['art', 'gaming', 'music', 'photography', 'collectibles'] as const
export type NftCategory = (typeof NFT_CATEGORIES)[number]

export const NFT_SORTS = ['recent', 'price-asc', 'price-desc', 'popular'] as const
export type NftSort = (typeof NFT_SORTS)[number]

export type Creator = {
  id: string
  name: string
  avatarUrl: string
}

export type Collection = {
  id: string
  name: string
}

export type Edition = {
  id: string
  label: string
  priceEth: EthAmount
  supply: number
  /** Unidades ainda disponíveis. 0 = edição esgotada. */
  available: number
}

export type Nft = {
  id: string
  name: string
  description: string
  category: NftCategory
  collection: Collection
  creator: Creator
  /** Primeira imagem é a capa. */
  images: string[]
  editions: Edition[]
  /** Menor preço entre as edições disponíveis (ou da primeira, se todas esgotadas). */
  priceEth: EthAmount
  likes: number
  featured: boolean
  /** Incrementa a cada mudança de preço/disponibilidade (usado pelos eventos). */
  version: number
  createdAt: IsoDate
}

/** Query string de GET /nfts */
export type NftListParams = {
  q?: string
  category?: NftCategory
  collection?: string
  minPrice?: EthAmount
  maxPrice?: EthAmount
  sort?: NftSort
  page?: number
  pageSize?: number
}
