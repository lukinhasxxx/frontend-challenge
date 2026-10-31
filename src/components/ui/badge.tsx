import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        /** Contador (ex.: carrinho). */
        default: "min-w-4 rounded-full bg-primary px-1 text-tiny text-primary-foreground",
        /** Etiqueta sobre a imagem (ex.: "RARO"). */
        tag: "rounded-xs bg-primary px-2 py-1 text-caption font-bold uppercase text-primary-foreground",
        /** Pílula com borda (edições, rating). */
        outline: "rounded-full border-border-strong px-3 py-1 text-body-sm text-foreground",
        muted: "rounded-full bg-secondary px-3 py-1 text-caption text-muted-foreground",
        success: "rounded-full bg-success/15 px-3 py-1 text-caption text-success",
        destructive: "rounded-full bg-destructive/15 px-3 py-1 text-caption text-destructive-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
