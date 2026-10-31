/**
 * Aritmética de ETH sem ponto flutuante.
 *
 * A API transporta valores como string decimal ("0.4500"). Todo cálculo é feito
 * em wei (bigint, 18 casas) e convertido de volta para string só na saída.
 * Usado tanto pela interface quanto pelos handlers do MSW.
 */

const WEI_DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(WEI_DECIMALS)
const ETH_PATTERN = /^\d+(\.\d{1,18})?$/
const BPS_DENOMINATOR = 10_000n

/** Casas decimais usadas no transporte e na exibição. */
export const ETH_DECIMALS = 4

export function isEthAmount(value: string): boolean {
  return ETH_PATTERN.test(value)
}

export function toWei(eth: string): bigint {
  if (!isEthAmount(eth)) throw new RangeError(`Valor ETH inválido: "${eth}"`)
  const [integer = '0', fraction = ''] = eth.split('.')
  return BigInt(integer) * WEI_PER_ETH + BigInt(fraction.padEnd(WEI_DECIMALS, '0'))
}

/** Converte wei para string decimal, arredondando (meio para cima) em `decimals` casas. */
export function fromWei(wei: bigint, decimals = ETH_DECIMALS): string {
  const negative = wei < 0n
  const abs = negative ? -wei : wei
  const unit = 10n ** BigInt(WEI_DECIMALS - decimals)
  const rounded = (abs + unit / 2n) / unit
  const scale = 10n ** BigInt(decimals)
  const integer = rounded / scale
  const fraction = (rounded % scale).toString().padStart(decimals, '0')
  const text = decimals > 0 ? `${integer}.${fraction}` : `${integer}`
  return negative && rounded !== 0n ? `-${text}` : text
}

/** Normaliza para 4 casas: "1.5" → "1.5000". */
export function normalizeEth(eth: string): string {
  return fromWei(toWei(eth))
}

export function addEth(...values: string[]): string {
  return fromWei(values.reduce((sum, value) => sum + toWei(value), 0n))
}

export function subtractEth(a: string, b: string): string {
  return fromWei(toWei(a) - toWei(b))
}

export function multiplyEth(eth: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantidade inválida: ${quantity}`)
  }
  return fromWei(toWei(eth) * BigInt(quantity))
}

/** Percentual de um valor. `percent` aceita até 2 casas (ex.: 12.5). */
export function percentOfEth(eth: string, percent: number): string {
  const bps = BigInt(Math.round(percent * 100))
  return fromWei((toWei(eth) * bps) / BPS_DENOMINATOR)
}

export function compareEth(a: string, b: string): -1 | 0 | 1 {
  const diff = toWei(a) - toWei(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

/** Valor para exibição: até 4 casas, sem zeros à direita, mínimo 2 (ex.: "1.19", "0.016"). */
export function displayEth(eth: string): string {
  const [integer, fraction = ''] = normalizeEth(eth).split('.')
  return `${integer}.${fraction.replace(/0+$/, '').padEnd(2, '0')}`
}

export function formatEth(eth: string): string {
  return `${displayEth(eth)} ETH`
}
