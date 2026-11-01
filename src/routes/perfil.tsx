import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { sessionQueryOptions } from '@/features/auth/api'
import { requireAuth } from '@/features/auth/guard'
import { AccountSidebar } from '@/features/profile/components/account-sidebar'

export const Route = createFileRoute('/perfil')({
  beforeLoad: requireAuth,
  staticData: { requiresAuth: true },
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session } = useQuery(sessionQueryOptions)

  return (
    <div className="container flex flex-col gap-7 py-8 lg:flex-row lg:items-start">
      <AccountSidebar />
      <section aria-labelledby="profile-title" className="flex flex-1 flex-col gap-6 lg:pt-2">
        <h1 id="profile-title" className="text-base leading-4 font-bold">
          Perfil do colecionador
        </h1>
        {/* Provisório: o formulário de edição (Figma) chega na Fase 8. */}
        {session && (
          <dl className="grid gap-x-6 gap-y-2 text-body-sm sm:grid-cols-[max-content_1fr]">
            <dt className="text-muted-foreground">Nome</dt>
            <dd>{session.user.name}</dd>
            <dt className="text-muted-foreground">E-mail</dt>
            <dd>{session.user.email}</dd>
          </dl>
        )}
        <p className="text-body-sm text-muted-foreground">A edição de dados, avatar e senha será implementada na Fase 8.</p>
      </section>
    </div>
  )
}
