import { z } from 'zod'
import { NETWORKS, NFT_CATEGORIES, NFT_SORTS, NFT_TABS, type NftListParams } from '@/api/contracts'
import { isEthAmount } from '@/lib/eth'

export const CATALOG_PAGE_SIZE = 9

const ethAmount = z.string().refine(isEthAmount)

/**
 * Estado do catálogo na URL (busca, aba, filtros, ordenação, página).
 * Valores inválidos caem no padrão em vez de quebrar a página.
 */
export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  tab: z.enum(NFT_TABS).default('all').catch('all'),
  category: z.enum(NFT_CATEGORIES).optional().catch(undefined),
  network: z.enum(NETWORKS).optional().catch(undefined),
  minPrice: ethAmount.optional().catch(undefined),
  maxPrice: ethAmount.optional().catch(undefined),
  sort: z.enum(NFT_SORTS).default('recent').catch('recent'),
  page: z.coerce.number().int().min(1).default(1).catch(1),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

/** Padrões omitidos da URL para mantê-la limpa. */
export const CATALOG_SEARCH_DEFAULTS = { tab: 'all', sort: 'recent', page: 1 } as const

export function toListParams(search: CatalogSearch): NftListParams {
  return { ...search, q: search.q || undefined, pageSize: CATALOG_PAGE_SIZE }
}
