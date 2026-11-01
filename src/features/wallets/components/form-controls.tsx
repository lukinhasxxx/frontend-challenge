import { forwardRef, useId, type ComponentProps, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Campos dos frames "Carteiras" e "Pagamento": 40px, borda #3F2319, raio 3, texto 14px. */
export const figmaInputClass =
  'h-10 w-full min-w-0 rounded-[0.1875rem] border border-border bg-transparent px-3 text-[0.875rem] leading-[0.9375rem] text-foreground outline-none transition-colors placeholder:text-subtle focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring aria-invalid:border-destructive read-only:text-muted-foreground'

type ControlProps = {
  id: string
  'aria-invalid': boolean | undefined
  'aria-describedby': string | undefined
  'aria-required': boolean | undefined
}

type LabeledFieldProps = {
  label: string
  required?: boolean
  /** Figma: campo só com placeholder (ex.: "ENS ou carteira secundária (opcional)"). */
  hideLabel?: boolean
  error?: string
  /** Figma "Carteiras" sobrepõe label e campo em 4px; "Pagamento" não. */
  overlap?: boolean
  className?: string
  children: (control: ControlProps) => ReactNode
}

/** Label 15px + asterisco coral 22px (Figma), erro ligado ao controle por `aria-describedby`. */
export function LabeledField({ label, required, hideLabel, error, overlap = true, className, children }: LabeledFieldProps) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={cn('flex min-w-0 flex-col', hideLabel && 'md:justify-end', className)}>
      <label
        htmlFor={id}
        className={cn('flex h-[1.8125rem] items-center text-[0.9375rem] leading-[0.9375rem]', overlap && '-mb-1', hideLabel && 'sr-only')}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-[1.375rem] leading-[1.8125rem] text-required">
            *
          </span>
        )}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': errorId, 'aria-required': required || undefined })}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-caption text-destructive-text">
          {error}
        </p>
      )}
    </div>
  )
}

type NativeSelectProps = ComponentProps<'select'> & { placeholder?: string; wrapperClassName?: string }

/** Select nativo com a seta do Figma: acessível e confiável no teclado e no mobile. */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
  { className, wrapperClassName, placeholder, children, ...props },
  ref,
) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        ref={ref}
        required={Boolean(placeholder)}
        className={cn(figmaInputClass, 'cursor-pointer appearance-none pr-9 invalid:text-subtle [&>option]:bg-popover [&>option]:text-foreground', className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 size-5 -translate-y-1/2 text-foreground" />
    </div>
  )
})

/** Círculo de seleção do Figma (16px, borda cobre 1.2px, miolo cobre quando marcado). */
export function ChoiceIndicator({ checked, muted, className }: { checked: boolean; muted?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-full border-[1.2px] transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
        checked || !muted ? 'border-primary' : 'border-border-strong',
        className,
      )}
    >
      {checked && <span className="size-2 rounded-full bg-primary" />}
    </span>
  )
}
