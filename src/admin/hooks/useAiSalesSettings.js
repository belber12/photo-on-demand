import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const CHAT_KEYS = [
  'chat.enabled',
  'chat.agent_name',
  'chat.system_prompt',
  'chat.welcome_message',
  'chat.quick_replies',
  'chat.max_tokens',
]

const DEFAULTS = {
  'chat.enabled': 'true',
  'chat.agent_name': 'Анна',
  'chat.system_prompt': '',
  'chat.welcome_message': 'Привет! Я Анна, консультант фотостудии «Фото на заказ». Чем могу помочь?',
  'chat.quick_replies': JSON.stringify(['Сколько стоит портрет?', 'Хочу семейную фотосессию', 'Нужна бизнес-съёмка']),
  'chat.max_tokens': '600',
}

export function useAiSalesSettings() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('site_content')
      .select('key, value')
      .in('key', CHAT_KEYS)
    if (err) { setError(err.message); setLoading(false); return }
    const merged = { ...DEFAULTS }
    for (const row of data || []) merged[row.key] = row.value
    setSettings(merged)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (key, value) => {
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('site_content')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    setSaving(false)
    if (err) { setError(err.message); return false }
    setSettings((prev) => ({ ...prev, [key]: value }))
    return true
  }, [])

  return { settings, loading, saving, error, save, reload: load }
}
