import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { FeaturedNftsResponse, Nft, NftListParams, NftListResponse } from '@/api/contracts'

/** Chaves hierárquicas: invalidar ['nfts'] atualiza listagens, destaques e detalhes. */
export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (params: NftListParams) => [...nftKeys.lists(), params] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
  detail: (id: string) => [...nftKeys.all, 'detail', id] as const,
  related: (id: string) => [...nftKeys.all, 'related', id] as const,
}

/**
 * Cada combinação de parâmetros é uma entrada de cache própria. O `signal`
 * cancela a requisição anterior quando os filtros mudam (respostas fora de
 * ordem nunca sobrescrevem a atual); `keepPreviousData` evita piscar a grade.
 */
export const nftListQueryOptions = (params: NftListParams) =>
  queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: async ({ signal }) => (await api.get<NftListResponse>('/nfts', { params, signal })).data,
    placeholderData: keepPreviousData,
  })

export const featuredNftsQueryOptions = queryOptions({
  queryKey: nftKeys.featured(),
  queryFn: async ({ signal }) => (await api.get<FeaturedNftsResponse>('/nfts/featured', { signal })).data,
})

export const nftDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: async ({ signal }) => (await api.get<Nft>(`/nfts/${id}`, { signal })).data,
  })

export const relatedNftsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: nftKeys.related(id),
    queryFn: async ({ signal }) => (await api.get<Nft[]>(`/nfts/${id}/related`, { signal })).data,
  })
