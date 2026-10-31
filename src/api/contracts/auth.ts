import type { IsoDate } from './common'

export type User = {
  id: string
  name: string
  email: string
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
