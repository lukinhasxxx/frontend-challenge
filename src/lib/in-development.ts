import { toast } from 'sonner'

export const IN_DEVELOPMENT_MESSAGE = 'Este recurso está em desenvolvimento.'

/** Aviso padrão para elementos do Figma que estão fora do escopo desta entrega. */
export function notifyInDevelopment(feature: string) {
  toast.info(IN_DEVELOPMENT_MESSAGE, { description: `"${feature}" estará disponível em uma próxima versão.` })
}
