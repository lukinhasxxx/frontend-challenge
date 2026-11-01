import { useId, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"

type ControlProps = {
  id: string
  "aria-invalid": boolean | undefined
  "aria-describedby": string | undefined
  "aria-required": boolean | undefined
}

type FieldProps = {
  label: string
  /** Mensagem de erro (validação local ou da API). */
  error?: string
  description?: string
  required?: boolean
  /** Label só para leitores de tela (campos que no Figma têm apenas placeholder). */
  hideLabel?: boolean
  className?: string
  /** Recebe os atributos de acessibilidade para repassar ao controle. */
  children: (control: ControlProps) => ReactNode
}

/**
 * Campo de formulário acessível: label associado, descrição e erro ligados
 * ao controle por `aria-describedby`, e erro anunciado ao aparecer.
 */
function Field({ label, error, description, required, hideLabel, className, children }: FieldProps) {
  const id = useId()
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div data-slot="field" className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} className={cn("text-body font-normal text-foreground", hideLabel && "sr-only")}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-required">
            *
          </span>
        )}
      </Label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })}
      {description && (
        <p id={descriptionId} className="text-caption text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-caption text-destructive-text">
          {error}
        </p>
      )}
    </div>
  )
}

export { Field }
