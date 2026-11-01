import { z } from 'zod'

/** Mesmas regras do servidor (src/mocks/handlers/auth.ts): o cliente só antecipa o feedback. */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe seu e-mail.').pipe(z.email('Informe um e-mail válido.')),
  password: z.string().min(1, 'Informe sua senha.'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome de usuário (mínimo 2 caracteres).').max(60, 'Nome muito longo.'),
    email: z.string().trim().min(1, 'Informe seu e-mail.').pipe(z.email('Informe um e-mail válido.')),
    password: z
      .string()
      .min(8, 'A senha deve ter ao menos 8 caracteres.')
      .regex(/[A-Za-z]/, 'A senha deve conter letras.')
      .regex(/\d/, 'A senha deve conter números.'),
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
