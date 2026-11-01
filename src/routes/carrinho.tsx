import { createFileRoute } from '@tanstack/react-router'
import { cartQueryOptions } from '@/features/cart/api'
import { CartPage } from '@/features/cart/components/cart-page'

/** Carrinho de visitante ou usuário (não exige login; finalizar exige). */
export const Route = createFileRoute('/carrinho')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(cartQueryOptions)
  },
  // Figma mobile: tela com resumo fixo próprio, sem a barra de abas.
  staticData: { hideMobileTabBar: true },
  component: CartPage,
})
