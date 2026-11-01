import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guard'
import { cartQueryOptions } from '@/features/cart/api'
import { connectionQueryOptions } from '@/features/checkout/api'
import { PaymentPage } from '@/features/checkout/components/payment-page'
import { walletsQueryOptions } from '@/features/wallets/api'

/** Checkout: exige login (expirar aqui abre o login sem perder a tela). */
export const Route = createFileRoute('/pagamento')({
  beforeLoad: requireAuth,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(cartQueryOptions)
    void context.queryClient.prefetchQuery(walletsQueryOptions)
    void context.queryClient.prefetchQuery(connectionQueryOptions)
  },
  // Figma mobile: tela própria com botão fixo, sem a barra de abas.
  staticData: { requiresAuth: true, hideMobileTabBar: true },
  component: PaymentPage,
})
