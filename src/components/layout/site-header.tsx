import { Link, useMatches } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { LogIn, ShoppingCart, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { sessionQueryOptions } from '@/features/auth/api'
import { cartQueryOptions } from '@/features/cart/api'
import { cn } from '@/lib/utils'
import { HeaderSearch } from './header-search'
import { Logo } from './logo'
import { UnavailableLink } from './unavailable-link'

const navLinkClass =
  'relative pb-6 text-body-lg text-foreground transition-colors hover:text-accent-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-primary after:opacity-0 data-[status=active]:font-bold data-[status=active]:text-accent-foreground data-[status=active]:after:opacity-100'

/** Header desktop/tablet (Figma: linha de 1200px, nav central, ações à direita). */
export function SiteHeader() {
  const session = useQuery(sessionQueryOptions)
  // Figma: no detalhe do NFT e no carrinho o item ativo do menu é "Mercado".
  const onMarket = useMatches({ select: (matches) => matches.some((m) => m.routeId === '/nft/$nftId' || m.routeId === '/carrinho') })
  const cart = useQuery(cartQueryOptions)
  const cartCount = cart.data?.itemCount ?? 0

  return (
    <header className="hidden md:block">
      <div className="container pt-6">
        <div className="flex items-start justify-between border-b border-primary/40">
          <div className="w-40 pt-2">
            <Logo />
          </div>

          <nav aria-label="Principal" className="flex gap-6 lg:gap-10">
            <Link to="/" activeOptions={{ exact: true, includeHash: true }} className={navLinkClass}>
              Início
            </Link>
            <Link
              to="/"
              hash="mercado"
              activeOptions={{ includeHash: true }}
              aria-current={onMarket ? 'page' : undefined}
              className={cn(navLinkClass, onMarket && 'font-bold text-accent-foreground after:opacity-100')}
            >
              Mercado
            </Link>
            {/* Páginas editoriais: fora do escopo (SPEC §3). */}
            <UnavailableLink className={navLinkClass}>Criadores</UnavailableLink>
            <UnavailableLink className={navLinkClass}>Aprenda</UnavailableLink>
          </nav>

          <div className="flex w-40 items-center justify-end gap-5 lg:w-52 lg:gap-7">
            <HeaderSearch />
            <Link
              to="/carrinho"
              aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
              className="relative hover:text-accent-foreground"
            >
              <ShoppingCart className="size-6" aria-hidden="true" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-2 border-2 border-background">{cartCount}</Badge>
              )}
            </Link>
            {session.data ? (
              <Button asChild size="sm" variant="outline" className="h-[35px] max-w-36">
                <Link to="/perfil">
                  <UserRound aria-hidden="true" />
                  <span className="truncate">{session.data.user.name.split(' ')[0]}</span>
                </Link>
              </Button>
            ) : (
              <Button asChild className="h-[35px] px-2.5">
                {/* Abre o login sobre a tela atual; após entrar, o usuário continua onde estava. */}
                <Link to="." search={(prev) => ({ ...prev, auth: 'login' })}>
                  <LogIn aria-hidden="true" className="size-5" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
