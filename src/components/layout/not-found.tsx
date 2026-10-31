import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <section className="container flex flex-col items-start gap-4 py-16">
      <p className="text-body-sm font-medium text-accent-foreground">Erro 404</p>
      <h1 className="text-h1">Página não encontrada</h1>
      <p className="text-body-sm text-muted-foreground">O endereço acessado não existe ou foi removido.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
