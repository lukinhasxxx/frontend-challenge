import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    // Deve vir antes do plugin do React.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // MSW sem a cookie store real: o app não usa cookies (ver o arquivo do stub).
      'tough-cookie': fileURLToPath(new URL('./src/mocks/vendor/tough-cookie.ts', import.meta.url)),
    },
  },
})
