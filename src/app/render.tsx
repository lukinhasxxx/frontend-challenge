import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { initSessionSync } from '@/features/auth/session'
import { createQueryClient } from './query-client'
import { createAppRouter } from './router'

export function renderApp(container: HTMLElement) {
  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient)
  initSessionSync(queryClient)
  // Mesmo gancho da extensão TanStack Query DevTools; os E2E o usam para provar que não há vazamento entre sessões.
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') Reflect.set(window, '__TANSTACK_QUERY_CLIENT__', queryClient)

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </StrictMode>,
  )
}
