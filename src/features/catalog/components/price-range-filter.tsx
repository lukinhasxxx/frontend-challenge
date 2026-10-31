import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { compareEth } from '@/lib/eth'
import { formatPriceBR } from '../labels'

type PriceRangeFilterProps = {
  /** Limites do catálogo (vindos da API). */
  bounds: { min: string; max: string }
  value: { min?: string; max?: string }
  onApply: (range: { minPrice?: string; maxPrice?: string }) => void
}

const STEP = 0.01
/** A escala vai de 0 ao próximo múltiplo de 5: no Figma o máximo (12,30) fica a ~80% da barra. */
const SCALE_ROUNDING = 5

/** Figma: slider de dois marcadores, texto "Preço: 0,02 - 12,30 ETH" e botão "Aplicar". */
export function PriceRangeFilter({ bounds, value, onApply }: PriceRangeFilterProps) {
  const lower = Number(bounds.min)
  const upper = Number(bounds.max)
  const scaleMax = Math.ceil(upper / SCALE_ROUNDING) * SCALE_ROUNDING || SCALE_ROUNDING
  const [range, setRange] = useState<[number, number]>([
    value.min ? Number(value.min) : lower,
    value.max ? Number(value.max) : upper,
  ])

  function apply() {
    // O slider só seleciona; a comparação de valores usa strings ETH (sem float).
    const minPrice = range[0].toFixed(2)
    const maxPrice = range[1].toFixed(2)
    onApply({
      minPrice: compareEth(minPrice, bounds.min) > 0 ? minPrice : undefined,
      maxPrice: compareEth(maxPrice, bounds.max) < 0 ? maxPrice : undefined,
    })
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-h3">Faixa de preço</legend>
      <div className="flex flex-col gap-3 pl-3">
        <Slider
          min={0}
          max={scaleMax}
          step={STEP}
          minStepsBetweenThumbs={1}
          value={range}
          onValueChange={(next) => setRange([next[0] ?? lower, next[1] ?? upper])}
          thumbLabels={['Preço mínimo', 'Preço máximo']}
          className="py-2"
        />
        <p className="text-body text-muted-foreground" aria-live="polite">
          Preço: {formatPriceBR(String(range[0]))} - {formatPriceBR(String(range[1]))} ETH
        </p>
        <Button size="sm" className="w-fit font-bold" onClick={apply}>
          Aplicar
        </Button>
      </div>
    </fieldset>
  )
}
