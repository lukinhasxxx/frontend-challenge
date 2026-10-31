import { getRouteApi } from '@tanstack/react-router'
import type { CatalogSearch } from './search'

const homeRoute = getRouteApi('/')

/**
 * Lê e altera o estado do catálogo na URL. Qualquer mudança de filtro volta
 * para a página 1; cada mudança vira uma entrada no histórico (voltar/avançar).
 */
export function useCatalogSearch() {
  const search = homeRoute.useSearch()
  const navigate = homeRoute.useNavigate()

  function update(patch: Partial<CatalogSearch>, options: { keepPage?: boolean } = {}) {
    void navigate({
      search: (prev) => ({ ...prev, ...patch, ...(options.keepPage ? {} : { page: 1 }) }),
      resetScroll: false,
    })
  }

  return { search, update }
}
