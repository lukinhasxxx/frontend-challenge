import type { EthAmount, IsoDate, Paginated } from './common'
import type { Network } from './wallet'

/** Categorias da sidebar "Coleções" do Figma. */
export const NFT_CATEGORIES = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
] as const
export type NftCategory = (typeof NFT_CATEGORIES)[number]

/** "Listados recentemente" é o padrão do Figma. */
export const NFT_SORTS = ['recent', 'price-asc', 'price-desc', 'popular'] as const
export type NftSort = (typeof NFT_SORTS)[number]

/** Abas do catálogo: "Todos os NFTs", "Novos lançamentos", "Em alta". */
export const NFT_TABS = ['all', 'new', 'trending'] as const
export type NftTab = (typeof NFT_TABS)[number]

export type Collection = {
  id: string
  name: string
}

export type Edition = {
  id: string
  /** Rótulo do Figma: "1/1", "1/10", "1/50" ou "Aberta". */
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
  network: Network
  collection: Collection
  creator: string
  /** Imagens grandes (galeria); a primeira é a capa. */
  images: string[]
  /** Capa em tamanho de card. */
  thumbnail: string
  editions: Edition[]
  /** Menor preço entre as edições disponíveis (ou da primeira, se todas esgotadas). */
  priceEth: EthAmount
  /** Preço anterior, exibido riscado (oferta). */
  previousPriceEth: EthAmount | null
  tokenId: string
  contractAddress: string
  royaltyPercent: number
  attributes: string[]
  rating: { average: number; count: number }
  likes: number
  featured: boolean
  /** Incrementa a cada mudança de preço/disponibilidade (usado pelos eventos). */
  version: number
  createdAt: IsoDate
}

/** Query string de GET /nfts */
export type NftListParams = {
  q?: string
  tab?: NftTab
  category?: NftCategory
  network?: Network
  minPrice?: EthAmount
  maxPrice?: EthAmount
  sort?: NftSort
  page?: number
  pageSize?: number
}

/** GET /nfts — itens paginados + contagens para a sidebar. */
export type NftListResponse = Paginated<Nft> & {
  facets: {
    categories: Record<NftCategory, number>
    networks: Record<Network, number>
    /** Faixa de preço de todo o catálogo (limites do slider). */
    priceRange: { min: EthAmount; max: EthAmount }
  }
}

/** GET /nfts/featured — carrossel do hero e "NFT em destaque". */
export type FeaturedNftsResponse = {
  hero: Nft[]
  spotlight: Nft | null
}
