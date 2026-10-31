import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/layout/page-placeholder'

export const Route = createFileRoute('/favoritos')({
  component: () => <PagePlaceholder title="Favoritos" phase="Fase 5" />,
})
