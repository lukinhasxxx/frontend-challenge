import type { AuthResponse, User } from '@/api/contracts'
import { db } from './db/store'
import type { DbSession, DbUser } from './db/schema'
import { apiError } from './http'
import { getScenario } from './scenarios'

const SESSION_TTL_MS = 30 * 60_000

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(8)).buffer)
}

/** SHA-256 de `${salt}:${senha}` (mesma fórmula das fixtures). */
export async function hashPassword(password: string, salt: string) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`)))
}

export function toPublicUser(user: DbUser): User {
  const { passwordHash, salt, ...publicUser } = user
  return publicUser
}

export function createSession(user: DbUser): AuthResponse {
  const session: DbSession = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  db.write((state) => {
    state.sessions.push(session)
  })
  return { token: session.token, expiresAt: session.expiresAt, user: toPublicUser(user) }
}

export function readBearerToken(request: Request) {
  const header = request.headers.get('authorization')
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

export function findSessionByToken(token: string | null | undefined) {
  if (!token) return null
  const session = db.read().sessions.find((s) => s.token === token)
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null
  return session
}

/** Garante usuário autenticado; lança 401 caso contrário. */
export function requireSession(request: Request): { session: DbSession; user: DbUser } {
  if (getScenario(request) === 'expired-session') {
    throw apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  }
  const token = readBearerToken(request)
  if (!token) throw apiError(401, 'UNAUTHENTICATED', 'Faça login para continuar.')

  const session = db.read().sessions.find((s) => s.token === token)
  if (!session) throw apiError(401, 'UNAUTHENTICATED', 'Sessão inválida. Entre novamente.')
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    throw apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  }

  const user = db.read().users.find((u) => u.id === session.userId)
  if (!user) throw apiError(401, 'UNAUTHENTICATED', 'Sessão inválida. Entre novamente.')
  return { session, user }
}
