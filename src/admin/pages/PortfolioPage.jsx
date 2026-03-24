import { useState, useEffect, useRef } from 'react'
import { supabase, getPortfolioUrl } from '../../lib/supabase'
import { Trash2, Upload, Loader2 } from 'lucide-react'

const CATEGORIES = ['EA888_23mm_plus05', 'Портреты', 'Свадьбы', 'Предметы', 'Пост']

async function listAllFiles() {
  const allFiles = []
  for (const cat of CATEGORIES) {
    const { data } = await supabase.storage.from('portfolio').list(cat, { limit: 500 })
    if (data) {
      data.forEach(f => { if (f.name && !f.id?.endsWith('/')) allFiles.push({ ...f, folder: cat, path: `${cat}/${f.name}` }) })
    }
  }
  return allFiles
}

export default function PortfolioPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [deleting, setDeleting] = useState(null)
  const inputRef = useRef()

  async function load() {
    setLoading(true)
    const f = await listAllFiles()
    setFiles(f)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleUpload(e) {
    const selectedFiles = Array.from(e.target.files)
    if (!selectedFiles.length) return
    setUploading(true)
    for (const file of selectedFiles) {
      const path = `${category}/${Date.now()}_${file.name}`
      await supabase.storage.from('portfolio').upload(path, file, { upsert: false })
    }
    setUploading(false)
    load()
  }

  async function handleDelete(path) {
    setDeleting(path)
    await supabase.storage.from('portfolio').remove([path])
    setFiles(prev => prev.filter(f => f.path !== path))
    setDeleting(null)
  }

  const grouped = CATEGORIES.map(cat => ({
    cat,
    items: files.filter(f => f.folder === cat),
  })).filter(g => g.items.length > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Портфолио</h1>
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? 'Загрузка...' : 'Загрузить фото'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Загрузка...</div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ cat, items }) => (
            <div key={cat}>
              <h2 className="text-sm font-medium text-gray-400 mb-3">{cat} <span className="text-gray-600">({items.length})</span></h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {items.map(file => (
                  <div key={file.path} className="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={getPortfolioUrl(file.path)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <button
                      onClick={() => handleDelete(file.path)}
                      disabled={deleting === file.path}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-red-600/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50"
                    >
                      {deleting === file.path
                        ? <Loader2 size={13} className="animate-spin text-white" />
                        : <Trash2 size={13} className="text-white" />
                      }
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
