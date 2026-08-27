import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEO from '../components/SEO'
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react'

/** Признаки черновика: служебные пометки и маркдаун-разметка в тексте. */
function isDraft(art) {
  const haystack = `${art.title || ''} ${art.excerpt || ''}`
  return (
    haystack.includes('Тема:') ||
    haystack.includes('Анонс') ||
    haystack.includes('━━━')
  )
}

export default function BlogListPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('blog_articles')
      .select('id, slug, title, excerpt, cover_url, created_at, sort_order')
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setArticles((data || []).filter((a) => !isDraft(a)))
        setLoading(false)
      })
  }, [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Блог ФотоНаЗаказ',
    description: 'Советы по фотосъёмке, ретуши и подготовке к съёмке',
    url: 'https://fotostudiozakaz.ru/blog',
    publisher: {
      '@type': 'Organization',
      name: 'ФотоНаЗаказ',
      url: 'https://fotostudiozakaz.ru',
    },
  }

  return (
    <>
      <SEO
        title="Блог — советы по фотосъёмке и ретуши"
        description="Полезные статьи о фотосъёмке, ретуши, подготовке к съёмке и выборе фотографа. Практические советы от профессионалов."
        canonical="/blog"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-paper text-ink">
        {/* Шапка */}
        <div className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-5 flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1.5 text-ink-soft hover:text-ink text-sm transition-colors">
              <ArrowLeft size={15} /> На главную
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
          <div className="mb-10">
            <div className="text-xs text-brand uppercase tracking-widest mb-3">Блог</div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Советы по съёмке и ретуши
            </h1>
            <p className="mt-3 text-ink-soft text-lg">
              Практические статьи о фотографии, подготовке и работе с результатом
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-40 bg-stone-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-ink-muted">
              <p className="text-lg">Статьи скоро появятся</p>
            </div>
          ) : (
            <div className="space-y-6">
              {articles.map((art) => (
                <Link
                  key={art.id}
                  to={`/blog/${art.slug}`}
                  className="group flex gap-6 bg-white hover:shadow-md border border-stone-200 hover:border-stone-300 rounded-2xl p-6 transition-all"
                >
                  {art.cover_url && (
                    <img
                      src={art.cover_url}
                      alt={art.title}
                      className="w-32 h-24 object-cover rounded-xl shrink-0 hidden sm:block"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-ink-muted mb-2">
                      <Calendar size={12} />
                      {new Date(art.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <h2 className="text-lg font-semibold group-hover:text-brand-dark transition-colors line-clamp-2">
                      {art.title}
                    </h2>
                    {art.excerpt && (
                      <p className="mt-1 text-ink-soft text-sm line-clamp-2">{art.excerpt}</p>
                    )}
                    <div className="mt-3 flex items-center gap-1 text-sm text-ink-muted group-hover:text-brand transition-colors">
                      Читать <ChevronRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
