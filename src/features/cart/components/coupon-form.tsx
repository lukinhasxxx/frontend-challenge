import { useId, useState, type FormEvent } from 'react'
import { ApiClientError } from '@/api/errors'
import { cn } from '@/lib/utils'
import { useApplyCoupon, useRemoveCoupon } from '../api'

type CouponFormProps = { appliedCode: string | null; percentOff: number | null; variant: 'desktop' | 'mobile' }

/**
 * Código promocional (Figma: campo + "Aplicar"). Validação é da API: inválido/expirado
 * voltam como erro do campo. Aplicado, o campo mostra o código e o botão vira "Remover".
 */
export function CouponForm({ appliedCode, percentOff, variant }: CouponFormProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const inputId = useId()
  const errorId = `${inputId}-error`
  const statusId = `${inputId}-status`
  const desktop = variant === 'desktop'

  function submit(event: FormEvent) {
    event.preventDefault()
    if (appliedCode) {
      remove.mutate(undefined, { onSuccess: () => setCode('') })
      return
    }
    if (!code.trim()) {
      setError('Informe o código promocional.')
      return
    }
    setError(null)
    apply.mutate(code, {
      onError: (err) =>
        setError(err instanceof ApiClientError ? (err.fieldErrors.code ?? err.message) : 'Não foi possível aplicar o cupom.'),
    })
  }

  const pending = apply.isPending || remove.isPending
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      {desktop && (
        <label htmlFor={inputId} className="text-[0.875rem] leading-4 font-bold">
          Código promocional
        </label>
      )}
      <div
        className={cn(
          'flex overflow-hidden',
          desktop ? 'h-10 rounded-[0.1875rem] border border-primary' : 'h-[3.125rem] rounded-full border border-border bg-card shadow-card',
          error && 'border-destructive',
        )}
      >
        <input
          id={inputId}
          value={appliedCode ?? code}
          readOnly={Boolean(appliedCode)}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Digite o código promocional..."
          aria-label={desktop ? undefined : 'Código promocional'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : appliedCode ? statusId : undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-subtle focus-visible:bg-surface-raised',
            desktop ? 'px-2 text-[0.75rem]' : 'px-4 text-[0.8125rem]',
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            'shrink-0 cursor-pointer text-[0.9375rem] leading-4 font-bold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-70',
            desktop
              ? 'w-[6.375rem] bg-primary text-primary-foreground hover:bg-primary-hover'
              : 'w-[6.0625rem] rounded-full bg-linear-to-r from-primary/55 to-primary text-foreground',
          )}
        >
          {appliedCode ? 'Remover' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-caption text-destructive-text">
          {error}
        </p>
      )}
      {appliedCode && (
        <p id={statusId} role="status" className="text-caption text-accent-foreground">
          Cupom {appliedCode} aplicado{percentOff ? `: ${percentOff}% de desconto.` : '.'}
        </p>
      )}
    </form>
  )
}
