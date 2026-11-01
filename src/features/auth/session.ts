import { useSyncExternalStore } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { AuthResponse, SessionResponse } from '@/api/contracts'
import { onSessionInvalid, type SessionInvalidReason } from '@/api/session-events'
import { authToken } from '@/api/session-storage'
import { sessionQueryOptions } from './api'

type SessionState = {
  /** Último usuário autenticado; continua definido durante a expiração para permitir retomada. */
  userId: string | null
  /** Motivo pelo qual a API rejeitou o token (abre o login preservando a tela atual). */
  invalidReason: SessionInvalidReason | null
  /** Incrementa a cada troca de identidade: a árvore da página é remontada com cache limpo. */
  generation: number
}

let state: SessionState = { userId: null, invalidReason: null, generation: 0 }
const listeners = new Set<() => void>()

function setState(next: Partial<SessionState>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSessionState() {
  return useSyncExternalStore(subscribe, () => state)
}

/** Sessão recuperada no boot (token válido no storage): não há dados de outra conta para limpar. */
export function adoptSession(userId: string) {
  if (state.userId === null) setState({ userId })
}

/**
 * Login/cadastro concluído. Outra conta → limpa todo o cache (zero vazamento);
 * mesma conta após expiração → só revalida, preservando a tela e o que foi digitado.
 */
export function startSession(queryClient: QueryClient, auth: AuthResponse) {
  const switching = state.userId !== auth.user.id
  authToken.set(auth.token)
  if (switching) queryClient.clear()
  const session: SessionResponse = { expiresAt: auth.expiresAt, user: auth.user }
  queryClient.setQueryData(sessionQueryOptions.queryKey, session)
  if (!switching) void queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
  setState({ userId: auth.user.id, invalidReason: null, generation: switching ? state.generation + 1 : state.generation })
}

/** Logout (ou desistência após expirar): remove token, cache privado e subscriptions da sessão. */
export function endSession(queryClient: QueryClient) {
  authToken.clear()
  queryClient.clear()
  queryClient.setQueryData(sessionQueryOptions.queryKey, null)
  setState({ userId: null, invalidReason: null, generation: state.generation + 1 })
}

/**
 * Liga o aviso "token rejeitado" (interceptor do Axios) ao estado da sessão. Chamado antes do
 * primeiro render: o `beforeLoad` das rotas privadas pode receber o 401 antes de o React montar.
 */
export function initSessionSync(queryClient: QueryClient) {
  return onSessionInvalid((reason) => {
    queryClient.setQueryData(sessionQueryOptions.queryKey, null)
    setState({ invalidReason: reason })
  })
}
