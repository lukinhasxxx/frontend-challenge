import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import {
  NETWORKS,
  NFT_CATEGORIES,
  NFT_SORTS,
  NFT_TABS,
  type FeaturedNftsResponse,
  type Network,
  type Nft,
  type NftCategory,
  type NftListResponse,
} from '@/api/contracts'
import { compareEth, isEthAmount } from '@/lib/eth'
import { db } from '../db/store'
import { SPOTLIGHT_NFT_ID } from '../fixtures/nfts'
import { apiError, withScenario } from '../http'
import { getScenario } from '../scenarios'

const DEFAULT_PAGE_SIZE = 9
const NEW_RELEASES_COUNT = 12
const TRENDING_MIN_LIKES = 500
const RELATED_LIMIT = 10

const ethParam = z.string().refine(isEthAmount).optional().catch(undefined)

/** Parâmetros inválidos são ignorados (mesmo comportamento do validateSearch da rota). */
const listQuerySchema = z.object({
  q: z.string().trim().optional().catch(undefined),
  tab: z.enum(NFT_TABS).catch('all'),
  category: z.enum(NFT_CATEGORIES).optional().catch(undefined),
  network: z.enum(NETWORKS).optional().catch(undefined),
  minPrice: ethParam,
  maxPrice: ethParam,
  sort: z.enum(NFT_SORTS).catch('recent'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(48).catch(DEFAULT_PAGE_SIZE),
})

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const newest = (a: Nft, b: Nft) => b.createdAt.localeCompare(a.createdAt)

function matchesTab(nft: Nft, tab: (typeof NFT_TABS)[number], newIds: Set<string>) {
  if (tab === 'new') return newIds.has(nft.id)
  if (tab === 'trending') return nft.likes >= TRENDING_MIN_LIKES
  return true
}

function countBy<K extends string>(keys: readonly K[], items: Nft[], pick: (nft: Nft) => K) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>
  for (const item of items) counts[pick(item)] += 1
  return counts
}

export const nftHandlers = [
  http.get(
    '/api/nfts',
    withScenario(({ request }) => {
      const params = listQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams))
      const all = db.read().nfts
      const newIds = new Set([...all].sort(newest).slice(0, NEW_RELEASES_COUNT).map((n) => n.id))
      const query = params.q ? normalize(params.q) : ''

      // Busca e aba definem a base das contagens da sidebar.
      const base = all.filter(
        (nft) =>
          matchesTab(nft, params.tab, newIds) &&
          (!query || normalize(`${nft.name} ${nft.collection.name}`).includes(query)),
      )
      let items = base.filter(
        (nft) =>
          (!params.category || nft.category === params.category) &&
          (!params.network || nft.network === params.network) &&
          (!params.minPrice || compareEth(nft.priceEth, params.minPrice) >= 0) &&
          (!params.maxPrice || compareEth(nft.priceEth, params.maxPrice) <= 0),
      )

      items = [...items].sort((a, b) => {
        if (params.sort === 'price-asc') return compareEth(a.priceEth, b.priceEth)
        if (params.sort === 'price-desc') return compareEth(b.priceEth, a.priceEth)
        if (params.sort === 'popular') return b.likes - a.likes
        return newest(a, b)
      })
      if (getScenario(request) === 'empty') items = []

      const prices = [...all].sort((a, b) => compareEth(a.priceEth, b.priceEth))
      const total = items.length
      const start = (params.page - 1) * params.pageSize

      return HttpResponse.json<NftListResponse>({
        items: items.slice(start, start + params.pageSize),
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
        facets: {
          categories: countBy<NftCategory>(NFT_CATEGORIES, base, (nft) => nft.category),
          networks: countBy<Network>(NETWORKS, base, (nft) => nft.network),
          priceRange: { min: prices[0]!.priceEth, max: prices.at(-1)!.priceEth },
        },
      })
    }),
  ),

  http.get(
    '/api/nfts/featured',
    withScenario(() => {
      const all = db.read().nfts
      return HttpResponse.json<FeaturedNftsResponse>({
        hero: all.filter((nft) => nft.featured),
        spotlight: all.find((nft) => nft.id === SPOTLIGHT_NFT_ID) ?? null,
      })
    }),
  ),

  http.get(
    '/api/nfts/:nftId',
    withScenario(({ params }) => {
      const nft = db.read().nfts.find((n) => n.id === params.nftId)
      return nft ? HttpResponse.json<Nft>(nft) : apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
    }),
  ),

  http.get(
    '/api/nfts/:nftId/related',
    withScenario(({ params }) => {
      const all = db.read().nfts
      const nft = all.find((n) => n.id === params.nftId)
      if (!nft) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
      const related = all
        .filter((n) => n.collection.id === nft.collection.id && n.id !== nft.id)
        .sort(newest)
        .slice(0, RELATED_LIMIT)
      return HttpResponse.json<Nft[]>(related)
    }),
  ),
]
