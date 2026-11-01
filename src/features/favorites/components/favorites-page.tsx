import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { CatalogNftCard } from '@/features/catalog/components/catalog-nft-card'
import { NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { useFavorites } from '../api'

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-8 md:gap-y-[4.375rem] lg:grid-cols-4'

/**
 * Sem frame no Figma: segue o padrão visual do catálogo (mesmos cards, coração e atalhos).
 * Desfavoritar aqui tira o card na hora (update otimista no cache).
 */
export function FavoritesPage() {
  const favorites = useFavorites()
  const items = favorites.data?.items

  return (
    <section aria-labelledby="favorites-title" className="container flex flex-col gap-8 pt-10 md:pt-12">
      <h1 id="favorites-title" className="text-h2">
        Favoritos
      </h1>
      <p className="sr-only" aria-live="polite">
        {items ? `${items.length} ${items.length === 1 ? 'NFT favoritado' : 'NFTs favoritados'}.` : ''}
      </p>

      {favorites.isPending ? (
        <ul className={gridClass} aria-label="Carregando favoritos">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : favorites.isError ? (
        <div role="alert" className="flex flex-col items-start gap-4 bg-card p-6">
          <p className="text-body">Não foi possível carregar seus favoritos.</p>
          <Button variant="outline" onClick={() => void favorites.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : !items?.length ? (
        <div className="flex flex-col items-start gap-4 bg-card p-6">
          <p className="text-body">Você ainda não favoritou nenhum NFT.</p>
          <p className="text-body-sm text-muted-foreground">Toque no coração de um NFT para guardá-lo aqui.</p>
          <Button asChild variant="outline">
            <Link to="/" hash="mercado">
              Explorar o mercado
            </Link>
          </Button>
        </div>
      ) : (
        <ul className={gridClass} aria-label="NFTs favoritados">
          {items.map((nft) => (
            <li key={nft.id}>
              <CatalogNftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
