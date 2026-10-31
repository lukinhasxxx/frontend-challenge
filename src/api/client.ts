import axios from 'axios'

/** Instância única do Axios. Interceptors (auth, sessão, erros) chegam na etapa 1.4. */
export const api = axios.create({ baseURL: '/api' })
