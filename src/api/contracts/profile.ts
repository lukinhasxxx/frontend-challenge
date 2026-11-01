import type { EnsSuffix } from './wallet'

/** `PATCH /api/profile`: campos do frame "Perfil do Colecionador". */
export type UpdateProfileRequest = {
  name: string
  username: string
  email: string
  ensName: string
  ensSuffix: EnsSuffix
  walletAlias: string
  /** Data URL (PNG/JPG/WebP) da nova imagem; `null` remove o avatar; ausente mantém. */
  avatarDataUrl?: string | null
}

/** `POST /api/profile/password` (204). Senha atual errada: 422 com erro no campo. */
export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}
