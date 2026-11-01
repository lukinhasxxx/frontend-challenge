import { createFileRoute, redirect } from '@tanstack/react-router'

/** Endereço direto: abre o cadastro sobre a Home (Figma "Desktop / Cadastro"). */
export const Route = createFileRoute('/cadastro')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/', search: { auth: 'register', redirect: search.redirect }, replace: true })
  },
})
