import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

/**
 * Lupa do header desktop. O Figma desktop não desenha um campo de busca;
 * este diálogo segue o padrão visual e leva ao catálogo com `?q=`.
 */
export function HeaderSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setOpen(false)
    void navigate({ to: '/', search: { q: query.trim() || undefined }, hash: 'mercado' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" aria-label="Buscar NFTs" className="cursor-pointer hover:text-accent-foreground">
          <Search className="size-5" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-h2">Buscar NFTs</DialogTitle>
          <DialogDescription>Procure por nome do NFT ou da coleção.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Termo de busca">
            {(control) => (
              <Input {...control} type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Explorar coleções" />
            )}
          </Field>
          <Button type="submit" className="self-end font-bold">
            Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
