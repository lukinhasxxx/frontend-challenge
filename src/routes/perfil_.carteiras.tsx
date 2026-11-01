import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guard'
import { walletsQueryOptions } from '@/features/wallets/api'
import { WalletsPage } from '@/features/wallets/components/wallets-page'

export const Route = createFileRoute('/perfil_/carteiras')({
  beforeLoad: requireAuth,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(walletsQueryOptions)
  },
  staticData: { requiresAuth: true },
  component: WalletsPage,
})
