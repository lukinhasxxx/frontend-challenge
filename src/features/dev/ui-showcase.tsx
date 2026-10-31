import { useState, type ReactNode } from 'react'
import { Heart, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EthPrice } from '@/components/ui/eth-price'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'

const COLORS = [
  ['background', 'ink', '#140D0A', 'bg-background'],
  ['card', 'surface-card', '#241612', 'bg-card'],
  ['popover / secondary', 'surface-raised', '#2F1D15', 'bg-secondary'],
  ['input', 'surface-dark', '#38220F', 'bg-input'],
  ['surface-neutral', '(hero)', '#1E1E1E', 'bg-surface-neutral'],
  ['border', 'border', '#3F2319', 'bg-border'],
  ['border-strong', 'border-soft', '#55321F', 'bg-border-strong'],
  ['primary', 'primary', '#D28A4C', 'bg-primary'],
  ['primary-hover', 'primary-light', '#DD9A5F', 'bg-primary-hover'],
  ['primary-active', 'primary-dark', '#C47B3E', 'bg-primary-active'],
  ['foreground', 'foreground', '#F5F1EB', 'bg-foreground'],
  ['muted-foreground', 'text-secondary', '#CFB28C', 'bg-muted-foreground'],
  ['subtle', 'secondary', '#B39463', 'bg-subtle'],
  ['accent-foreground', 'text-accent', '#E89B55', 'bg-accent-foreground'],
  ['required / destructive-text', 'text-coral', '#F0805F', 'bg-required'],
  ['destructive', 'error', '#ED1B2E', 'bg-destructive'],
  ['success', 'success', '#00A66C', 'bg-success'],
  ['rating', 'amber', '#E3A44E', 'bg-rating'],
] as const

const TYPE_SCALE = [
  ['text-display', 'SEJA DONO DO FUTURO'],
  ['text-h1', 'Emerald Ape #042'],
  ['text-h2', 'NFT EM DESTAQUE'],
  ['text-h3', 'Coleções'],
  ['text-body-lg', 'Mercado · Criadores · Aprenda'],
  ['text-body', 'Arte digital (33)'],
  ['text-body-sm', 'Descubra NFTs selecionados de criadores emergentes e consagrados.'],
  ['text-caption', '12 de setembro | Leitura de 6 min'],
  ['text-tiny', 'METAMASK • WALLETCONNECT • COINBASE'],
] as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t pt-8">
      <h2 className="text-h2">{title}</h2>
      {children}
    </section>
  )
}

export function UiShowcase() {
  const [page, setPage] = useState(2)
  const [email, setEmail] = useState('ana@')

  return (
    <div className="container flex flex-col gap-10 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">Design System — Kurio</h1>
        <p className="text-body-sm text-muted-foreground">
          Tokens extraídos do Figma. Compare em 390 / 768 / 1440 px (DevTools › Device Toolbar).
        </p>
      </header>

      <Section title="Cores">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {COLORS.map(([token, figma, hex, swatch]) => (
            <li key={token} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
              <span className={`h-12 rounded-sm border ${swatch}`} />
              <span className="text-caption font-bold">{token}</span>
              <span className="text-caption text-muted-foreground">
                {figma} · {hex}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Tipografia (Roboto Mono)">
        <div className="flex flex-col gap-4">
          {TYPE_SCALE.map(([token, sample]) => (
            <div key={token} className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
              <code className="w-32 shrink-0 text-caption text-subtle">{token}</code>
              <p className={token}>{sample}</p>
            </div>
          ))}
          <p className="text-body-lg font-bold tracking-brand">KURIO</p>
        </div>
      </Section>

      <Section title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <LogIn /> Entrar
          </Button>
          <Button className="font-bold uppercase">Explorar</Button>
          <Button variant="cta" size="xl">
            Comprar NFT
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Ler mais →</Button>
          <Button variant="destructive">Remover</Button>
          <Button disabled>Desabilitado</Button>
          <Button size="sm">Aplicar</Button>
          <Button size="icon" variant="secondary" aria-label="Favoritar">
            <Heart />
          </Button>
        </div>
      </Section>

      <Section title="Formulário">
        <div className="grid max-w-3xl gap-6 md:grid-cols-2">
          <Field label="Nome de exibição" required description="Visível no seu perfil.">
            {(control) => <Input {...control} placeholder="Seu nome" />}
          </Field>
          <Field label="E-mail" required error={email.includes('.') ? undefined : 'Informe um e-mail válido.'}>
            {(control) => <Input {...control} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Rede">
            {(control) => (
              <Select>
                <SelectTrigger {...control} className="w-full">
                  <SelectValue placeholder="Selecione uma rede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                </SelectContent>
              </Select>
            )}
          </Field>
          <Field label="Código promocional">
            {(control) => <Input {...control} placeholder="Digite o código promocional..." disabled />}
          </Field>
        </div>
      </Section>

      <Section title="Badges, preço e abas">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>6</Badge>
          <Badge variant="tag">Raro</Badge>
          <Badge variant="outline">1/50</Badge>
          <Badge variant="muted">Pendente</Badge>
          <Badge variant="success">Confirmado</Badge>
          <Badge variant="destructive">Recusado</Badge>
          <EthPrice value="1.9900" previous="2.2900" className="text-h3" />
        </div>
        <Tabs defaultValue="all">
          <TabsList aria-label="Filtro do catálogo">
            <TabsTrigger value="all">Todos os NFTs</TabsTrigger>
            <TabsTrigger value="new">Novos lançamentos</TabsTrigger>
            <TabsTrigger value="hot">Em alta</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="text-body-sm text-muted-foreground">
            Conteúdo da aba ativa.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Cards e skeletons">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8 xl:grid-cols-4">
          <NftCard name="Emerald Ape #042" image="/assets/nfts/nft-01.webp" priceEth="1.1900" />
          <NftCard name="Neon Vessel #552" image="/assets/nfts/nft-02.webp" priceEth="1.9900" previousPriceEth="2.2900" tag="Raro" />
          <NftCard
            name="Sage Nomad #009"
            image="/assets/nfts/nft-03.webp"
            priceEth="1.6900"
            action={
              <Button size="icon-sm" variant="secondary" className="rounded-full" aria-label="Favoritar Sage Nomad #009">
                <Heart />
              </Button>
            }
          />
          <NftCardSkeleton />
        </div>
        <div className="flex max-w-md flex-col gap-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Section>

      <Section title="Paginação">
        <Pagination
          page={page}
          totalPages={8}
          renderLink={(target, content, attrs) => (
            <button key={`${attrs['aria-label']}`} type="button" {...attrs} onClick={() => setPage(target)}>
              {content}
            </button>
          )}
        />
      </Section>

      <Section title="Diálogo, drawer e toast">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir diálogo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sessão expirada</DialogTitle>
                <DialogDescription>Entre novamente para continuar de onde parou.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>Entrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Abrir drawer</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[2.5rem]">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>Foco preso aqui dentro; Esc fecha e devolve o foco.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Button variant="secondary" onClick={() => toast.success('Adicionado ao carrinho')}>
            Toast de sucesso
          </Button>
          <Button variant="secondary" onClick={() => toast.error('Não foi possível favoritar. Tente novamente.')}>
            Toast de erro
          </Button>
        </div>
      </Section>
    </div>
  )
}
