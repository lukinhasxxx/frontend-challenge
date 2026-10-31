import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/**
 * Item de navegação fora do escopo da entrega (páginas editoriais, suporte etc.).
 * Mantém o visual de link, mas informa que não está disponível — nunca finge sucesso.
 */
export function UnavailableLink({ children, className }: { children: string; className?: string }) {
  return (
    <button
      type="button"
      className={cn('cursor-pointer text-left hover:text-accent-foreground', className)}
      onClick={() => toast.info(`"${children}" ainda não está disponível nesta versão.`)}
    >
      {children}
      <span className="sr-only"> (em breve)</span>
    </button>
  )
}
