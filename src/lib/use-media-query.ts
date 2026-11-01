import { useCallback, useSyncExternalStore } from 'react'

/** Acompanha uma media query (ex.: "(min-width: 768px)") e re-renderiza quando ela muda. */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/** Breakpoint `md` do Tailwind: header desktop/tablet. */
export const DESKTOP_QUERY = '(min-width: 768px)'
