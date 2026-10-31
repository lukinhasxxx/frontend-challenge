import { NETWORKS, NFT_CATEGORIES, type NftListResponse } from '@/api/contracts'
import { CATEGORY_LABEL, NETWORK_LABEL } from '../labels'
import { useCatalogSearch } from '../use-catalog-search'
import { FilterList } from './filter-list'
import { PriceRangeFilter } from './price-range-filter'

/** Filtros combináveis (Coleções, Faixa de preço, Rede). Usado na sidebar e no painel mobile. */
export function CatalogFilters({ facets }: { facets: NftListResponse['facets'] | undefined }) {
  const { search, update } = useCatalogSearch()

  return (
    <div className="flex flex-col gap-10">
      <FilterList
        title="Coleções"
        options={NFT_CATEGORIES}
        labels={CATEGORY_LABEL}
        counts={facets?.categories}
        value={search.category}
        onChange={(category) => update({ category })}
      />
      {facets && (
        <PriceRangeFilter
          // Remonta quando os limites ou o filtro da URL mudam (voltar/avançar).
          key={`${facets.priceRange.min}-${facets.priceRange.max}-${search.minPrice}-${search.maxPrice}`}
          bounds={facets.priceRange}
          value={{ min: search.minPrice, max: search.maxPrice }}
          onApply={(range) => update(range)}
        />
      )}
      <FilterList
        title="Rede"
        options={NETWORKS}
        labels={NETWORK_LABEL}
        counts={facets?.networks}
        value={search.network}
        onChange={(network) => update({ network })}
      />
    </div>
  )
}
