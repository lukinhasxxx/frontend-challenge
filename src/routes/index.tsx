import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { sessionQueryOptions } from '@/features/auth/api'
import { healthQueryOptions } from '@/features/health/api'
import { RealtimeSpikePanel } from '@/realtime/spike-panel'

/** Página de diagnóstico temporária — vira a Home real na Fase 3. */
export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const health = useQuery(healthQueryOptions)
  const session = useQuery(sessionQueryOptions)

  return (
    <section className="container flex flex-col gap-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1">Diagnóstico (temporário)</h1>
        <p className="text-body-sm text-muted-foreground">
          Página provisória para checar API, sessão e socket. A Home real do Figma substitui esta tela na Fase 3;
          o header e o footer acima/abaixo já são os definitivos.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 font-semibold">API (MSW)</h2>
        <p className="text-sm text-muted-foreground">
          GET /api/health →{' '}
          <span className="text-foreground">
            {health.isError ? `erro: ${health.error.message}` : (health.data?.status ?? '…')}
          </span>{' '}
          {health.data && `em ${health.data.time}`}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 font-semibold">Sessão</h2>
        <p className="text-sm text-muted-foreground" data-testid="session-status">
          {session.isPending
            ? '…'
            : session.isError
              ? `erro: ${session.error.message}`
              : session.data
                ? `Logado como ${session.data.user.name} (${session.data.user.email})`
                : 'Visitante'}
        </p>
      </div>

      <RealtimeSpikePanel />
    </section>
  )
}
