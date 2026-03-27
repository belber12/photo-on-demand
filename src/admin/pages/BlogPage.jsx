import { Link } from 'react-router-dom'
import { useBlogArticles } from '../hooks/useBlogArticles'
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function BlogPage() {
  const { articles, loading, deleteArticle, togglePublished } = useBlogArticles()
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)

  async function handleDelete(id) {
    if (!confirm('Удалить статью?')) return
    setDeleting(id)
    await deleteArticle(id)
    setDeleting(null)
  }

  async function handleToggle(id, published) {
    setToggling(id)
    await togglePublished(id, !published)
    setToggling(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Блог</h1>
        <Link
          to="/admin/blog/new"
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          <Plus size={15} /> Новая статья
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Загрузка...</div>
      ) : articles.length === 0 ? (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-sm mb-4">Статей пока нет</p>
          <Link to="/admin/blog/new" className="text-white text-sm underline">Создать первую статью</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(art => (
            <div key={art.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
              {/* Заголовок и дата */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium leading-snug">{art.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{new Date(art.created_at).toLocaleDateString('ru')}</p>
                </div>
                {/* Статус */}
                <button
                  onClick={() => handleToggle(art.id, art.published)}
                  disabled={toggling === art.id}
                  className={`shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                    art.published
                      ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                      : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                  }`}
                >
                  {toggling === art.id
                    ? <Loader2 size={11} className="animate-spin" />
                    : art.published ? <Eye size={11} /> : <EyeOff size={11} />
                  }
                  {art.published ? 'Опубл.' : 'Черновик'}
                </button>
              </div>

              {/* Кнопки действий */}
              <div className="flex items-center gap-2 border-t border-gray-800 pt-3">
                <Link
                  to={`/admin/blog/${art.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white transition-colors"
                >
                  <Pencil size={14} /> Редактировать
                </Link>
                <button
                  onClick={() => handleDelete(art.id)}
                  disabled={deleting === art.id}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400 transition-colors disabled:opacity-50"
                >
                  {deleting === art.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
