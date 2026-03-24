import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useSiteContent() {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchContent = useCallback(async () => {
    const { data } = await supabase.from('site_content').select('key, value')
    if (data) {
      const map = {}
      data.forEach(row => { map[row.key] = row.value })
      setContent(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchContent() }, [fetchContent])

  async function updateContent(key, value) {
    const { error } = await supabase
      .from('site_content')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
    if (!error) setContent(prev => ({ ...prev, [key]: value }))
    return !error
  }

  return { content, loading, updateContent, refetch: fetchContent }
}
