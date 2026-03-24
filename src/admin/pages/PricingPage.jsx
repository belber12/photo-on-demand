import { useState, useEffect } from 'react'
import { useSiteContent } from '../hooks/useSiteContent'
import { Check, Loader2 } from 'lucide-react'

const PLANS = [
  { key: '1', badge: false },
  { key: '2', badge: true },
  { key: '3', badge: false },
]

function PlanEditor({ planKey, content, updateContent }) {
  const prefix = `pricing.plan${planKey}`
  const [fields, setFields] = useState({
    name: content[`${prefix}.name`] ?? '',
    desc: content[`${prefix}.desc`] ?? '',
    price: content[`${prefix}.price`] ?? '',
    badge: content[`${prefix}.badge`] ?? '',
    features: content[`${prefix}.features`] ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setFields({
      name: content[`${prefix}.name`] ?? '',
      desc: content[`${prefix}.desc`] ?? '',
      price: content[`${prefix}.price`] ?? '',
      badge: content[`${prefix}.badge`] ?? '',
      features: content[`${prefix}.features`] ?? '',
    })
  }, [content])

  async function handleSave() {
    setSaving(true)
    const results = await Promise.all([
      updateContent(`${prefix}.name`, fields.name),
      updateContent(`${prefix}.desc`, fields.desc),
      updateContent(`${prefix}.price`, fields.price),
      updateContent(`${prefix}.badge`, fields.badge),
      updateContent(`${prefix}.features`, fields.features),
    ])
    setSaving(false)
    if (results.every(Boolean)) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  const featList = fields.features.split('|').filter(Boolean)

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-medium text-gray-300 mb-4">Тариф {planKey}</h2>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Название</label>
            <input value={fields.name} onChange={e => setFields(f => ({...f, name: e.target.value}))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Цена (₽)</label>
            <input value={fields.price} onChange={e => setFields(f => ({...f, price: e.target.value}))}
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Описание</label>
          <textarea value={fields.desc} onChange={e => setFields(f => ({...f, desc: e.target.value}))}
            rows={2}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-gray-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Значок (например: Популярный)</label>
          <input value={fields.badge} onChange={e => setFields(f => ({...f, badge: e.target.value}))}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Включено (каждый пункт с новой строки)
          </label>
          <textarea
            value={fields.features.split('|').join('\n')}
            onChange={e => setFields(f => ({...f, features: e.target.value.split('\n').join('|')}))}
            rows={5}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-y focus:outline-none focus:border-gray-500 font-mono"
          />
          {/* Предпросмотр */}
          <ul className="mt-2 space-y-1">
            {featList.map((f, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="text-green-400">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 px-4 py-2 rounded-lg text-sm bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-2"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} className="text-green-600" /> : null}
        {saving ? 'Сохранение...' : saved ? 'Сохранено!' : 'Сохранить тариф'}
      </button>
    </div>
  )
}

export default function PricingPage() {
  const { content, loading, updateContent } = useSiteContent()

  if (loading) return <div className="text-gray-400 text-sm">Загрузка...</div>

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-2">Тарифы</h1>
      <p className="text-gray-500 text-sm mb-6">Функции тарифов вводятся с новой строки — каждая строка = один пункт.</p>
      <div className="space-y-5">
        {PLANS.map(p => (
          <PlanEditor key={p.key} planKey={p.key} content={content} updateContent={updateContent} />
        ))}
      </div>
    </div>
  )
}
