import { notifyInDevelopment } from '@/lib/in-development'
import { BLOG_POSTS } from '../content'

/** Desktop: "Diário da Cunhagem". Conteúdo editorial está fora do escopo → "Ler mais" avisa. */
export function HomeBlog() {
  return (
    <section aria-labelledby="blog-title" className="container hidden md:block">
      <div className="flex flex-col items-center gap-10">
        <header className="flex flex-col items-center gap-3 text-center">
          <h2 id="blog-title" className="text-h1">
            Diário da Cunhagem
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </header>
        <ul className="grid w-full grid-cols-2 gap-6 lg:grid-cols-4">
          {BLOG_POSTS.map((post) => (
            <li key={post.title}>
              <article className="flex h-full flex-col overflow-hidden rounded-lg bg-card">
                <img src={post.image} alt="" width={268} height={195} loading="lazy" className="h-[12.1875rem] w-full object-cover" />
                <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                  <p className="text-caption font-medium text-muted-foreground">
                    {post.date} <span aria-hidden="true">&nbsp;|&nbsp;</span> {post.readTime}
                  </p>
                  <h3 className="text-body-lg leading-[1.3125rem] font-bold">{post.title}</h3>
                  <p className="text-caption font-medium text-muted-foreground">{post.excerpt}</p>
                  <button
                    type="button"
                    onClick={() => notifyInDevelopment('Diário da Cunhagem')}
                    className="mt-auto w-fit cursor-pointer text-caption font-bold text-accent-foreground hover:underline"
                  >
                    Ler mais <span aria-hidden="true">→</span>
                    <span className="sr-only">: {post.title} (em desenvolvimento)</span>
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
