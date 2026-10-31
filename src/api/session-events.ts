export type SessionInvalidReason = 'SESSION_EXPIRED' | 'UNAUTHENTICATED'

type Listener = (reason: SessionInvalidReason) => void

const listeners = new Set<Listener>()

/** Avisado quando a API rejeita o token atual. Retorna a função de cancelamento. */
export function onSessionInvalid(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitSessionInvalid(reason: SessionInvalidReason) {
  listeners.forEach((listener) => listener(reason))
}
