import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { UpsertWalletRequest, Wallet, WalletRole, WalletsResponse } from '@/api/contracts'

/** ['wallets'] = lista; ['wallets','connection'] = conexão simulada (invalidada junto). */
export const walletKeys = {
  all: ['wallets'] as const,
  connection: ['wallets', 'connection'] as const,
}

export const walletsQueryOptions = queryOptions({
  queryKey: walletKeys.all,
  queryFn: async ({ signal }) => (await api.get<WalletsResponse>('/wallets', { signal })).data.items,
})

export function useSaveWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ role, details }: { role: WalletRole; details: UpsertWalletRequest }) =>
      (await api.put<Wallet>(`/wallets/${role}`, details)).data,
    onSuccess: (wallet) => {
      queryClient.setQueryData<Wallet[]>(walletKeys.all, (old = []) => [...old.filter((w) => w.role !== wallet.role), wallet])
      // Mudar endereço/rede derruba a conexão no servidor: revalida lista e conexão.
      void queryClient.invalidateQueries({ queryKey: walletKeys.all })
    },
  })
}
