import { notifyInDevelopment } from '@/lib/in-development'
import { cn } from '@/lib/utils'

/**
 * Item presente no Figma, mas fora do escopo (páginas editoriais, suporte etc.).
 * Mantém o visual de link e avisa que está em desenvolvimento — nunca finge sucesso.
 */
export function UnavailableLink({ children, className }: { children: string; className?: string }) {
  return (
    <button
      type="button"
      className={cn('cursor-pointer text-left hover:text-accent-foreground', className)}
      onClick={() => notifyInDevelopment(children)}
    >
      {children}
      <span className="sr-only"> (em desenvolvimento)</span>
    </button>
  )
}
