import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { healthQueryOptions } from '@/features/health/api'
import { RealtimeSpikePanel } from '@/realtime/spike-panel'

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(healthQueryOptions),
  component: HomePage,
})

function HomePage() {
  const health = useQuery(healthQueryOptions)

  return (
    <section className="flex flex-col gap-6 py-10">
      <h1 className="text-3xl font-bold">Fase 0 — Fundação</h1>
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 font-semibold">API (MSW)</h2>
        <p className="text-sm text-muted-foreground">
          GET /api/health → <span className="text-foreground">{health.data?.status ?? '…'}</span>{' '}
          em {health.data?.time ?? '…'}
        </p>
      </div>
      <RealtimeSpikePanel />
    </section>
  )
}
