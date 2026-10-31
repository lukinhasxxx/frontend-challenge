/** Placeholder temporário das telas que chegam em fases seguintes. */
export function PagePlaceholder({ title, phase }: { title: string; phase: string }) {
  return (
    <section className="container flex flex-col gap-3 py-16">
      <h1 className="text-h1">{title}</h1>
      <p className="text-body-sm text-muted-foreground">Esta tela será implementada na {phase}.</p>
    </section>
  )
}
