import type { QueryClient } from '@tanstack/react-query'
import type { FeaturedNftsResponse, Nft, NftListResponse, NftUpdatedEvent } from '@/api/contracts'
import { nftKeys } from '@/features/catalog/api'

const MAX_SEEN_EVENTS = 500

/** eventIds já processados (duplicatas são descartadas). */
const seenEventIds = new Set<string>()
/** Maior versão aplicada por NFT (eventos antigos são descartados). */
const latestVersion = new Map<string, number>()

export type ApplyResult = 'applied' | 'duplicate' | 'stale'

function remember(eventId: string) {
  seenEventIds.add(eventId)
  if (seenEventIds.size > MAX_SEEN_EVENTS) seenEventIds.delete(seenEventIds.values().next().value!)
}

/** Maior versão do NFT entre o que já foi aplicado e o que está no cache. */
function knownVersion(queryClient: QueryClient, nftId: string) {
  let version = latestVersion.get(nftId) ?? 0
  const detail = queryClient.getQueryData<Nft>(nftKeys.detail(nftId))
  if (detail) version = Math.max(version, detail.version)
  for (const [, list] of queryClient.getQueriesData<NftListResponse>({ queryKey: nftKeys.lists() })) {
    const item = list?.items.find((nft) => nft.id === nftId)
    if (item) version = Math.max(version, item.version)
  }
  return version
}

/**
 * Aplica `nft.updated` no cache do TanStack Query (catálogo, destaques,
 * detalhe e relacionados). Idempotente: duplicatas e versões antigas não
 * alteram nada, então um estado mais novo nunca regride.
 */
export function applyNftEvent(queryClient: QueryClient, event: NftUpdatedEvent): ApplyResult {
  if (seenEventIds.has(event.eventId)) return 'duplicate'
  remember(event.eventId)

  const nftId = event.resourceId
  if (event.version <= knownVersion(queryClient, nftId)) return 'stale'
  latestVersion.set(nftId, event.version)

  const next = event.payload
  const replace = (nft: Nft) => (nft.id === nftId && nft.version < next.version ? next : nft)

  queryClient.setQueryData<Nft>(nftKeys.detail(nftId), (old) => (old ? replace(old) : old))
  queryClient.setQueriesData<NftListResponse>({ queryKey: nftKeys.lists() }, (old) =>
    old ? { ...old, items: old.items.map(replace) } : old,
  )
  queryClient.setQueriesData<Nft[]>({ queryKey: [...nftKeys.all, 'related'] }, (old) => old?.map(replace))
  queryClient.setQueryData<FeaturedNftsResponse>(nftKeys.featured(), (old) =>
    old ? { hero: old.hero.map(replace), spotlight: old.spotlight ? replace(old.spotlight) : null } : old,
  )
  return 'applied'
}

/** Limpa o histórico (troca de sessão ou testes). */
export function resetRealtimeState() {
  seenEventIds.clear()
  latestVersion.clear()
}
