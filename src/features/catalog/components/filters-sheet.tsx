import type { ReactNode } from 'react'
import { NFT_SORTS, type NftListResponse, type NftSort } from '@/api/contracts'
import { Field } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SORT_LABEL } from '../labels'
import { useCatalogSearch } from '../use-catalog-search'
import { CatalogFilters } from './catalog-filters'

/**
 * Filtros no mobile/tablet (abaixo de 1024px). O Figma mobile desenha só o
 * botão; o painel segue o padrão visual da sidebar desktop.
 */
export function FiltersSheet({ facets, trigger }: { facets: NftListResponse['facets'] | undefined; trigger: ReactNode }) {
  const { search, update } = useCatalogSearch()

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[2.5rem] px-6 pb-10">
        <SheetHeader className="px-0">
          <SheetTitle className="text-h2">Filtros</SheetTitle>
          <SheetDescription>Os resultados são atualizados a cada escolha.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-10">
          <Field label="Ordenar por">
            {(control) => (
              <Select value={search.sort} onValueChange={(sort) => update({ sort: sort as NftSort })}>
                <SelectTrigger {...control} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NFT_SORTS.map((sort) => (
                    <SelectItem key={sort} value={sort}>
                      {SORT_LABEL[sort]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
          <CatalogFilters facets={facets} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
