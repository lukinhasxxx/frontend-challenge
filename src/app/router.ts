import { createRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { routeTree } from '@/routeTree.gen'

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    // Preload delega o cache ao TanStack Query.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
  interface StaticDataRouteOption {
    /** Telas com barra de ação própria no mobile (detalhe, carrinho, checkout). */
    hideMobileTabBar?: boolean
  }
}
