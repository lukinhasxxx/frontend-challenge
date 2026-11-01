import type { ReactNode } from 'react'
import { Heart } from 'lucide-react'
import type { Nft } from '@/api/contracts'
import { cn } from '@/lib/utils'
import { useFavorite } from '../api'

type FavoriteButtonProps = {
  nft: Nft
  className?: string
  iconClassName?: string
  /** Texto visível ao lado do ícone (ex.: "Favoritar" no detalhe desktop). */
  children?: (isFavorite: boolean) => ReactNode
}

/**
 * Coração com toggle otimista. Botão de alternância: o nome é fixo ("Favoritar X") e o estado
 * vem de `aria-pressed` (padrão WAI-ARIA); o coração preenchido mostra o estado visualmente.
 */
export function FavoriteButton({ nft, className, iconClassName, children }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorite(nft)
  const label = `Favoritar ${nft.name}`

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={children ? undefined : label}
      title={isFavorite ? 'Nos seus favoritos' : 'Favoritar'}
      onClick={toggle}
      className={cn('relative z-10 cursor-pointer focus-visible:outline-2 focus-visible:outline-ring', className)}
    >
      <Heart aria-hidden="true" className={cn('size-5 transition-colors', isFavorite && 'fill-current', iconClassName)} />
      {children?.(isFavorite)}
    </button>
  )
}
