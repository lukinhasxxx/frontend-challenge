import { expect, test } from '@playwright/test'
import { cn } from '../../src/lib/utils'

test('mantém cor e tamanho da escala tipográfica customizada', () => {
  expect(cn('text-accent-foreground', 'text-h3')).toBe('text-accent-foreground text-h3')
  expect(cn('text-primary-foreground', 'text-body-lg')).toBe('text-primary-foreground text-body-lg')
})

test('ainda resolve conflitos reais', () => {
  expect(cn('text-body', 'text-h1')).toBe('text-h1')
  expect(cn('text-foreground', 'text-subtle')).toBe('text-subtle')
})
