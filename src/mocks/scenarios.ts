/**
 * Cenários determinísticos do mock.
 *
 * Resolução (maior prioridade primeiro):
 * 1. header `x-mock-scenario` da requisição;
 * 2. localStorage `MOCK_SCENARIO`;
 * 3. `default`.
 */
export const SCENARIOS = {
  default: 'Respostas normais (~150 ms).',
  slow: 'Toda resposta demora ~2,5 s (skeletons).',
  'variable-latency': 'Latência aleatória (semente fixa) entre 200 ms e 1,8 s.',
  'out-of-order': 'Cada requisição responde mais rápido que a anterior: respostas chegam fora de ordem.',
  'error-500': 'Toda chamada /api retorna 500.',
  offline: 'Falha de conexão (erro de rede).',
  timeout: 'Processa a requisição, mas responde depois do timeout do cliente (10 s). Repetir um pedido com a mesma chave responde na hora.',
  'expired-session': 'Rotas autenticadas retornam 401 SESSION_EXPIRED.',
  empty: 'Listagens retornam vazias.',
  'price-changed': 'Preços mudam ao revalidar a cotação no checkout.',
  'sold-out': 'Edições esgotam ao revalidar a cotação no checkout.',
  'payment-declined': 'Pagamento é recusado após criação do pedido.',
  'payment-pending': 'Pagamento fica pendente até ser resolvido pelo painel Mock (teste de queda/reconexão).',
  'wallet-rejected': 'A carteira recusa a conexão no pagamento.',
} as const

export type Scenario = keyof typeof SCENARIOS

export const SCENARIO_STORAGE_KEY = 'MOCK_SCENARIO'
export const SCENARIO_HEADER = 'x-mock-scenario'

export function isScenario(value: string | null | undefined): value is Scenario {
  return !!value && Object.hasOwn(SCENARIOS, value)
}

export function getScenario(request?: Request): Scenario {
  const fromHeader = request?.headers.get(SCENARIO_HEADER)
  if (isScenario(fromHeader)) return fromHeader
  const fromStorage = localStorage.getItem(SCENARIO_STORAGE_KEY)
  return isScenario(fromStorage) ? fromStorage : 'default'
}

export function setScenario(scenario: Scenario) {
  localStorage.setItem(SCENARIO_STORAGE_KEY, scenario)
}
