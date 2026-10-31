import { useState } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/** Desktop: 4 miniaturas 100×100 + imagem principal 444×444 com lupa (zoom). */
export function NftGallery({ name, images }: { name: string; images: string[] }) {
  const [selected, setSelected] = useState(0)
  const current = images[selected] ?? images[0]

  return (
    <div className="flex gap-7">
      <ul aria-label="Imagens do NFT" className="flex w-[6.25rem] shrink-0 flex-col gap-4">
        {images.map((image, index) => (
          <li key={image}>
            <button
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-current={index === selected}
              onClick={() => setSelected(index)}
              className={cn(
                'block size-[6.25rem] cursor-pointer overflow-hidden rounded-md border-2 border-transparent bg-card p-1 transition-colors aria-current:border-primary',
              )}
            >
              <img src={image.replace('.webp', '-sm.webp')} alt="" width={92} height={92} className="size-full rounded-sm object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative aspect-square w-full max-w-[27.75rem] rounded-md bg-card p-4">
        <img src={current} alt={name} width={412} height={412} className="size-full rounded-2xl object-cover" />
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="absolute top-3 right-8 flex size-[1.875rem] cursor-pointer items-center justify-center rounded-full bg-background/60 text-foreground hover:text-accent-foreground"
            >
              <Search className="size-5" aria-hidden="true" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[min(90vw,48rem)] p-3 sm:max-w-[min(90vw,48rem)]">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <DialogDescription className="sr-only">Imagem ampliada</DialogDescription>
            <img src={current} alt={name} width={1200} height={1200} className="w-full rounded-xl" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
