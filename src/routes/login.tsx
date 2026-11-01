import { createFileRoute, redirect } from '@tanstack/react-router'

/** Endereço direto: abre o login sobre a Home (Figma "Desktop / Login"). */
export const Route = createFileRoute('/login')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/', search: { auth: 'login', redirect: search.redirect }, replace: true })
  },
})
