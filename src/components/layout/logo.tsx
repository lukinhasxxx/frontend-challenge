import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="Kurio — página inicial" className={cn('text-body-sm font-bold tracking-brand', className)}>
      KURIO
    </Link>
  )
}
