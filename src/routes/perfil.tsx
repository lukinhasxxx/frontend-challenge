import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { sessionQueryOptions } from '@/features/auth/api'
import { requireAuth } from '@/features/auth/guard'
import { AccountSidebar } from '@/features/profile/components/account-sidebar'
import { ProfileForm } from '@/features/profile/components/profile-form'

export const Route = createFileRoute('/perfil')({
  beforeLoad: requireAuth,
  staticData: { requiresAuth: true },
  component: ProfilePage,
})

/** Sem frame mobile: a lateral "Meu perfil" (menu da conta) fica acima do formulário, em coluna única. */
function ProfilePage() {
  const { data: session } = useQuery(sessionQueryOptions)

  return (
    <div className="container flex flex-col gap-7 py-8 lg:flex-row lg:items-start">
      <AccountSidebar />
      {session && <ProfileForm key={session.user.id} user={session.user} />}
    </div>
  )
}
