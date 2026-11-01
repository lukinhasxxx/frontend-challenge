import { queryOptions, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AddCartItemRequest, Cart, Quote } from '@/api/contracts'

/** ['cart'] = carrinho; ['cart','quote'] = cotação. Invalidar ['cart'] atualiza os dois. */
export const cartKeys = {
  all: ['cart'] as const,
  quote: ['cart', 'quote'] as const,
}

/** Carrinho do dono atual (visitante via `X-Guest-Id` ou usuário via Bearer). */
export const cartQueryOptions = queryOptions({
  queryKey: cartKeys.all,
  queryFn: async ({ signal }) => (await api.get<Cart>('/cart', { signal })).data,
})

/** Cotação (subtotal, desconto, taxa, total e avisos) calculada pela API. */
export const quoteQueryOptions = queryOptions({
  queryKey: cartKeys.quote,
  queryFn: async ({ signal }) => (await api.post<Quote>('/quote', undefined, { signal })).data,
})

/** Toda mutação do carrinho devolve o carrinho novo: grava no cache e recalcula a cotação. */
function useCartMutation<TVariables>(request: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.all, cart)
      void queryClient.invalidateQueries({ queryKey: cartKeys.quote })
    },
  })
}

export const useAddToCart = () =>
  useCartMutation(async (body: AddCartItemRequest) => (await api.post<Cart>('/cart/items', body)).data)

export const useUpdateCartItem = () =>
  useCartMutation(
    async ({ editionId, quantity }: { editionId: string; quantity: number }) =>
      (await api.patch<Cart>(`/cart/items/${editionId}`, { quantity })).data,
  )

export const useRemoveCartItem = () =>
  useCartMutation(async (editionId: string) => (await api.delete<Cart>(`/cart/items/${editionId}`)).data)

export const useApplyCoupon = () => useCartMutation(async (code: string) => (await api.put<Cart>('/cart/coupon', { code })).data)

export const useRemoveCoupon = () => useCartMutation(async () => (await api.delete<Cart>('/cart/coupon')).data)

/** "Entendi": confirma preços atuais e quantidades ajustadas ao estoque. */
export const useAcknowledgeCart = () => useCartMutation(async () => (await api.post<Cart>('/cart/acknowledge')).data)

/** Após o login: itens do visitante entram no carrinho do usuário. */
export async function mergeGuestCart(queryClient: QueryClient) {
  try {
    const cart = (await api.post<Cart>('/cart/merge')).data
    queryClient.setQueryData(cartKeys.all, cart)
  } finally {
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
  }
}

/** Quantas unidades da edição já estão no carrinho (limite de compra no detalhe). */
export function quantityInCart(cart: Cart | undefined, editionId: string | undefined) {
  return cart?.lines.find((line) => line.editionId === editionId)?.quantity ?? 0
}

/**
 * Tempo real: um `nft.updated` de algo que está no carrinho revalida carrinho e cotação
 * com a API (os avisos de preço/estoque vêm da cotação, não do evento).
 */
export function revalidateCartFor(queryClient: QueryClient, nftId: string) {
  const cart = queryClient.getQueryData<Cart>(cartKeys.all)
  if (cart?.lines?.some((line) => line.nftId === nftId)) void queryClient.invalidateQueries({ queryKey: cartKeys.all })
}
