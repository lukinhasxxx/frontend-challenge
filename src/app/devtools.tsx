import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query'

/**
 * Devtools do Router e do Query só a partir de 768px: no mobile todos os cantos são usados
 * pelo layout do Figma (voltar, favoritar, barras fixas) e os botões cobririam a interface.
 * O painel "Mock" continua disponível em qualquer largura.
 */
export default function Devtools() {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  if (!desktop) return null
  return (
    <>
      <ReactQueryDevtools buttonPosition="bottom-right" />
      <TanStackRouterDevtools position="bottom-left" />
    </>
  )
}
