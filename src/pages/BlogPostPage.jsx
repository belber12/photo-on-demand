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
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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

      <div className="min-h-screen bg-[#08080f] text-white">
        {/* Шапка */}
        <div className="border-b border-white/10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-5 flex items-center gap-4">
            <Link to="/blog" className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
              <ArrowLeft size={15} /> Все статьи
            </Link>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
          {/* Breadcrumb */}
          <nav className="text-xs text-white/35 mb-8 flex items-center gap-2">
            <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-white transition-colors">Блог</Link>
            <span>/</span>
            <span className="text-white/55 line-clamp-1">{article.title}</span>
          </nav>

          {/* Мета */}
          <div className="flex items-center gap-2 text-xs text-white/40 mb-5">
            <Calendar size={12} />
            {new Date(article.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-5">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-xl text-white/60 leading-relaxed mb-8 border-l-2 border-white/20 pl-4">
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
          <div className="prose prose-invert prose-lg max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-p:text-white/75 prose-p:leading-relaxed
            prose-a:text-white prose-a:underline
            prose-strong:text-white
            prose-ul:text-white/75 prose-ol:text-white/75
            prose-blockquote:border-white/20 prose-blockquote:text-white/60
            prose-code:bg-white/10 prose-code:px-1.5 prose-code:rounded prose-code:text-sm
          ">
            {article.body.split('\n').map((line, i) => (
              line.trim() === ''
                ? <br key={i} />
                : <p key={i}>{line}</p>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
            <p className="text-lg font-semibold mb-2">Готовы к съёмке?</p>
            <p className="text-white/55 text-sm mb-5">Оставьте заявку — ответим и подберём слот</p>
            <Link to="/#cta" className="inline-block px-6 py-3 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">
              Записаться на съёмку
            </Link>
          </div>
        </article>

        {/* Похожие статьи */}
        {related.length > 0 && (
          <div className="border-t border-white/10">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
              <h2 className="text-lg font-semibold mb-6">Читайте также</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map(rel => (
                  <Link key={rel.id} to={`/blog/${rel.slug}`}
                    className="group p-4 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-xl transition-all">
                    <p className="text-xs text-white/35 mb-2">
                      {new Date(rel.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-sm font-medium group-hover:text-white/90 line-clamp-3">{rel.title}</p>
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
