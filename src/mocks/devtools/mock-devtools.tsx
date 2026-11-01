import { useCallback, useId, useState, type ReactNode } from 'react'
import { FlaskConical, X } from 'lucide-react'
import type { Cart, Edition, RealtimeEvent } from '@/api/contracts'
import { authToken, getGuestId } from '@/api/session-storage'
import { Button } from '@/components/ui/button'
import { FIXTURE_PASSWORD, FIXTURE_USERS } from '../fixtures/accounts'
import { getScenario, isScenario, SCENARIO_HEADER, setScenario, type Scenario } from '../scenarios'

type MockState = {
  scenario: Scenario
  scenarios: Record<Scenario, string>
  socket: { connectedClients: number; refusingUntil: string | null }
  lastEvent: RealtimeEvent | null
  nfts: { id: string; name: string; version: number; editions: Edition[] }[]
}

/** Chamadas do painel ignoram o cenário ativo (ex.: login funciona mesmo em `error-500`). */
async function mockFetch(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', [SCENARIO_HEADER]: 'default', ...init.headers },
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `HTTP ${response.status}`)
  }
  return response.status === 204 ? null : ((await response.json()) as unknown)
}

/** Mesma identidade que o app usa (visitante ou usuário logado). */
function sessionHeaders(token = authToken.get()): Record<string, string> {
  return { 'X-Guest-Id': getGuestId(), ...(token && { Authorization: `Bearer ${token}` }) }
}

const inputClass =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}

export function MockDevtools() {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<MockState | null>(null)
  const [cartEditionIds, setCartEditionIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [nftId, setNftId] = useState('')
  const [editionId, setEditionId] = useState('')
  const [price, setPrice] = useState('')
  const [available, setAvailable] = useState('')

  const refresh = useCallback(async () => {
    const [mockState, cart] = await Promise.all([
      mockFetch('/__mock/state') as Promise<MockState>,
      (mockFetch('/api/cart', { headers: sessionHeaders() }) as Promise<Cart>).catch(() => null),
    ])
    setState(mockState)
    setCartEditionIds(cart?.lines.map((line) => line.editionId) ?? [])
  }, [])

  function toggle() {
    if (!open) void refresh()
    setOpen(!open)
  }

  // Sem escolha manual: começa pelo NFT/edição que está no carrinho (teste de tempo real no carrinho).
  const inCart = (edition: Edition) => cartEditionIds.includes(edition.id)
  const selectedNft =
    state?.nfts.find((n) => n.id === nftId) ?? state?.nfts.find((n) => n.editions.some(inCart)) ?? state?.nfts[0]
  const selectedEdition =
    selectedNft?.editions.find((e) => e.id === editionId) ?? selectedNft?.editions.find(inCart) ?? selectedNft?.editions[0]

  async function run(label: string, action: () => Promise<unknown>) {
    try {
      await action()
      setFeedback(`✔ ${label}`)
      await refresh()
    } catch (error) {
      setFeedback(`✖ ${label}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async function quickLogin(email: string) {
    const session = (await mockFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: FIXTURE_PASSWORD }),
    })) as { token: string }
    authToken.set(session.token)
    // Igual ao login pela tela: itens do visitante entram no carrinho da conta.
    await mockFetch('/api/cart/merge', { method: 'POST', headers: sessionHeaders(session.token) })
    location.reload()
  }

  async function logout() {
    const token = authToken.get()
    await mockFetch('/api/auth/logout', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    authToken.clear()
    location.reload()
  }

  async function resetDb() {
    await mockFetch('/__mock/reset', { method: 'POST' })
    authToken.clear()
    location.reload()
  }

  return (
    // No mobile fica no topo para não cobrir a barra de abas inferior.
    <div className="fixed top-3 left-1/2 z-[9999] -translate-x-1/2 font-sans text-foreground md:top-auto md:bottom-3">
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Mock DevTools"
          className="absolute top-12 left-1/2 max-h-[70vh] md:top-auto md:bottom-12 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 space-y-3 overflow-y-auto rounded-xl border bg-card p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Mock DevTools</h2>
            <Button size="icon-sm" variant="ghost" aria-label="Fechar painel" onClick={() => setOpen(false)}>
              <X />
            </Button>
          </div>

          <Section title="Cenário">
            <select
              aria-label="Cenário do mock"
              className={inputClass}
              value={getScenario()}
              onChange={(event) => {
                if (isScenario(event.target.value)) setScenario(event.target.value)
                setFeedback(`✔ Cenário "${event.target.value}" ativo nas próximas requisições`)
                void refresh()
              }}
            >
              {state && Object.keys(state.scenarios).map((s) => <option key={s}>{s}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">{state?.scenarios[getScenario()]}</p>
            <Button size="sm" variant="outline" onClick={() => location.reload()}>
              Recarregar página
            </Button>
          </Section>

          <Section title="Sessão">
            <div className="flex flex-wrap gap-2">
              {FIXTURE_USERS.map((user) => (
                <Button key={user.id} size="sm" variant="secondary" onClick={() => void run(`Login ${user.name}`, () => quickLogin(user.email))}>
                  Entrar como {user.name.split(' ')[0]}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => void run('Logout', logout)}>
                Sair
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void run('Sessões expiradas (vale na próxima requisição)', () => mockFetch('/__mock/session/expire', { method: 'POST' }))}
            >
              Expirar sessão agora
            </Button>
          </Section>

          <Section title="Tempo real — nft.updated">
            <select
              aria-label="NFT"
              className={inputClass}
              value={selectedNft?.id ?? ''}
              onChange={(e) => (setNftId(e.target.value), setEditionId(''))}
            >
              {state?.nfts.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.id} · {n.name} (v{n.version}){n.editions.some(inCart) && ' · no carrinho'}
                </option>
              ))}
            </select>
            <select
              aria-label="Edição"
              className={inputClass}
              value={selectedEdition?.id ?? ''}
              onChange={(e) => setEditionId(e.target.value)}
            >
              {selectedNft?.editions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label} — {e.priceEth} ETH · {e.available}/{e.supply}
                  {inCart(e) && ' · no carrinho'}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <label className="space-y-1">
                <span>Novo preço (ETH)</span>
                <input placeholder={selectedEdition?.priceEth ?? 'preço'} className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <label className="space-y-1">
                <span>Nova disponibilidade</span>
                <input placeholder={String(selectedEdition?.available ?? 'estoque')} inputMode="numeric" className={inputClass} value={available} onChange={(e) => setAvailable(e.target.value)} />
              </label>
            </div>
            <Button
              size="sm"
              disabled={!selectedNft || !selectedEdition || (!price && !available)}
              onClick={() =>
                void run('NFT alterado e evento emitido', async () => {
                  await mockFetch(`/__mock/nfts/${selectedNft?.id}`, {
                    method: 'POST',
                    body: JSON.stringify({
                      editionId: selectedEdition?.id,
                      ...(price && { priceEth: price }),
                      ...(available && { available: Number(available) }),
                    }),
                  })
                  setPrice('')
                  setAvailable('')
                })
              }
            >
              Aplicar e emitir
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void run('Último evento reenviado (mesmo eventId)', () => mockFetch('/__mock/events/replay-last', { method: 'POST' }))}>
                Reenviar duplicata
              </Button>
              <Button size="sm" variant="outline" onClick={() => void run('Evento com versão antiga emitido', () => mockFetch('/__mock/events/stale', { method: 'POST' }))}>
                Emitir evento antigo
              </Button>
            </div>
          </Section>

          <Section title="Conexão do socket">
            <p className="text-xs text-muted-foreground">
              Clientes conectados: {state?.socket.connectedClients ?? '…'}
              {state?.socket.refusingUntil && ' · recusando conexões'}
            </p>
            <Button size="sm" variant="outline" onClick={() => void run('Socket derrubado por 5 s', () => mockFetch('/__mock/socket/drop', { method: 'POST', body: JSON.stringify({ downForMs: 5_000 }) }))}>
              Derrubar socket por 5 s
            </Button>
          </Section>

          <Section title="Banco">
            <Button size="sm" variant="destructive" onClick={() => void run('Banco resetado', resetDb)}>
              Resetar banco e sessão
            </Button>
          </Section>

          <p role="status" aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
            {feedback}
          </p>
        </div>
      )}

      <Button
        size="sm"
        variant="secondary"
        className="shadow-lg"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <FlaskConical />
        Mock
        <span className="text-muted-foreground">· {state?.scenario ?? getScenario()}</span>
      </Button>
    </div>
  )
}
