import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { AuthResponse, SessionResponse } from '@/api/contracts'
import { createSalt, createSession, hashPassword, readBearerToken, requireSession, toPublicUser } from '../auth'
import { db } from '../db/store'
import { apiError, parseBody, withScenario } from '../http'

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome (mínimo 2 caracteres).').max(60, 'Nome muito longo.'),
  email: z.email('Informe um e-mail válido.'),
  password: z
    .string()
    .min(8, 'A senha deve ter ao menos 8 caracteres.')
    .regex(/[A-Za-z]/, 'A senha deve conter letras.')
    .regex(/\d/, 'A senha deve conter números.'),
})

const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

const sameEmail = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export const authHandlers = [
  http.post(
    '/api/auth/register',
    withScenario(async ({ request }) => {
      const body = await parseBody(request, registerSchema)
      if (db.read().users.some((u) => sameEmail(u.email, body.email))) {
        throw apiError(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.', {
          email: 'Este e-mail já está cadastrado.',
        })
      }

      const salt = createSalt()
      const user = {
        id: `usr-${crypto.randomUUID().slice(0, 8)}`,
        name: body.name,
        email: body.email.toLowerCase(),
        avatarUrl: null,
        bio: '',
        createdAt: new Date().toISOString(),
        salt,
        passwordHash: await hashPassword(body.password, salt),
      }
      db.write((state) => {
        state.users.push(user)
      })
      return HttpResponse.json<AuthResponse>(createSession(user), { status: 201 })
    }),
  ),

  http.post(
    '/api/auth/login',
    withScenario(async ({ request }) => {
      const body = await parseBody(request, loginSchema)
      const user = db.read().users.find((u) => sameEmail(u.email, body.email))
      if (!user || (await hashPassword(body.password, user.salt)) !== user.passwordHash) {
        throw apiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
      }
      return HttpResponse.json<AuthResponse>(createSession(user))
    }),
  ),

  http.get(
    '/api/auth/session',
    withScenario(({ request }) => {
      const { session, user } = requireSession(request)
      return HttpResponse.json<SessionResponse>({ expiresAt: session.expiresAt, user: toPublicUser(user) })
    }),
  ),

  http.post(
    '/api/auth/logout',
    withScenario(({ request }) => {
      const token = readBearerToken(request)
      db.write((state) => {
        state.sessions = state.sessions.filter((s) => s.token !== token)
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
