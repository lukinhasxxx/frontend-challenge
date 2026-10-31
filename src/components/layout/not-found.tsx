import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <section className="flex flex-col items-start gap-4 py-16">
      <p className="text-sm font-medium text-primary">Erro 404</p>
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço acessado não existe ou foi removido.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
