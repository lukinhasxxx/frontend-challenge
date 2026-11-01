import { z } from 'zod'

/** Regras de cadastro compartilhadas pelo formulário (cliente) e pela API mock (servidor). */
export const emailSchema = z.string().trim().min(1, 'Informe seu e-mail.').pipe(z.email('Informe um e-mail válido.'))

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .regex(/[A-Z]/, 'A senha deve ter ao menos uma letra maiúscula.')
  .regex(/[a-z]/, 'A senha deve ter ao menos uma letra minúscula.')
  .regex(/\d/, 'A senha deve ter ao menos um número.')
  .regex(/[^A-Za-z0-9]/, 'A senha deve ter ao menos um caractere especial (ex.: @, #, !).')

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Informe seu nome de usuário (mínimo 2 caracteres).')
  .max(60, 'Nome muito longo.')
