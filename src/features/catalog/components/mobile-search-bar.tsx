import { useRef, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { NftListResponse } from '@/api/contracts'
import { useCatalogSearch } from '../use-catalog-search'
import { FiltersSheet } from './filters-sheet'

const DEBOUNCE_MS = 300

/** Figma mobile: campo "Explorar coleções" + botão de filtro laranja. */
export function MobileSearchBar({ facets }: { facets: NftListResponse['facets'] | undefined }) {
  const { search, update } = useCatalogSearch()
  // Rascunho só enquanto digita; fora disso o campo reflete a URL (voltar/avançar).
  const [draft, setDraft] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  function handleChange(value: string) {
    setDraft(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      update({ q: value.trim() || undefined })
      setDraft(null)
    }, DEBOUNCE_MS)
  }

  return (
    <div className="flex gap-2 md:hidden">
      <label className="flex h-[2.8125rem] flex-1 items-center gap-2 rounded-[0.625rem] bg-card px-3 focus-within:outline-2 focus-within:outline-ring">
        <Search className="size-5 shrink-0 text-subtle" aria-hidden="true" />
        <span className="sr-only">Buscar NFTs</span>
        <input
          type="search"
          value={draft ?? search.q ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Explorar coleções"
          className="w-full bg-transparent text-body-sm font-bold text-foreground outline-none placeholder:text-subtle"
        />
      </label>
      <FiltersSheet
        facets={facets}
        trigger={
          <button
            type="button"
            aria-label="Abrir filtros"
            className="flex size-[2.8125rem] shrink-0 cursor-pointer items-center justify-center rounded-[0.875rem] bg-(image:--gradient-cta) text-foreground"
          >
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </button>
        }
      />
    </div>
  )
}
