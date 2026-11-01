import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { AddCartItemRequest, Nft } from '@/api/contracts'
import { ApiClientError } from '@/api/errors'
import { useAddToCart } from './api'

type Options = { name: string; goToCart?: boolean }

/**
 * Adiciona ao carrinho via API. "Comprar" leva ao carrinho; o ícone de carrinho só confirma
 * com um aviso. Estoque insuficiente/esgotado chega como erro da API e vira aviso.
 */
export function useAddToCartAction() {
  const mutation = useAddToCart()
  const navigate = useNavigate()
  const goToCart = () => void navigate({ to: '/carrinho' })

  function add(item: AddCartItemRequest, { name, goToCart: redirect = false }: Options) {
    mutation.mutate(item, {
      onSuccess: () => {
        if (redirect) goToCart()
        else toast.success(`${name} adicionado ao carrinho.`, { action: { label: 'Ver carrinho', onClick: goToCart } })
      },
      onError: (error) =>
        toast.error(error instanceof ApiClientError ? error.message : 'Não foi possível adicionar ao carrinho. Tente novamente.'),
    })
  }

  return { add, pending: mutation.isPending }
}

/** Edição usada pelo atalho do card: a mais barata disponível (o preço exibido). */
export function cheapestAvailableEdition(nft: Nft) {
  return nft.editions.find((e) => e.available > 0 && e.priceEth === nft.priceEth) ?? nft.editions.find((e) => e.available > 0)
}
