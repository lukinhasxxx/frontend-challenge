import { z } from 'zod'
import { displayNameSchema, emailSchema, passwordSchema } from '@/lib/validation'

/** Mesmas regras do servidor (src/lib/validation.ts): o cliente só antecipa o feedback. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
})

export const registerSchema = z
  .object({
    name: displayNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>

/** Parâmetros de busca globais que abrem o login/cadastro sobre a tela atual. */
export const authSearchSchema = z.object({
  auth: z.enum(['login', 'register']).optional().catch(undefined),
  redirect: z.string().optional().catch(undefined),
})

export type AuthMode = 'login' | 'register'
