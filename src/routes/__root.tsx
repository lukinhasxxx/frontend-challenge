import { lazy, Suspense, useEffect } from 'react'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { NotFound } from '@/components/layout/not-found'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { RealtimeSync } from '@/realtime/realtime-sync'

type RouterContext = { queryClient: QueryClient }

const Devtools = import.meta.env.DEV ? lazy(() => import('@/app/devtools')) : () => null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  // Sinal para testes E2E: mocks ativos e árvore React montada (render é assíncrono).
  useEffect(() => {
    document.documentElement.dataset.appReady = 'true'
  }, [])

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="pb-32 outline-none md:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileTabBar />
      <RealtimeSync />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
