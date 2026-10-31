import { SlidersHorizontal } from 'lucide-react'
import { NFT_SORTS, NFT_TABS, type NftListResponse, type NftSort } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { SORT_LABEL, TAB_LABEL } from '../labels'
import { useCatalogSearch } from '../use-catalog-search'
import { FiltersSheet } from './filters-sheet'

const tabClass =
  'relative cursor-pointer whitespace-nowrap pt-1 pb-1.5 text-body-sm text-foreground transition-colors hover:text-accent-foreground md:text-body md:font-medium after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary after:opacity-0 aria-pressed:font-bold aria-pressed:text-accent-foreground aria-pressed:after:opacity-100'

/** Abas "Todos os NFTs / Novos lançamentos / Em alta" + "Ordenar por" (desktop). */
export function CatalogToolbar({ facets }: { facets: NftListResponse['facets'] | undefined }) {
  const { search, update } = useCatalogSearch()

  return (
    <div className="flex items-center justify-between gap-4">
      <div role="group" aria-label="Filtrar catálogo" className="flex gap-4 overflow-x-auto [scrollbar-width:none] md:gap-5">
        {NFT_TABS.map((tab) => (
          <button key={tab} type="button" aria-pressed={search.tab === tab} onClick={() => update({ tab })} className={cn(tabClass)}>
            {TAB_LABEL[tab]}
          </button>
        ))}
      </div>

      <div className="hidden items-center gap-3 md:flex">
        {/* Entre 768 e 1023px não há espaço para a sidebar: filtros em painel. */}
        <FiltersSheet
          facets={facets}
          trigger={
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal aria-hidden="true" />
              Filtros
            </Button>
          }
        />
        <label htmlFor="catalog-sort" className="text-body whitespace-nowrap text-foreground">
          Ordenar por:
        </label>
        <Select value={search.sort} onValueChange={(sort) => update({ sort: sort as NftSort })}>
          <SelectTrigger id="catalog-sort" className="h-auto border-0 bg-transparent p-0 text-body text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {NFT_SORTS.map((sort) => (
              <SelectItem key={sort} value={sort}>
                {SORT_LABEL[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
