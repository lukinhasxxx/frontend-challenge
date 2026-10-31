import { createFileRoute, notFound } from '@tanstack/react-router'
import { UiShowcase } from '@/features/dev/ui-showcase'

/** Style guide vivo para comparar com o Figma. Só existe em desenvolvimento. */
export const Route = createFileRoute('/dev/ui')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: UiShowcase,
})
