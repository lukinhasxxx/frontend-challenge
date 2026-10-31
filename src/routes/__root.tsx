import { lazy, Suspense } from 'react'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { NotFound } from '@/components/layout/not-found'

type RouterContext = { queryClient: QueryClient }

const Devtools = import.meta.env.DEV ? lazy(() => import('@/app/devtools')) : () => null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <>
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
          <Link to="/" className="font-bold">
            NFT Marketplace
          </Link>
          <Link to="/" className="text-sm text-muted-foreground [&.active]:text-primary">
            Início
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4">
        <Outlet />
      </main>
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
