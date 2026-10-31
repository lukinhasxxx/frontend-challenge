import type { ComponentType, SVGProps } from 'react'
import { Link, useMatches, type LinkProps } from '@tanstack/react-router'
import { Heart, House, ScanLine, ShoppingCart, UserRound } from 'lucide-react'
import { notifyInDevelopment } from '@/lib/in-development'
import { cn } from '@/lib/utils'

type Tab = { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> } & Pick<LinkProps, 'to' | 'hash'>

const TABS: Tab[] = [
  { label: 'Início', icon: House, to: '/' },
  { label: 'Favoritos', icon: Heart, to: '/favoritos' },
  { label: 'Carrinho', icon: ShoppingCart, to: '/carrinho' },
  { label: 'Perfil', icon: UserRound, to: '/perfil' },
]

const tabClass =
  'flex size-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-accent-foreground data-[status=active]:text-accent-foreground'

/**
 * Navegação mobile do Figma: barra fixa inferior com botão central elevado.
 * Telas com barra de ação própria (detalhe, carrinho, checkout) a escondem
 * via `staticData.hideMobileTabBar`.
 */
export function MobileTabBar() {
  const hidden = useMatches({ select: (matches) => matches.some((m) => m.staticData.hideMobileTabBar) })
  if (hidden) return null

  const [home, favorites, cart, profile] = TABS as [Tab, Tab, Tab, Tab]
  const renderTab = ({ label, icon: Icon, ...link }: Tab) => (
    <Link {...link} aria-label={label} activeOptions={{ exact: link.to === '/' }} className={tabClass}>
      <Icon className="size-5" aria-hidden="true" />
    </Link>
  )

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-auto flex h-[4.75rem] max-w-md items-center justify-between rounded-t-[2rem] bg-card px-6 shadow-sheet">
        {renderTab(home)}
        {renderTab(favorites)}
        {/* Botão central do Figma (escanear): fora do escopo. */}
        <button
          type="button"
          aria-label="Escanear NFT (em desenvolvimento)"
          onClick={() => notifyInDevelopment('Escanear NFT')}
          className={cn(
            'absolute -top-8 left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-background bg-(image:--gradient-cta) text-foreground shadow-button',
          )}
        >
          <ScanLine className="size-6" aria-hidden="true" />
        </button>
        <span className="w-12" aria-hidden="true" />
        {renderTab(cart)}
        {renderTab(profile)}
      </div>
    </nav>
  )
}
