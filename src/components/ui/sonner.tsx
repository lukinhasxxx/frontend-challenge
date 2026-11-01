import type { MouseEvent } from "react"
import { toast, Toaster as Sonner, type ToasterProps } from "sonner"

/** Clicar em um aviso o fecha (o Sonner pausa o tempo enquanto o ponteiro/toque está sobre ele). */
function dismissOnClick(event: MouseEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement
  if (target.closest("button")) return // botões de ação do próprio toast seguem normais
  if (target.closest("[data-sonner-toast]")) toast.dismiss()
}

/** Toasts (anunciados por leitores de tela via aria-live). */
function Toaster(props: ToasterProps) {
  return (
    <div onClick={dismissOnClick}>
      <Sonner
        theme="dark"
        position="top-center"
        duration={3_000}
        toastOptions={{
          classNames: {
            toast: "!cursor-pointer !bg-surface-raised !border-border-strong !text-foreground !font-sans !text-body-sm",
            description: "!text-muted-foreground",
            // Texto sempre claro (legível); a cor de status fica só no ícone.
            error: "[&_[data-icon]]:!text-destructive-text",
            success: "[&_[data-icon]]:!text-success",
            actionButton: "!bg-primary !text-primary-foreground !font-sans !font-medium",
          },
        }}
        {...props}
      />
    </div>
  )
}

export { Toaster }
