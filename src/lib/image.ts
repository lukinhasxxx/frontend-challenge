/** Tipos aceitos no upload de avatar. */
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const AVATAR_MAX_FILE_BYTES = 5 * 1024 * 1024
const AVATAR_SIZE_PX = 256

/**
 * Valida o arquivo e o reduz para 256×256 (recorte central) em WebP, como Data URL.
 * Mantém o banco simulado (localStorage) pequeno. Lança Error com a mensagem para o usuário.
 */
export async function toAvatarDataUrl(file: File): Promise<string> {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) throw new Error('Use uma imagem PNG, JPG ou WebP.')
  if (file.size > AVATAR_MAX_FILE_BYTES) throw new Error('A imagem deve ter no máximo 5 MB.')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Não foi possível ler esta imagem.')
  }
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE_PX
  canvas.height = AVATAR_SIZE_PX
  canvas
    .getContext('2d')!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX)
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.85)
}
