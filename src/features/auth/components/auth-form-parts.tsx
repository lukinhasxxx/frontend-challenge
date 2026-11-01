import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuthVariant } from '../form-utils'

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-center text-caption text-destructive-text">
      {children}
    </p>
  )
}

export function SubmitButton({ variant, pending, children }: { variant: AuthVariant; pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={cn(
        'flex w-full cursor-pointer items-center justify-center gap-2 bg-primary text-base leading-4 font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-70',
        variant === 'desktop' ? 'h-[2.8125rem] rounded-sm' : 'h-15 rounded-[0.625rem]',
      )}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
