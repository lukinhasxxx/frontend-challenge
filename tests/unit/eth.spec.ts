import { expect, test } from '@playwright/test'
import {
  addEth,
  compareEth,
  formatEth,
  fromWei,
  multiplyEth,
  normalizeEth,
  percentOfEth,
  subtractEth,
  toWei,
} from '../../src/lib/eth'

test('soma sem erro de ponto flutuante', () => {
  expect(0.1 + 0.2).not.toBe(0.3) // o problema que evitamos
  expect(addEth('0.1', '0.2')).toBe('0.3000')
  expect(addEth('0.4500', '1.2345', '0.0005')).toBe('1.6850')
})

test('converte entre ETH e wei', () => {
  expect(toWei('1')).toBe(10n ** 18n)
  expect(toWei('0.4500')).toBe(450_000_000_000_000_000n)
  expect(fromWei(1_500_000_000_000_000_000n)).toBe('1.5000')
})

test('arredonda meio para cima na 4ª casa', () => {
  expect(normalizeEth('0.00005')).toBe('0.0001')
  expect(normalizeEth('0.00004999')).toBe('0.0000')
  expect(normalizeEth('2')).toBe('2.0000')
})

test('multiplica por quantidade inteira', () => {
  expect(multiplyEth('0.3333', 3)).toBe('0.9999')
  expect(multiplyEth('1.2500', 0)).toBe('0.0000')
  expect(() => multiplyEth('1', 1.5)).toThrow(RangeError)
  expect(() => multiplyEth('1', -1)).toThrow(RangeError)
})

test('calcula percentual e subtração', () => {
  expect(percentOfEth('0.4500', 10)).toBe('0.0450')
  expect(percentOfEth('1.0000', 12.5)).toBe('0.1250')
  expect(subtractEth('1.0000', '0.1250')).toBe('0.8750')
})

test('compara e formata', () => {
  expect(compareEth('0.1', '0.1000')).toBe(0)
  expect(compareEth('0.2', '0.1')).toBe(1)
  expect(compareEth('0.0999', '0.1')).toBe(-1)
  expect(formatEth('0.45')).toBe('0.4500 ETH')
})

test('rejeita formatos inválidos', () => {
  for (const invalid of ['', 'abc', '1,5', '-1', '.5', '1e18', '0.1234567890123456789']) {
    expect(() => toWei(invalid), invalid).toThrow(RangeError)
  }
})
