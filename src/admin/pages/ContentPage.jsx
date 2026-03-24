import { useState } from 'react'
import { useSiteContent } from '../hooks/useSiteContent'
import { Check, Loader2 } from 'lucide-react'

const GROUPS = [
  {
    label: 'Герой (шапка)',
    keys: ['hero.title', 'hero.subtitle', 'hero.cta', 'hero.badge1', 'hero.badge2', 'hero.badge3'],
  },
  {
    label: 'Статистика',
    keys: ['stats.shoots', 'stats.satisfaction', 'stats.delivery', 'stats.rating'],
  },
  {
    label: 'FAQ',
    keys: [
      'faq.1.q','faq.1.a','faq.2.q','faq.2.a','faq.3.q','faq.3.a',
      'faq.4.q','faq.4.a','faq.5.q','faq.5.a','faq.6.q','faq.6.a',
    ],
  },
  {
    label: 'Общее',
    keys: ['telegram.url'],
  },
]

function ContentRow({ label, value, onSave }) {
  const [local, setLocal] = useState(value)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const isMultiline = local.length > 60

  async function handleSave() {
    setSaving(true)
    const ok = await onSave(local)
    setSaving(false)
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-800 last:border-0">
      <div className="w-48 shrink-0">
        <code className="text-xs text-gray-500">{label}</code>
      </div>
      <div className="flex-1 flex items-start gap-2">
        {isMultiline ? (
          <textarea
            value={local}
            onChange={e => { setLocal(e.target.value); setSaved(false) }}
            rows={3}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-y focus:outline-none focus:border-gray-500 transition-colors"
          />
        ) : (
          <input
            type="text"
            value={local}
            onChange={e => { setLocal(e.target.value); setSaved(false) }}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
          />
        )}
        <button
          onClick={handleSave}
          disabled={saving || local === value}
          className="shrink-0 px-3 py-2 rounded-lg text-sm bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} className="text-green-400" /> : null}
          {saving ? 'Сохранение' : saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}

export default function ContentPage() {
  const { content, loading, updateContent } = useSiteContent()

  if (loading) return <div className="text-gray-400 text-sm">Загрузка...</div>

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-6">Контент сайта</h1>
      <div className="space-y-6">
        {GROUPS.map(group => (
          <div key={group.label} className="bg-gray-950 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-300 mb-4">{group.label}</h2>
            {group.keys.map(key => (
              <ContentRow
                key={key}
                label={key}
                value={content[key] ?? ''}
                onSave={val => updateContent(key, val)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
