import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { EthPrice } from '@/components/ui/eth-price'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type NftCardProps = {
  name: string
  image: string
  priceEth: string
  previousPriceEth?: string | null
  /** Etiqueta sobre a imagem (ex.: "Raro", "Esgotado"). */
  tag?: string
  /** Ação sobreposta à imagem, no canto superior (ex.: coração no mobile). */
  action?: ReactNode
  /** Conteúdo sobre a base da imagem (ex.: atalhos no hover do desktop). */
  overlay?: ReactNode
  /**
   * Envolve o nome em um link. O link "estica" sobre o card inteiro
   * (um único alvo de clique/teclado por card).
   */
  renderLink?: (content: ReactNode, className: string) => ReactNode
  className?: string
}

const stretchedLink = 'after:absolute after:inset-0 after:content-[""] focus-visible:outline-none'

/**
 * Card do catálogo. Mobile: caixa com gradiente e raio 20; desktop: caixa
 * chapada sem raio (fiel aos frames do Figma).
 */
function NftCard({ name, image, priceEth, previousPriceEth, tag, action, overlay, renderLink, className }: NftCardProps) {
  return (
    <article
      className={cn(
        'group/card relative flex flex-col gap-2 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-ring md:gap-3',
        className,
      )}
    >
      {/* Figma (hover no desktop): linha cobre no topo do card. */}
      <div className="relative rounded-[1.25rem] bg-linear-to-b from-card to-surface-raised px-1 pt-3 pb-5 md:rounded-none md:bg-card md:bg-none md:pt-7 md:group-hover/card:shadow-[inset_0_1px_0_0_var(--color-primary)]">
        <img
          src={image}
          alt=""
          width={250}
          height={250}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-xl object-cover transition-transform duration-300 group-hover/card:scale-[1.02] md:rounded-[0.9375rem]"
        />
        {tag && (
          // Só o frame mobile do Figma mostra a etiqueta.
          <Badge variant="tag" className="absolute top-3 left-0 md:hidden">
            {tag}
          </Badge>
        )}
        {action && <div className="absolute top-5 right-3 z-10 md:top-9">{action}</div>}
        {overlay}
      </div>
      <div className="flex flex-col gap-1 pl-2 md:gap-3 md:pl-0">
        <h3 className="truncate text-[0.9375rem] leading-5 font-normal md:text-body-lg">
          {renderLink ? renderLink(name, stretchedLink) : name}
        </h3>
        <EthPrice value={priceEth} previous={previousPriceEth} className="text-h3" />
      </div>
    </article>
  )
}

/** Mesmas dimensões do card final (evita CLS). */
function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:gap-3" aria-hidden="true">
      <div className="rounded-[1.25rem] bg-card px-1 pt-3 pb-5 md:rounded-none md:pt-7">
        <Skeleton className="aspect-square w-full rounded-xl md:rounded-[0.9375rem]" />
      </div>
      <div className="flex flex-col gap-1 pl-2 md:gap-3 md:pl-0">
        <Skeleton className="h-5 w-3/4 md:h-6" />
        <Skeleton className="h-5 w-1/3 md:h-6" />
      </div>
    </div>
  )
}

export { NftCard, NftCardSkeleton }
