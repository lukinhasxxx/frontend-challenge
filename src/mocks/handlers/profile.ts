import { http, HttpResponse } from 'msw'
import type { User } from '@/api/contracts'
import { avatarDataUrlSchema, changePasswordSchema, profileSchema } from '@/lib/validation'
import { createSalt, hashPassword, requireSession, toPublicUser } from '../auth'
import { db } from '../db/store'
import { apiError, parseBody, withScenario } from '../http'

const updateSchema = profileSchema.extend({ avatarDataUrl: avatarDataUrlSchema.nullable().optional() })

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/** Perfil do usuário logado: consulta, dados + avatar e troca de senha. */
export const profileHandlers = [
  http.get(
    '/api/profile',
    withScenario(({ request }) => HttpResponse.json<User>(toPublicUser(requireSession(request).user))),
  ),

  http.patch(
    '/api/profile',
    withScenario(async ({ request }) => {
      const { user } = requireSession(request)
      const { avatarDataUrl, ...body } = await parseBody(request, updateSchema)
      const others = db.read().users.filter((u) => u.id !== user.id)
      if (others.some((u) => same(u.email, body.email))) {
        throw apiError(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' })
      }
      if (others.some((u) => same(u.username, body.username))) {
        throw apiError(409, 'VALIDATION_ERROR', 'Este nome de usuário já está em uso.', { username: 'Este nome de usuário já está em uso.' })
      }

      const updated = db.write((state) => {
        const target = state.users.find((u) => u.id === user.id)!
        Object.assign(target, { ...body, email: body.email.toLowerCase() })
        if (avatarDataUrl !== undefined) target.avatarUrl = avatarDataUrl
        return toPublicUser(target)
      })
      return HttpResponse.json<User>(updated)
    }),
  ),

  http.post(
    '/api/profile/password',
    withScenario(async ({ request }) => {
      const { user } = requireSession(request)
      const { currentPassword, newPassword } = await parseBody(request, changePasswordSchema)
      if ((await hashPassword(currentPassword, user.salt)) !== user.passwordHash) {
        throw apiError(422, 'INVALID_CREDENTIALS', 'Senha atual incorreta.', { currentPassword: 'Senha atual incorreta.' })
      }
      if (currentPassword === newPassword) {
        throw apiError(422, 'VALIDATION_ERROR', 'A nova senha deve ser diferente da atual.', {
          newPassword: 'A nova senha deve ser diferente da atual.',
        })
      }
      const salt = createSalt()
      const passwordHash = await hashPassword(newPassword, salt)
      db.write((state) => {
        Object.assign(state.users.find((u) => u.id === user.id)!, { salt, passwordHash })
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
