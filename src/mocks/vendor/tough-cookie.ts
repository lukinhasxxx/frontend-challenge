/**
 * Substituto de `tough-cookie` para o MSW no navegador (alias em vite.config.ts).
 *
 * O MSW usa `tough-cookie` (+ `tldts`, ~260 KB) só para guardar cookies enviados pelos
 * handlers em `Set-Cookie`. Este app não usa cookies (sessão via `Authorization`), então
 * a cookie store fica vazia e o chunk dos mocks fica bem menor (melhora o LCP no mobile).
 * Se algum handler passar a enviar `Set-Cookie`, remova o alias.
 */
export type SerializedCookie = Record<string, unknown>
export type MemoryCookieStoreIndex = Record<string, Record<string, Record<string, Cookie>>>

export class Cookie {
  domain: string | null = null
  path: string | null = null
  key = ''
  static fromJSON(): Cookie | null {
    return null
  }
  toJSON(): SerializedCookie {
    return {}
  }
}

export class MemoryCookieStore {
  idx: MemoryCookieStoreIndex = {}
}

export class CookieJar {
  constructor(_store?: MemoryCookieStore) {}
  getCookiesSync(): Cookie[] {
    return []
  }
  async setCookie(): Promise<void> {}
}
