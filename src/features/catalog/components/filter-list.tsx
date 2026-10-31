import { cn } from '@/lib/utils'

type FilterListProps<T extends string> = {
  title: string
  options: readonly T[]
  labels: Record<T, string>
  counts?: Record<T, number>
  value: T | undefined
  onChange: (value: T | undefined) => void
  className?: string
}

/**
 * Lista de filtro da sidebar (Figma: linhas de 40px, rótulo e contagem;
 * item ativo em laranja). Clicar no item ativo remove o filtro.
 */
export function FilterList<T extends string>({ title, options, labels, counts, value, onChange, className }: FilterListProps<T>) {
  return (
    <fieldset className={cn('flex flex-col gap-3', className)}>
      <legend className="mb-3 text-h3">{title}</legend>
      <ul className="flex flex-col pl-3">
        {options.map((option) => {
          const active = value === option
          return (
            <li key={option}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange(active ? undefined : option)}
                className={cn(
                  'flex h-10 w-full cursor-pointer items-center justify-between text-body text-muted-foreground transition-colors hover:text-accent-foreground',
                  active && 'font-medium text-accent-foreground',
                )}
              >
                <span>{labels[option]}</span>
                {counts && (
                  <span className="font-bold">
                    <span className="sr-only">, </span>({counts[option]})
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
