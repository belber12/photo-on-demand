import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useBlogArticles } from '../hooks/useBlogArticles'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'

function slugify(str) {
  return str.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-а-яёa-я]/gi, '')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export default function BlogEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { saveArticle } = useBlogArticles()
  const isNew = !id

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', body: '', published: false,
    cover_url: '', cover_path: '', sort_order: 0,
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const imgRef = useRef()

  useEffect(() => {
    if (!isNew) {
      supabase.from('blog_articles').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm(data)
      })
    }
  }, [id, isNew])

  function handleTitleChange(e) {
    const title = e.target.value
    setForm(f => ({ ...f, title, slug: isNew ? slugify(title) : f.slug }))
  }

  async function handleCoverUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const path = `blog/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('portfolio').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('portfolio').getPublicUrl(path)
      setForm(f => ({ ...f, cover_url: data.publicUrl, cover_path: path }))
    }
    setUploading(false)
  }

  async function handleSave(published) {
    setError('')
    setSaving(true)
    const ok = await saveArticle({ ...form, id: isNew ? undefined : Number(id), published })
    setSaving(false)
    if (ok) navigate('/admin/blog')
    else setError('Ошибка сохранения. Проверь, что slug уникален.')
  }

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/admin/blog')} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Назад к блогу
      </button>

      <h1 className="text-xl font-semibold text-white mb-6">{isNew ? 'Новая статья' : 'Редактирование'}</h1>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Заголовок *</label>
          <input value={form.title} onChange={handleTitleChange}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gray-500" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Slug (URL) *</label>
          <input value={form.slug} onChange={e => setForm(f => ({...f, slug: e.target.value}))}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-gray-500" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Анонс (краткое описание)</label>
          <textarea value={form.excerpt} onChange={e => setForm(f => ({...f, excerpt: e.target.value}))}
            rows={2}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-gray-500" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Текст статьи</label>
          <textarea value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))}
            rows={12}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm resize-y focus:outline-none focus:border-gray-500 font-mono" />
        </div>

        {/* Обложка */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Обложка</label>
          {form.cover_url && (
            <img src={form.cover_url} alt="cover" className="w-full h-40 object-cover rounded-lg mb-2" />
          )}
          <button onClick={() => imgRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Загрузка...' : form.cover_url ? 'Заменить обложку' : 'Загрузить обложку'}
          </button>
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Сохранить черновик
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Опубликовать
          </button>
        </div>
      </div>
    </div>
  )
}
