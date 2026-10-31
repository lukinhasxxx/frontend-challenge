import { DB_SCHEMA_VERSION, type DbState } from './schema'
import { createSeed } from './seed'

export const DB_STORAGE_KEY = 'mock-db:v1'

let state: DbState | null = null

function load(): DbState {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DbState
      if (parsed.schemaVersion === DB_SCHEMA_VERSION) return parsed
    }
  } catch {
    // JSON corrompido: cai no seed.
  }
  const seeded = createSeed()
  persist(seeded)
  return seeded
}

function persist(next: DbState) {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(next))
}

/**
 * Banco simulado: memória + espelho no localStorage (sobrevive a refresh).
 * Só a camada de mocks acessa este módulo.
 */
export const db = {
  read(): Readonly<DbState> {
    state ??= load()
    return state
  },

  /** Aplica a mutação e persiste. */
  write<T>(mutate: (draft: DbState) => T): T {
    state ??= load()
    const result = mutate(state)
    persist(state)
    return result
  },

  /** Restaura integralmente o cenário conhecido. */
  reset() {
    state = createSeed()
    persist(state)
  },
}
