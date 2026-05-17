import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAiSalesSettings } from '../hooks/useAiSalesSettings'

const PAGE_SIZE = 20

export default function AiSalesPage() {
  const { settings, loading, saving, error, save } = useAiSalesSettings()
  const [promptDraft, setPromptDraft] = useState('')
  const [promptDirty, setPromptDirty] = useState(false)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(null)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!loading) {
      setPromptDraft(settings['chat.system_prompt'] || '')
      setPromptDirty(false)
    }
  }, [loading, settings])

  useEffect(() => {
    loadStats()
    loadSessions()
  }, [])

  async function loadStats() {
    setStatsLoading(true)
    const { data, error: err } = await supabase.rpc('get_chat_stats', { days: 30 })
    setStatsLoading(false)
    if (err) setStatsError(err.message)
    else setStats(data)
  }

  const loadSessions = useCallback(async (after = null) => {
    setSessionsLoading(true)
    setSessionsError(null)
    let q = supabase
      .from('chat_sessions')
      .select('id, created_at, converted, channel, lead_id, messages')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PAGE_SIZE)

    if (after) {
      q = q.lt('created_at', after.created_at)
    }

    const { data, error: err } = await q
    setSessionsLoading(false)
    if (err) { setSessionsError(err.message); return }
    if (after) setSessions((prev) => [...prev, ...(data || [])])
    else setSessions(data || [])
    setHasMore((data || []).length === PAGE_SIZE)
    if (data?.length) setCursor(data[data.length - 1])
  }, [])

  const handleToggle = async () => {
    const next = settings['chat.enabled'] === 'true' ? 'false' : 'true'
    await save('chat.enabled', next)
  }

  const handleSavePrompt = async () => {
    await save('chat.system_prompt', promptDraft)
    setPromptDirty(false)
  }

  if (loading) return <div className="p-8 text-gray-400">Загрузка...</div>

  const enabled = settings['chat.enabled'] === 'true'

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header + killswitch */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">AI-продавец</h1>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            enabled ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-white/10 text-gray-400 border border-white/20'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-400' : 'bg-gray-500'}`} />
          {enabled ? 'Включён' : 'Выключен'}
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {/* Settings + Stats */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Настройки</h2>
          <label className="block">
            <span className="text-xs text-gray-400 mb-1 block">Имя консультанта</span>
            <input type="text" value={settings['chat.agent_name']}
              onChange={(e) => save('chat.agent_name', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400 mb-1 block">Приветствие</span>
            <textarea rows={3} value={settings['chat.welcome_message']}
              onChange={(e) => save('chat.welcome_message', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400 mb-1 block">max_tokens</span>
            <input type="number" min={100} max={2000} value={settings['chat.max_tokens']}
              onChange={(e) => save('chat.max_tokens', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </label>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Статистика (30 дней)</h2>
          {statsLoading && <p className="text-gray-400 text-sm">Загрузка...</p>}
          {statsError && <p className="text-red-400 text-sm">Не удалось загрузить <button onClick={loadStats} className="underline">обновить</button></p>}
          {stats && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Диалогов', val: stats.dialogs },
                { label: 'Лидов', val: stats.leads },
                { label: 'Конверсия', val: `${stats.conversion_pct}%` },
              ].map(({ label, val }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-bold text-white">{val}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System prompt */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Системный промпт</h2>
          <button onClick={handleSavePrompt} disabled={!promptDirty || saving}
            className="px-4 py-1.5 text-sm rounded-lg bg-gradient-to-r from-[#ff4fd8] to-[#22d3ee] text-white disabled:opacity-40">
            Сохранить
          </button>
        </div>
        <textarea rows={12} value={promptDraft}
          onChange={(e) => { setPromptDraft(e.target.value); setPromptDirty(true) }}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono resize-none"
          placeholder="Системный промпт для AI-консультанта..." />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${promptDraft.length > 3800 ? 'text-red-400' : 'text-gray-500'}`}>
            {promptDraft.length} / 4000
          </span>
        </div>
      </div>

      {/* Chat sessions */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Последние переписки</h2>
        {sessionsLoading && sessions.length === 0 && <p className="text-gray-400 text-sm">Загрузка...</p>}
        {sessionsError && <p className="text-red-400 text-sm">Ошибка: {sessionsError}</p>}
        {!sessionsLoading && sessions.length === 0 && <p className="text-gray-500 text-sm">Переписок пока нет</p>}
        <div className="space-y-2">
          {sessions.map((s) => {
            const msgs = Array.isArray(s.messages) ? s.messages : []
            const userMsgs = msgs.filter((m) => m.role === 'user')
            const preview = userMsgs[0]?.content?.slice(0, 60) || '—'
            const date = new Date(s.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            return (
              <button key={s.id} onClick={() => setSelected(s)}
                className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white truncate max-w-[60%]">{preview}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.converted
                      ? <span className="text-xs text-green-400">✓ лид</span>
                      : <span className="text-xs text-gray-500">без лида</span>}
                    <span className="text-xs text-gray-500">{date}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        {hasMore && (
          <button onClick={() => loadSessions(cursor)}
            disabled={sessionsLoading}
            className="mt-4 w-full text-sm text-gray-400 hover:text-white py-2 border border-white/10 rounded-lg transition-colors disabled:opacity-40">
            {sessionsLoading ? 'Загрузка...' : 'Показать ещё'}
          </button>
        )}
      </div>

      {/* Modal: transcript */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setSelected(null)}>
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col m-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Переписка</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto p-5">
              {/* Plain text only — never dangerouslySetInnerHTML */}
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                {(selected.messages || []).map((m) =>
                  `[${m.role === 'user' ? 'Клиент' : m.role === 'assistant' ? 'Анна' : 'Система'}]: ${m.content}`
                ).join('\n\n')}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
