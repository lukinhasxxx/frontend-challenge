import { forwardRef, useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'> & {
  /** O Figma desktop não mostra o olho em "Confirmar senha". */
  showToggle?: boolean
}

/** Campo de senha com o ícone "Hide" do Figma alternando a visibilidade. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, showToggle = true, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? Eye : EyeOff

  return (
    <div className="relative">
      <Input ref={ref} type={visible ? 'text' : 'password'} className={cn(showToggle && 'pr-12', className)} {...props} />
      {showToggle && (
        <button
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xs text-subtle hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Icon className="size-[1.125rem]" aria-hidden="true" />
        </button>
      )}
    </div>
  )
})
