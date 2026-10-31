import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export default function Devtools() {
  // No mobile a barra de abas ocupa a base da tela: botões vão para o topo.
  const isMobile = window.matchMedia('(max-width: 767px)').matches
  return (
    <>
      <ReactQueryDevtools buttonPosition={isMobile ? 'top-right' : 'bottom-right'} />
      <TanStackRouterDevtools position={isMobile ? 'top-left' : 'bottom-left'} />
    </>
  )
}
