import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon, YoutubeIcon } from '@/components/icons/social'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UnavailableLink } from './unavailable-link'

const FEATURES = [
  { id: 'seguranca', letter: 'W', title: 'Segurança da carteira', text: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { id: 'criadores', letter: 'C', title: 'Criadores em destaque', text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { id: 'alertas', letter: 'D', title: 'Alertas de lançamentos', text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

const SOCIAL = [
  { label: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { label: 'Twitter', href: 'https://twitter.com', icon: TwitterIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: LinkedinIcon },
  { label: 'YouTube', href: 'https://youtube.com', icon: YoutubeIcon },
]

const HELP_LINKS = ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item']
const COLLECTION_LINKS = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade']

const columnTitle = 'mb-3 text-h3'
const columnLink = 'block py-1.5 text-body-sm leading-snug text-foreground hover:text-accent-foreground md:py-0 md:leading-[1.875rem]'

function Newsletter() {
  const [email, setEmail] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    // Fora do escopo: não simula inscrição bem-sucedida.
    toast.info('A newsletter ainda não está disponível nesta versão.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" aria-labelledby="newsletter-title">
      <h2 id="newsletter-title" className="text-[1.0625rem] leading-tight font-bold">
        Antecipe-se ao próximo lançamento
      </h2>
      <div className="flex">
        <label htmlFor="newsletter-email" className="sr-only">
          E-mail
        </label>
        <Input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="digite seu e-mail..."
          className="h-10 rounded-r-none border-0"
        />
        <Button type="submit" className="h-10 rounded-l-none font-bold">
          Enviar
        </Button>
      </div>
      <p className="text-body-sm text-muted-foreground">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </form>
  )
}

export function SiteFooter() {
  return (
    <footer className="container mt-24 pb-28 md:pb-6">
      <div className="flex flex-col">
        <div className="grid gap-8 bg-card p-6 md:grid-cols-2 md:p-8 lg:grid-cols-[1fr_1fr_1fr_1.35fr] lg:gap-0">
          {FEATURES.map((feature) => (
            <section key={feature.id} id={feature.id} className="flex scroll-mt-6 flex-col gap-3 lg:border-r lg:border-primary lg:px-4">
              <span aria-hidden="true" className="flex size-[4.625rem] items-center justify-center rounded-full bg-primary text-h2 text-primary-foreground">
                {feature.letter}
              </span>
              <h2 className="text-[1.0625rem] leading-tight font-bold">{feature.title}</h2>
              <p className="text-body-sm text-muted-foreground">{feature.text}</p>
            </section>
          ))}
          <div className="lg:px-4">
            <Newsletter />
          </div>
        </div>

        <div className="grid gap-3 bg-surface-dark p-6 text-body-sm md:grid-cols-4 md:items-center md:px-8">
          <span className="font-bold tracking-brand">KURIO</span>
          <p>Feito para colecionadores, criadores e cultura</p>
          <a href="mailto:contato@email.com" className="hover:text-accent-foreground">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="hover:text-accent-foreground">
            +55 11 4002 8922
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8 bg-card p-6 md:grid-cols-4 md:p-8">
          <nav aria-labelledby="footer-profile">
            <h2 id="footer-profile" className={columnTitle}>
              Meu perfil
            </h2>
            <Link to="/perfil" className={columnLink}>
              Meu perfil
            </Link>
            {['Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'].map((label) => (
              <UnavailableLink key={label} className={columnLink}>
                {label}
              </UnavailableLink>
            ))}
          </nav>
          <nav aria-labelledby="footer-help">
            <h2 id="footer-help" className={columnTitle}>
              Central de ajuda
            </h2>
            {HELP_LINKS.map((label) => (
              <UnavailableLink key={label} className={columnLink}>
                {label}
              </UnavailableLink>
            ))}
          </nav>
          <nav aria-labelledby="footer-collections">
            <h2 id="footer-collections" className={columnTitle}>
              Coleções
            </h2>
            {COLLECTION_LINKS.map((label) => (
              <Link key={label} to="/" hash="mercado" className={columnLink}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="col-span-2 flex flex-col gap-6 md:col-span-1">
            <div>
              <h2 className={columnTitle}>Redes sociais</h2>
              <ul className="flex flex-wrap gap-2">
                {SOCIAL.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} (abre em nova aba)`}
                      className="flex size-8 items-center justify-center rounded-xs border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Icon className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className={columnTitle}>Carteiras compatíveis</h2>
              <p className="w-fit rounded-xs border border-border bg-surface-dark px-3 py-1.5 text-tiny font-bold text-accent-foreground">
                METAMASK • WALLETCONNECT • COINBASE
              </p>
            </div>
          </div>
        </div>

        {/* Figma usa texto creme sobre o laranja (contraste 2.5); usamos ink (6.85). */}
        <p className="bg-primary py-1.5 text-center text-body-sm text-primary-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}
