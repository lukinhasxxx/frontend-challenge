import type { Edition } from '@/api/contracts'
import { cn } from '@/lib/utils'

type EditionPickerProps = {
  editions: Edition[]
  value: string
  onChange: (editionId: string) => void
}

/** Figma: "Edição:" com pílulas "1/1 · 1/10 · 1/50 · ABERTA"; esgotadas ficam desabilitadas. */
export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-body font-bold">Edição:</legend>
      <div role="radiogroup" aria-label="Edição" className="flex flex-wrap gap-2">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const selected = edition.id === value
          return (
            <button
              key={edition.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={soldOut}
              onClick={() => onChange(edition.id)}
              className={cn(
                'cursor-pointer rounded-full border border-border-strong px-2 py-0.5 text-body-sm text-muted-foreground uppercase transition-colors hover:border-primary',
                selected && 'border-primary font-medium text-accent-foreground',
                soldOut && 'cursor-not-allowed line-through opacity-50 hover:border-border-strong',
              )}
            >
              {edition.label}
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
