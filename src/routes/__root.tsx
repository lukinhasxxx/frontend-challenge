import { lazy, Suspense, useEffect } from 'react'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { NotFound } from '@/components/layout/not-found'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { sessionQueryOptions } from '@/features/auth/api'
import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { authSearchSchema } from '@/features/auth/schemas'
import { adoptSession, useSessionState } from '@/features/auth/session'
import { RealtimeSync } from '@/realtime/realtime-sync'

type RouterContext = { queryClient: QueryClient }

const Devtools = import.meta.env.DEV ? lazy(() => import('@/app/devtools')) : () => null

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: authSearchSchema,
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const session = useQuery(sessionQueryOptions)
  const { generation, invalidReason } = useSessionState()

  // Sinal para testes E2E: mocks ativos e árvore React montada (render é assíncrono).
  useEffect(() => {
    document.documentElement.dataset.appReady = 'true'
  }, [])

  // Sessão recuperada do storage após refresh.
  const userId = session.data?.user.id
  useEffect(() => {
    if (userId) adoptSession(userId)
  }, [userId])

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      {/* Troca de conta/logout remonta a página: nenhum estado da sessão anterior sobrevive. */}
      <div key={generation} className="contents">
        <SiteHeader />
        <main id="conteudo" tabIndex={-1} className="pb-32 outline-none md:pb-0">
          <Outlet />
        </main>
        <SiteFooter />
        <MobileTabBar />
      </div>
      {/* Socket reabre a cada mudança de sessão (handshake com o token atual ou como visitante). */}
      <RealtimeSync key={`${generation}:${invalidReason ?? 'ok'}`} />
      <AuthDialog />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
