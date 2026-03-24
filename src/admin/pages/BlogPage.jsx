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
        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs">
                <th className="text-left px-5 py-3 font-medium">Заголовок</th>
                <th className="text-left px-5 py-3 font-medium">Slug</th>
                <th className="text-left px-5 py-3 font-medium">Дата</th>
                <th className="text-left px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {articles.map(art => (
                <tr key={art.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-900/50 transition-colors">
                  <td className="px-5 py-3 text-white font-medium max-w-xs truncate">{art.title}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{art.slug}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(art.created_at).toLocaleDateString('ru')}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggle(art.id, art.published)}
                      disabled={toggling === art.id}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                        art.published
                          ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                          : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                      }`}
                    >
                      {toggling === art.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : art.published ? <Eye size={11} /> : <EyeOff size={11} />
                      }
                      {art.published ? 'Опубликована' : 'Черновик'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link to={`/admin/blog/${art.id}`} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(art.id)}
                        disabled={deleting === art.id}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                      >
                        {deleting === art.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
