import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { featuredNftsQueryOptions, nftListQueryOptions } from '@/features/catalog/api'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { MobileSearchBar } from '@/features/catalog/components/mobile-search-bar'
import { CATALOG_SEARCH_DEFAULTS, catalogSearchSchema, toListParams } from '@/features/catalog/search'
import { HomeBlog } from '@/features/home/components/home-blog'
import { DesktopHero, MobileHero } from '@/features/home/components/home-hero'
import { HomePromos } from '@/features/home/components/home-promos'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(CATALOG_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => toListParams(search),
  // Pré-busca sem bloquear: a página aparece na hora com skeletons.
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(nftListQueryOptions(deps))
    void context.queryClient.prefetchQuery(featuredNftsQueryOptions)
  },
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()
  const list = useQuery(nftListQueryOptions(toListParams(search)))
  const featured = useQuery(featuredNftsQueryOptions)

  return (
    <div className="flex flex-col gap-6 pt-10 md:gap-24 md:pt-0">
      <div className="container flex flex-col gap-4 md:hidden">
        <MobileSearchBar facets={list.data?.facets} />
        <MobileHero nfts={featured.data?.hero} isLoading={featured.isPending} />
      </div>
      <DesktopHero nfts={featured.data?.hero} isLoading={featured.isPending} />
      <CatalogSection list={list} featured={featured} />
      <HomePromos />
      <HomeBlog />
    </div>
  )
}
