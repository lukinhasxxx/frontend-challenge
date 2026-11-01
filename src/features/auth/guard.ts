import { redirect, type ParsedLocation } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { sessionQueryOptions } from './api'

/** Aceita só caminhos internos ("/perfil"), nunca "//site" ou URLs absolutas (open redirect). */
export function safeRedirect(target: string | undefined) {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : undefined
}

type GuardArgs = { context: { queryClient: QueryClient }; location: ParsedLocation; preload: boolean }

/**
 * `beforeLoad` das rotas privadas. Ao entrar, revalida a sessão no servidor (detecta expiração
 * durante a navegação); no preload por hover usa só o cache, para não abrir o login sem clique.
 * Sem sessão, abre o login sobre a Home (como no Figma) guardando a rota pedida.
 */
export async function requireAuth({ context, location, preload }: GuardArgs) {
  const session = preload
    ? await context.queryClient.ensureQueryData(sessionQueryOptions)
    : await context.queryClient.fetchQuery({ ...sessionQueryOptions, staleTime: 0 })
  if (!session) throw redirect({ to: '/', search: { auth: 'login', redirect: location.href } })
}
