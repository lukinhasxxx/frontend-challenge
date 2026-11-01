import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { FavoritesResponse, Nft } from '@/api/contracts'
import { sessionQueryOptions } from '@/features/auth/api'
import { savePendingFavorite, takePendingFavorite } from './pending'

export const favoriteKeys = { all: ['favorites'] as const }

export const favoritesQueryOptions = queryOptions({
  queryKey: favoriteKeys.all,
  queryFn: async ({ signal }) => (await api.get<FavoritesResponse>('/favorites', { signal })).data,
})

/** Favoritos do usuário logado (visitante: lista vazia, sem requisição). */
export function useFavorites() {
  const { data: session } = useQuery(sessionQueryOptions)
  return useQuery({ ...favoritesQueryOptions, enabled: Boolean(session) })
}

/** Depois do login: conclui o favorito que o visitante pediu antes de entrar. */
export async function completePendingFavorite(queryClient: QueryClient) {
  const nftId = takePendingFavorite()
  if (!nftId) return
  try {
    await api.post('/favorites', { nftId })
    toast.success('Adicionado aos favoritos.')
  } catch {
    toast.error('Não foi possível favoritar. Tente novamente.')
  } finally {
    void queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
  }
}

type ToggleVariables = { nft: Nft; favorite: boolean }

function setFavorite(queryClient: QueryClient, nft: Nft, favorite: boolean) {
  queryClient.setQueryData<FavoritesResponse>(favoriteKeys.all, (old) => {
    const items = (old?.items ?? []).filter((item) => item.id !== nft.id)
    return { items: favorite ? [nft, ...items] : items }
  })
}

/**
 * Toggle otimista: o coração muda na hora (cache), a API confirma depois.
 * Falhou → volta ao estado anterior e avisa. No fim, revalida com a API.
 */
export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nft, favorite }: ToggleVariables) => {
      if (favorite) await api.post('/favorites', { nftId: nft.id })
      else await api.delete(`/favorites/${nft.id}`)
    },
    onMutate: async ({ nft, favorite }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all })
      setFavorite(queryClient, nft, favorite)
    },
    // Rollback pela operação inversa (não por snapshot): funciona mesmo se a lista ainda
    // não tinha carregado e com cliques seguidos em NFTs diferentes.
    onError: (_error, { nft, favorite }) => {
      setFavorite(queryClient, nft, !favorite)
      toast.error(favorite ? 'Não foi possível favoritar. Tente novamente.' : 'Não foi possível remover dos favoritos. Tente novamente.')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoriteKeys.all }),
  })
}

/**
 * Estado + ação do coração de um NFT. Visitante: abre o login sobre a tela atual e
 * guarda o pedido, que é concluído logo após entrar.
 */
export function useFavorite(nft: Nft) {
  const { data: session } = useQuery(sessionQueryOptions)
  const favorites = useFavorites()
  const toggleMutation = useToggleFavoriteMutation()
  const navigate = useNavigate()
  const isFavorite = Boolean(favorites.data?.items?.some((item) => item.id === nft.id))

  function toggle() {
    if (!session) {
      savePendingFavorite(nft.id)
      void navigate({ to: '.', search: (prev) => ({ ...prev, auth: 'login' }) })
      return
    }
    toggleMutation.mutate({ nft, favorite: !isFavorite })
  }

  return { isFavorite, toggle }
}
