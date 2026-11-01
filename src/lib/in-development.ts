import { toast } from 'sonner'

export const IN_DEVELOPMENT_MESSAGE = 'Este recurso está em desenvolvimento.'

/** Aviso padrão para elementos do Figma que estão fora do escopo desta entrega. */
export function notifyInDevelopment(feature: string) {
  // Mesmo id: cliques repetidos substituem o aviso em vez de empilhar.
  toast.info(IN_DEVELOPMENT_MESSAGE, {
    id: 'in-development',
    description: `"${feature}" estará disponível em uma próxima versão.`,
    duration: 2_500,
  })
}
