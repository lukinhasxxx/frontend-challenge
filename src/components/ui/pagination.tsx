import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type ItemAttrs = {
  className: string
  "aria-label": string
  "aria-current"?: "page"
}

type PaginationProps = {
  page: number
  totalPages: number
  /** Renderiza cada item como link (a paginação vive na URL). */
  renderLink: (page: number, content: ReactNode, attrs: ItemAttrs) => ReactNode
  className?: string
}

const itemClass =
  "inline-flex size-8 items-center justify-center rounded-xs border border-border text-body-sm text-foreground transition-colors hover:border-primary hover:text-accent-foreground"

/** Janela de até 5 páginas ao redor da atual. */
function visiblePages(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i)
}

function Pagination({ page, totalPages, renderLink, className }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginação" className={cn("flex items-center gap-2", className)}>
      {page > 1 &&
        renderLink(page - 1, <ChevronLeft aria-hidden="true" />, { className: itemClass, "aria-label": "Página anterior" })}
      {visiblePages(page, totalPages).map((p) =>
        renderLink(p, p, {
          className: cn(itemClass, p === page && "border-primary bg-primary font-bold text-primary-foreground hover:text-primary-foreground"),
          "aria-label": `Página ${p}`,
          ...(p === page && { "aria-current": "page" as const }),
        }),
      )}
      {page < totalPages &&
        renderLink(page + 1, <ChevronRight aria-hidden="true" />, { className: itemClass, "aria-label": "Próxima página" })}
    </nav>
  )
}

export { Pagination }
