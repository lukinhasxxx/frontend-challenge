import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { ApiClientError } from '@/api/errors'
import type { ConnectWalletRequest, CreateOrderRequest, Order, WalletConnection, WalletConnectionResponse } from '@/api/contracts'
import { walletKeys } from '@/features/wallets/api'
import { checkoutAttempt } from './attempt'

export const orderKeys = {
  all: ['orders'] as const,
  detail: (orderId: string) => ['orders', orderId] as const,
}

export const orderQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: orderKeys.detail(orderId),
    queryFn: async ({ signal }) => (await api.get<Order>(`/orders/${orderId}`, { signal })).data,
  })

/* ---------- Conexão simulada com a carteira ---------- */

export const connectionQueryOptions = queryOptions({
  queryKey: walletKeys.connection,
  queryFn: async ({ signal }) => (await api.get<WalletConnectionResponse>('/wallet-connection', { signal })).data.connection,
})

export function useConnectWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: ConnectWalletRequest) => (await api.post<WalletConnection>('/wallet-connection', request)).data,
    onSuccess: (connection) => queryClient.setQueryData(walletKeys.connection, connection),
    // Recusa derruba qualquer conexão anterior (o servidor também a remove).
    onError: () => queryClient.setQueryData(walletKeys.connection, null),
  })
}

export function useDisconnectWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/wallet-connection'),
    onSuccess: () => queryClient.setQueryData(walletKeys.connection, null),
  })
}

/* ---------- Pedido idempotente ---------- */

/** Sem resposta conclusiva: o pedido pode ter sido criado; só a mesma chave descobre. */
export function isUnresolvedFailure(error: unknown) {
  return error instanceof ApiClientError && error.isTransient
}

type SubmitVariables = { userId: string; body: CreateOrderRequest }

/**
 * `POST /api/orders` com `Idempotency-Key`. Se há uma tentativa sem resposta, ela é reenviada
 * exatamente como foi (mesma chave, mesmo corpo); senão nasce uma chave nova para este corpo.
 */
export function useSubmitOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, body }: SubmitVariables) => {
      const pending = checkoutAttempt.read(userId)
      const attempt = pending && !pending.orderId ? pending : { userId, key: crypto.randomUUID(), body, orderId: null }
      checkoutAttempt.save(attempt)
      try {
        const order = (await api.post<Order>('/orders', attempt.body, { headers: { 'Idempotency-Key': attempt.key } })).data
        checkoutAttempt.save({ ...attempt, orderId: order.id })
        return order
      } catch (error) {
        // Resposta conclusiva (409/422...): nada foi criado, a próxima tentativa usa chave nova.
        if (!isUnresolvedFailure(error)) checkoutAttempt.clear()
        throw error
      }
    },
    onSuccess: (order) => queryClient.setQueryData(orderKeys.detail(order.id), order),
  })
}
