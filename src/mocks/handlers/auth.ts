import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { AuthResponse, EmailAvailabilityResponse, SessionResponse } from '@/api/contracts'
import { displayNameSchema, emailSchema, passwordSchema } from '@/lib/validation'
import { createSalt, createSession, hashPassword, readBearerToken, requireSession, toPublicUser } from '../auth'
import type { DbUser } from '../db/schema'
import { db } from '../db/store'
import { apiError, parseBody, withScenario } from '../http'

// Mesmas regras do formulário (src/lib/validation.ts): o servidor nunca confia só no cliente.
const registerSchema = z.object({ name: displayNameSchema, email: emailSchema, password: passwordSchema })

const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

const sameEmail = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export const authHandlers = [
  http.get(
    '/api/auth/email-availability',
    withScenario(({ request }) => {
      const email = new URL(request.url).searchParams.get('email') ?? ''
      const available = !db.read().users.some((u) => sameEmail(u.email, email))
      return HttpResponse.json<EmailAvailabilityResponse>({ available })
    }),
  ),

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
      const id = `usr-${crypto.randomUUID().slice(0, 8)}`
      const user: DbUser = {
        id,
        name: body.name,
        // Nome de usuário inicial único (editável no perfil).
        username: `${body.email.split('@')[0]!.replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 20) || 'colecionador'}.${id.slice(4)}`,
        email: body.email.toLowerCase(),
        ensName: '',
        ensSuffix: '.eth',
        walletAlias: '',
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
