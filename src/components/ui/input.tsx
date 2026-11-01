import * as React from "react"
import { cn } from "@/lib/utils"

// React 18: `ref` só chega a componentes de função via forwardRef (react-hook-form depende dela).
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function Input(
  { className, type, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-sm border border-border-strong bg-input px-4 text-body-sm text-foreground transition-colors outline-none placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
        "aria-invalid:border-destructive",
        "file:mr-3 file:border-0 file:bg-transparent file:text-body-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
})

export { Input }
