import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guard'
import { favoritesQueryOptions } from '@/features/favorites/api'
import { FavoritesPage } from '@/features/favorites/components/favorites-page'

export const Route = createFileRoute('/favoritos')({
  beforeLoad: requireAuth,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(favoritesQueryOptions)
  },
  staticData: { requiresAuth: true },
  component: FavoritesPage,
})
