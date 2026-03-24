import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useBlogArticles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('blog_articles')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    setArticles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  async function saveArticle(article) {
    const { id, ...fields } = article
    if (id) {
      const { error } = await supabase.from('blog_articles').update(fields).eq('id', id)
      if (!error) fetchArticles()
      return !error
    } else {
      const { error } = await supabase.from('blog_articles').insert(fields)
      if (!error) fetchArticles()
      return !error
    }
  }

  async function deleteArticle(id) {
    const { data: art } = await supabase
      .from('blog_articles').select('cover_path').eq('id', id).single()
    if (art?.cover_path) {
      await supabase.storage.from('portfolio').remove([art.cover_path])
    }
    const { error } = await supabase.from('blog_articles').delete().eq('id', id)
    if (!error) setArticles(prev => prev.filter(a => a.id !== id))
    return !error
  }

  async function togglePublished(id, published) {
    const { error } = await supabase
      .from('blog_articles').update({ published }).eq('id', id)
    if (!error) setArticles(prev => prev.map(a => a.id === id ? { ...a, published } : a))
    return !error
  }

  return { articles, loading, saveArticle, deleteArticle, togglePublished, refetch: fetchArticles }
}
