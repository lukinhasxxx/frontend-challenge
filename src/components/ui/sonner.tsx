import { Toaster as Sonner, type ToasterProps } from "sonner"

/** Toasts (anunciados por leitores de tela via aria-live). */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!bg-surface-raised !border-border-strong !text-foreground !font-sans !text-body-sm",
          description: "!text-muted-foreground",
          error: "!text-destructive-text",
          success: "!text-success",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
