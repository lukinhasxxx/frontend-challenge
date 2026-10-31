import { Star } from 'lucide-react'
import type { Nft } from '@/api/contracts'
import { cn } from '@/lib/utils'

/** Desktop: 5 estrelas + "19 avaliações de colecionadores". */
export function NftRatingStars({ rating }: { rating: Nft['rating'] }) {
  return (
    <p className="flex items-center gap-1 text-body-sm">
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn('size-4 text-rating', i < Math.round(rating.average) && 'fill-current')} />
        ))}
      </span>
      <span className="sr-only">Nota {rating.average.toFixed(1)} de 5, </span>
      {rating.count} avaliações de colecionadores
    </p>
  )
}

/** Mobile: pílula "★ 4.8 (19)". */
export function NftRatingPill({ rating }: { rating: Nft['rating'] }) {
  return (
    <p className="flex items-center gap-1 rounded-full border border-primary px-2 py-1 text-body-sm">
      <Star className="size-4 fill-current text-rating" aria-hidden="true" />
      <span className="font-bold">{rating.average.toFixed(1)}</span>
      <span className="text-muted-foreground">
        ({rating.count})<span className="sr-only"> avaliações</span>
      </span>
    </p>
  )
}
