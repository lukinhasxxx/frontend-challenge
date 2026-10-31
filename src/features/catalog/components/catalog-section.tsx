import { Link } from '@tanstack/react-router'
import type { UseQueryResult } from '@tanstack/react-query'
import type { FeaturedNftsResponse, NftListResponse } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { CATALOG_PAGE_SIZE } from '../search'
import { useCatalogSearch } from '../use-catalog-search'
import { NftCard, NftCardSkeleton } from './nft-card'
import { CatalogFilters } from './catalog-filters'
import { CatalogToolbar } from './catalog-toolbar'
import { SpotlightCard } from './spotlight-card'

type CatalogSectionProps = {
  list: UseQueryResult<NftListResponse>
  featured: UseQueryResult<FeaturedNftsResponse>
}

/**
 * Mobile (< 768px): 2 colunas desencontradas, como no Figma.
 * Tablet (768–1023px): 3 colunas, filtros em painel.
 * Desktop (≥ 1024px): sidebar de 310px + 3 colunas.
 */
const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 [&>*:nth-child(even)]:translate-y-8 md:grid-cols-3 md:gap-x-8 md:gap-y-[4.5rem] md:pb-0 md:[&>*:nth-child(even)]:translate-y-0'

export function CatalogSection({ list, featured }: CatalogSectionProps) {
  const { search, update } = useCatalogSearch()
  const data = list.data

  return (
    <section id="mercado" aria-labelledby="mercado-title" className="container scroll-mt-6">
      <h2 id="mercado-title" className="sr-only">
        Mercado
      </h2>
      <div className="flex gap-12">
        <aside aria-label="Filtros" className="hidden w-[19.375rem] shrink-0 flex-col gap-6 lg:flex">
          <div className="bg-card p-5">
            <CatalogFilters facets={data?.facets} />
          </div>
          <SpotlightCard nft={featured.data?.spotlight} isLoading={featured.isPending} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <CatalogToolbar facets={data?.facets} />

          {search.q && (
            <p className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
              Resultados para <span className="font-bold text-foreground">“{search.q}”</span>
              <Button variant="link" size="sm" className="h-auto px-0" onClick={() => update({ q: undefined })}>
                Limpar busca
              </Button>
            </p>
          )}

          <p className="sr-only" aria-live="polite">
            {data && !list.isPlaceholderData ? `${data.total} NFTs encontrados. Página ${data.page} de ${data.totalPages}.` : ''}
          </p>

          {list.isPending ? (
            <ul className={gridClass} aria-label="Carregando NFTs">
              {Array.from({ length: CATALOG_PAGE_SIZE }, (_, i) => (
                <li key={i}>
                  <NftCardSkeleton />
                </li>
              ))}
            </ul>
          ) : list.isError ? (
            <div role="alert" className="flex flex-col items-start gap-4 bg-card p-6">
              <p className="text-h3">Não foi possível carregar os NFTs.</p>
              <p className="text-body-sm text-muted-foreground">{list.error.message}</p>
              <Button onClick={() => void list.refetch()} disabled={list.isFetching}>
                {list.isFetching ? 'Tentando…' : 'Tentar novamente'}
              </Button>
            </div>
          ) : data && data.items.length === 0 ? (
            <div className="flex flex-col items-start gap-4 bg-card p-6">
              <p className="text-h3">Nenhum NFT encontrado.</p>
              <p className="text-body-sm text-muted-foreground">Ajuste a busca ou os filtros para ver mais resultados.</p>
              <Button asChild variant="outline">
                <Link to="/" hash="mercado" resetScroll={false}>
                  Limpar filtros
                </Link>
              </Button>
            </div>
          ) : (
            data && (
              <ul
                className={cn(gridClass, list.isPlaceholderData && 'opacity-60 transition-opacity')}
                aria-busy={list.isFetching}
              >
                {data.items.map((nft) => (
                  <li key={nft.id}>
                    <NftCard
                      name={nft.name}
                      image={nft.thumbnail}
                      priceEth={nft.priceEth}
                      previousPriceEth={nft.previousPriceEth}
                      tag={nft.attributes.includes('Raro') ? 'Raro' : undefined}
                      renderLink={(content, className) => (
                        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={className}>
                          {content}
                        </Link>
                      )}
                    />
                  </li>
                ))}
              </ul>
            )
          )}

          {data && data.items.length > 0 && (
            <Pagination
              className="justify-center pt-4 md:justify-end md:pt-14"
              page={search.page}
              totalPages={data.totalPages}
              renderLink={(page, content, attrs) => (
                <Link key={attrs['aria-label']} to="/" search={(prev) => ({ ...prev, page })} hash="mercado" {...attrs}>
                  {content}
                </Link>
              )}
            />
          )}
        </div>
      </div>
    </section>
  )
}
