import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEO from '../components/SEO'
import { ArrowLeft, Calendar } from 'lucide-react'

export default function BlogPostPage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(undefined) // undefined=loading, null=not found
  const [related, setRelated] = useState([])

  useEffect(() => {
    supabase
      .from('blog_articles')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()
      .then(({ data }) => {
        setArticle(data ?? null)
        if (data) {
          // Загружаем похожие статьи
          supabase
            .from('blog_articles')
            .select('id, slug, title, excerpt, created_at')
            .eq('published', true)
            .neq('id', data.id)
            .limit(3)
            .then(({ data: rel }) => setRelated(rel || []))
        }
      })
  }, [slug])

  if (article === undefined) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  if (article === null) return <Navigate to="/blog" replace />

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.cover_url || 'https://fotostudiozakaz.ru/og-image.jpg',
    datePublished: article.created_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Organization',
      name: 'ФотоНаЗаказ',
      url: 'https://fotostudiozakaz.ru',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ФотоНаЗаказ',
      logo: { '@type': 'ImageObject', url: 'https://fotostudiozakaz.ru/og-image.jpg' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://fotostudiozakaz.ru/blog/${slug}` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://fotostudiozakaz.ru' },
        { '@type': 'ListItem', position: 2, name: 'Блог', item: 'https://fotostudiozakaz.ru/blog' },
        { '@type': 'ListItem', position: 3, name: article.title, item: `https://fotostudiozakaz.ru/blog/${slug}` },
      ],
    },
  }

  return (
    <>
      <SEO
        title={article.title}
        description={article.excerpt || article.title}
        canonical={`/blog/${slug}`}
        image={article.cover_url || undefined}
        type="article"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-paper text-ink">
        {/* Шапка */}
        <div className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-5 flex items-center gap-4">
            <Link to="/blog" className="flex items-center gap-1.5 text-ink-soft hover:text-ink text-sm transition-colors">
              <ArrowLeft size={15} /> Все статьи
            </Link>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
          {/* Breadcrumb */}
          <nav className="text-xs text-ink-muted mb-8 flex items-center gap-2">
            <Link to="/" className="hover:text-ink transition-colors">Главная</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-ink transition-colors">Блог</Link>
            <span>/</span>
            <span className="text-ink-soft line-clamp-1">{article.title}</span>
          </nav>

          {/* Мета */}
          <div className="flex items-center gap-2 text-xs text-ink-muted mb-5">
            <Calendar size={12} />
            {new Date(article.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-5">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-xl text-ink-soft leading-relaxed mb-8 border-l-2 border-brand pl-4">
              {article.excerpt}
            </p>
          )}

          {article.cover_url && (
            <img
              src={article.cover_url}
              alt={article.title}
              className="w-full rounded-2xl mb-10 aspect-video object-cover"
            />
          )}

          {/* Тело статьи */}
          <div className="space-y-4 text-ink-soft leading-relaxed">
            {article.body.split('\n').map((line, i) =>
              line.trim() === ''
                ? <br key={i} />
                : <p key={i}>{line}</p>
            )}
          </div>

          {/* CTA */}
          <div className="mt-14 p-8 bg-paper-warm border border-stone-200 rounded-2xl text-center">
            <p className="text-lg font-semibold mb-2">Готовы к съёмке?</p>
            <p className="text-ink-soft text-sm mb-5">Оставьте заявку — ответим и подберём слот</p>
            <Link to="/#contacts" className="inline-block px-6 py-3 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
              Записаться на съёмку
            </Link>
          </div>
        </article>

        {/* Похожие статьи */}
        {related.length > 0 && (
          <div className="border-t border-stone-200">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
              <h2 className="text-lg font-semibold mb-6">Читайте также</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map(rel => (
                  <Link key={rel.id} to={`/blog/${rel.slug}`}
                    className="group p-4 bg-white hover:shadow-md border border-stone-200 hover:border-stone-300 rounded-xl transition-all">
                    <p className="text-xs text-ink-muted mb-2">
                      {new Date(rel.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-sm font-medium group-hover:text-brand-dark line-clamp-3">{rel.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
