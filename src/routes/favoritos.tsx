import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/layout/page-placeholder'
import { requireAuth } from '@/features/auth/guard'

export const Route = createFileRoute('/favoritos')({
  beforeLoad: requireAuth,
  staticData: { requiresAuth: true },
  component: () => <PagePlaceholder title="Favoritos" phase="Fase 5" />,
})
