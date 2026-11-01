import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "rounded-md bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        /** CTA principal mobile (gradiente acobreado, pílula). */
        cta: "rounded-full bg-(image:--gradient-cta) font-bold text-primary-foreground shadow-button hover:brightness-110 active:brightness-95",
        outline:
          "rounded-md border border-border-strong bg-transparent text-foreground hover:border-primary hover:text-accent-foreground",
        secondary: "rounded-md bg-secondary text-secondary-foreground hover:bg-surface-dark",
        ghost: "rounded-md text-foreground hover:bg-secondary hover:text-accent-foreground",
        link: "text-accent-foreground underline-offset-4 hover:underline",
        destructive: "rounded-md bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 text-body-lg",
        sm: "h-8 gap-1.5 px-3 text-body-sm",
        lg: "h-12 px-6 text-body-lg",
        xl: "h-14 px-8 text-body-lg",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

// React 18: forwardRef para os gatilhos Radix (asChild) devolverem o foco ao fechar diálogos.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

export { Button, buttonVariants }
