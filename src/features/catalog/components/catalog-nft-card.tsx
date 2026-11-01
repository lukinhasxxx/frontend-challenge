import { Link } from '@tanstack/react-router'
import { Search, ShoppingCart } from 'lucide-react'
import type { Nft } from '@/api/contracts'
import { cheapestAvailableEdition, useAddToCartAction } from '@/features/cart/use-add-to-cart'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { NftCard } from './nft-card'

/** Figma (hover no desktop): 3 botões 35×35 (#2F1D15, borda #3F2319, raio 4) na borda inferior da imagem. */
const quickActionClass =
  'relative z-10 flex size-[2.1875rem] cursor-pointer items-center justify-center rounded-xs border border-border bg-surface-raised text-foreground transition-colors hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:text-accent-foreground [&_svg]:size-5'

function QuickActions({ nft }: { nft: Nft }) {
  const { add, pending } = useAddToCartAction()
  const edition = cheapestAvailableEdition(nft)

  return (
    <div className="absolute inset-x-0 bottom-[0.4375rem] hidden justify-center gap-2.5 opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100 md:flex">
      <button
        type="button"
        aria-label={edition ? `Adicionar ${nft.name} ao carrinho` : `${nft.name} esgotado`}
        disabled={!edition || pending}
        onClick={() => edition && add({ nftId: nft.id, editionId: edition.id, quantity: 1 }, { name: nft.name })}
        className={quickActionClass}
      >
        <ShoppingCart aria-hidden="true" />
      </button>
      <FavoriteButton nft={nft} className={quickActionClass} />
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} aria-label={`Ver detalhes de ${nft.name}`} className={quickActionClass}>
        <Search aria-hidden="true" />
      </Link>
    </div>
  )
}

/** Card do catálogo com ações: atalhos no hover (desktop) e coração sobre a imagem (mobile). */
export function CatalogNftCard({ nft, priority }: { nft: Nft; priority?: boolean }) {
  return (
    <NftCard
      name={nft.name}
      image={nft.thumbnail}
      priceEth={nft.priceEth}
      previousPriceEth={nft.previousPriceEth}
      tag={nft.attributes.includes('Raro') ? 'Raro' : undefined}
      action={
        <FavoriteButton
          nft={nft}
          className="flex size-[1.875rem] items-center justify-center rounded-full bg-background/80 text-muted-foreground aria-pressed:text-accent-foreground md:hidden"
          iconClassName="size-4"
        />
      }
      overlay={<QuickActions nft={nft} />}
      priority={priority}
      renderLink={(content, className) => (
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={className}>
          {content}
        </Link>
      )}
    />
  )
}
