import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guard'
import { orderQueryOptions } from '@/features/checkout/api'
import { OrderPage } from '@/features/checkout/components/order-page'

/** Pedido do usuário logado: pendente, recusado ou recibo (só se confirmado). */
export const Route = createFileRoute('/pedidos/$orderId')({
  beforeLoad: requireAuth,
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(orderQueryOptions(params.orderId))
  },
  staticData: { requiresAuth: true },
  component: OrderRoute,
})

function OrderRoute() {
  const { orderId } = Route.useParams()
  return <OrderPage key={orderId} orderId={orderId} />
}
