import { z } from 'zod'
import { ENS_SUFFIXES, WALLET_NETWORKS, WALLET_PROVIDERS } from '@/api/contracts'

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

/* ---------- Carteiras e pagamento (formulário + API mock) ---------- */

const required = (label: string) => z.string().trim().min(1, `Informe ${label}.`)

export const walletAddressSchema = required('o endereço da carteira').regex(
  /^0x[a-fA-F0-9]{40}$/,
  'Use um endereço 0x com 40 caracteres hexadecimais.',
)

/** "Nome ENS" sem o sufixo: letras minúsculas, números, hífen e pontos (ex.: "nova.kurio"). */
export const ensNameSchema = required('o nome ENS')
  .toLowerCase()
  .regex(/^[a-z0-9-]{3,}(\.[a-z0-9-]+)*$/, 'Use ao menos 3 letras minúsculas, números ou hífen (ex.: nova.kurio).')

/** "ENS ou carteira secundária (opcional)": vazio, um endereço 0x ou um nome ENS completo. */
export const secondaryAddressSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^0x[a-fA-F0-9]{40}$/.test(value) || /^[a-z0-9-]+(\.[a-z0-9-]+)*\.(eth|xyz)$/i.test(value),
    'Use um endereço 0x ou um nome ENS (ex.: nova.kurio.eth).',
  )

export const referralCodeSchema = required('o código de indicação')
  .toUpperCase()
  .regex(/^[A-Z0-9-]{4,20}$/, 'Use de 4 a 20 letras, números ou hífen.')

export const personNameSchema = (label: string) => required(label).min(2, `Informe ${label} (mínimo 2 caracteres).`).max(60, 'Texto muito longo.')

export const usernameSchema = required('o nome de usuário').regex(
  /^[a-zA-Z0-9_.]{3,30}$/,
  'Use de 3 a 30 letras, números, ponto ou sublinhado.',
)

export const walletNetworkSchema = z.enum(WALLET_NETWORKS, { error: 'Selecione uma rede.' })
export const walletProviderSchema = z.enum(WALLET_PROVIDERS, { error: 'Selecione uma carteira.' })
export const ensSuffixSchema = z.enum(ENS_SUFFIXES, { error: 'Selecione o sufixo.' })

/** Formulário "Carteiras" (Figma). Todos obrigatórios, exceto "ENS ou carteira secundária". */
export const walletDetailsSchema = z.object({
  displayName: personNameSchema('o nome de exibição'),
  label: personNameSchema('o apelido da carteira'),
  network: walletNetworkSchema,
  profileName: personNameSchema('o nome do perfil'),
  address: walletAddressSchema,
  secondaryAddress: secondaryAddressSchema,
  provider: walletProviderSchema,
  referralCode: referralCodeSchema,
  email: emailSchema,
  ensName: ensNameSchema,
  ensSuffix: ensSuffixSchema,
})

/** "Perfil do colecionador" (Pagamento). */
export const buyerProfileSchema = z.object({
  displayName: personNameSchema('o nome de exibição'),
  username: usernameSchema,
  profileName: personNameSchema('o nome do perfil'),
  email: emailSchema,
  referralCode: referralCodeSchema,
  ensName: ensNameSchema,
  ensSuffix: ensSuffixSchema,
  secondaryAddress: secondaryAddressSchema,
  note: z.string().trim().max(500, 'Use no máximo 500 caracteres.'),
})

/* ---------- Perfil do colecionador ---------- */

/** Avatar já reduzido no cliente (256px); a API recusa outros formatos ou imagens grandes. */
export const AVATAR_MAX_DATA_URL_LENGTH = 400_000

export const avatarDataUrlSchema = z
  .string()
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Use uma imagem PNG, JPG ou WebP.')
  .max(AVATAR_MAX_DATA_URL_LENGTH, 'A imagem é grande demais.')

export const profileSchema = z.object({
  name: personNameSchema('o nome de exibição'),
  username: usernameSchema,
  email: emailSchema,
  ensName: ensNameSchema,
  ensSuffix: ensSuffixSchema,
  walletAlias: personNameSchema('o apelido da carteira'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: passwordSchema,
})
