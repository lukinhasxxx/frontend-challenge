import type { IsoDate } from './common'
import type { EnsSuffix } from './wallet'

export type User = {
  id: string
  /** "Nome de exibição". */
  name: string
  /** "Nome de usuário" (único). */
  username: string
  email: string
  ensName: string
  ensSuffix: EnsSuffix
  /** "Apelido da carteira" do perfil (Figma). */
  walletAlias: string
  avatarUrl: string | null
  bio: string
  createdAt: IsoDate
}

export type RegisterRequest = {
  name: string
  email: string
  password: string
}

export type LoginRequest = {
  email: string
  password: string
}

/** POST /auth/register e POST /auth/login */
export type AuthResponse = {
  token: string
  expiresAt: IsoDate
  user: User
}

/** GET /auth/session */
export type SessionResponse = {
  expiresAt: IsoDate
  user: User
}

/** GET /auth/email-availability?email= — aviso antecipado no cadastro (o 409 do POST continua valendo). */
export type EmailAvailabilityResponse = {
  available: boolean
}
