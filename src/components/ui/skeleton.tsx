import { cn } from "@/lib/utils"

/** Placeholder com shimmer. Dimensione igual ao conteúdo final para evitar CLS. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-shimmer rounded-md bg-surface-raised", className)}
      {...props}
    />
  )
}

export { Skeleton }
