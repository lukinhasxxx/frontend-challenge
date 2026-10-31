export type UpdateProfileRequest = {
  name: string
  bio: string
  /** Data URL da nova imagem; `null` remove o avatar; ausente mantém. */
  avatarDataUrl?: string | null
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}
