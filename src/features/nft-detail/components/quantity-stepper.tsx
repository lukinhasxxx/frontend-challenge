import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type QuantityStepperProps = {
  value: number
  max: number
  onChange: (value: number) => void
  size?: 'md' | 'sm'
  className?: string
}

/** Quantidade inteira entre 1 e o disponível da edição. */
export function QuantityStepper({ value, max, onChange, size = 'md', className }: QuantityStepperProps) {
  const buttonClass = cn(
    'flex cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40',
    size === 'md' ? 'size-[2.0625rem] [&_svg]:size-5' : 'size-[1.375rem] [&_svg]:size-4',
  )
  const disabled = max < 1

  return (
    <div role="group" aria-label="Quantidade" className={cn('flex items-center gap-3', className)}>
      <button type="button" aria-label="Diminuir quantidade" className={buttonClass} disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>
        <Minus aria-hidden="true" />
      </button>
      <output aria-live="polite" className={cn('min-w-6 text-center', size === 'md' ? 'text-h3 font-normal' : 'text-body-lg')}>
        {disabled ? 0 : value}
      </output>
      <button type="button" aria-label="Aumentar quantidade" className={buttonClass} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        <Plus aria-hidden="true" />
      </button>
    </div>
  )
}
