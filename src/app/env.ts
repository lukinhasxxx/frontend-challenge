/**
 * Configuração com padrões seguros: sem `.env` algum, o app sobe com os mocks ativos
 * (MSW + Socket.IO simulado), como em dev, nos testes e no deploy de demonstração.
 * Só `VITE_ENABLE_MOCKS=false` desliga os mocks.
 */
export const env = {
  mocksEnabled: import.meta.env.VITE_ENABLE_MOCKS !== 'false',
  // Host sentinela interceptado pelo MSW: não resolve na rede, então uma falha do mock aparece em vez de bater no Vite.
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'ws://realtime.mock',
}
