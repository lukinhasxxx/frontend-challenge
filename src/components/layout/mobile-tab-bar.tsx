import type { ComponentType, SVGProps } from 'react'
import { Link, useMatches, type LinkProps } from '@tanstack/react-router'
import { CartFilledIcon, HeartFilledIcon, HomeFilledIcon, ScanIcon, UserFilledIcon } from '@/components/icons/tab-bar'
import { notifyInDevelopment } from '@/lib/in-development'
import { cn } from '@/lib/utils'

type Tab = {
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  iconClass: string
  /** Centro do ícone a partir da borda (Figma, frame de 414px). */
  position: string
} & Pick<LinkProps, 'to'>

const TABS: Tab[] = [
  { label: 'Início', icon: HomeFilledIcon, iconClass: 'size-5', to: '/', position: 'left-[1.375rem]' },
  { label: 'Favoritos', icon: HeartFilledIcon, iconClass: 'h-[1.125rem] w-5', to: '/favoritos', position: 'left-[5.875rem]' },
  { label: 'Carrinho', icon: CartFilledIcon, iconClass: 'size-5', to: '/carrinho', position: 'right-[5.5rem]' },
  { label: 'Perfil', icon: UserFilledIcon, iconClass: 'size-5', to: '/perfil', position: 'right-[1.625rem]' },
]

/** Recorte central do Figma (151,7 × 95), exportado do vetor "Tab Bar" e mantido com largura fixa. */
function Notch() {
  return (
    <svg viewBox="0 0 151.7 95" className="-mx-px h-full w-[9.48rem] shrink-0 fill-card" aria-hidden="true">
      <path d="M0 0C13.75 0 25.98 8.2 31.83 20.65C39.59 37.18 56.39 48.62 75.85 48.62C95.31 48.62 112.11 37.17 119.87 20.65C125.72 8.2 137.94 0 151.7 0V95H0Z" />
    </svg>
  )
}

/**
 * Navegação mobile do Figma ("Tab Bar", 414×126): barra com recorte côncavo, botão central
 * de 65px meio para fora e ícones preenchidos. Telas com barra de ação própria (detalhe,
 * carrinho, checkout) a escondem via `staticData.hideMobileTabBar`.
 */
export function MobileTabBar() {
  const hidden = useMatches({ select: (matches) => matches.some((m) => m.staticData.hideMobileTabBar) })
  if (hidden) return null

  return (
    <nav
      aria-label="Navegação inferior"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative h-[7.875rem]">
        {/* Barra: laterais elásticas + recorte fixo, com a sombra para cima do Figma. */}
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex h-[5.9375rem] drop-shadow-[0_-10px_30px_rgb(10_6_4/0.45)]">
          <span className="flex-1 rounded-tl-[1.8125rem] bg-card" />
          <Notch />
          <span className="flex-1 rounded-tr-[1.8125rem] bg-card" />
          {TABS.map(({ label, icon: Icon, iconClass, position, to }) => (
            <Link
              key={label}
              to={to}
              aria-label={label}
              activeOptions={{ exact: to === '/' }}
              className={cn(
                'absolute top-[1.625rem] flex size-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring data-[status=active]:text-accent-foreground',
                position,
              )}
            >
              <Icon className={iconClass} />
            </Link>
          ))}
        </div>
        {/* Botão central do Figma (escanear): fora do escopo. */}
        <button
          type="button"
          aria-label="Escanear NFT (em desenvolvimento)"
          onClick={() => notifyInDevelopment('Escanear NFT')}
          className="pointer-events-auto absolute top-0 left-1/2 flex size-[4.0625rem] -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-linear-to-b from-primary/40 to-primary text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ScanIcon className="h-6 w-[1.6875rem]" />
        </button>
      </div>
    </nav>
  )
}
