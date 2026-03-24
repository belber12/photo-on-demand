import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Inbox, BookOpen, Image, TrendingUp } from 'lucide-react'

function StatCard({ icon: Icon, label, value, to, color }) {
  return (
    <Link to={to} className="bg-gray-950 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors block">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <Icon size={18} className={color} />
      </div>
      <div className="text-3xl font-bold text-white">{value ?? '—'}</div>
    </Link>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState({})

  useEffect(() => {
    async function load() {
      const [leads, articles, storage] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('blog_articles').select('*', { count: 'exact', head: true }),
        supabase.storage.from('portfolio').list('', { limit: 1000 }),
      ])
      setStats({
        leads: leads.count,
        articles: articles.count,
        photos: storage.data?.length ?? 0,
      })
    }
    load()
  }, [])

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-6">Обзор</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Inbox}    label="Заявок"  value={stats.leads}    to="/admin/leads"     color="text-blue-400" />
        <StatCard icon={BookOpen} label="Статей"  value={stats.articles} to="/admin/blog"      color="text-purple-400" />
        <StatCard icon={Image}    label="Фото"    value={stats.photos}   to="/admin/portfolio" color="text-green-400" />
      </div>

      <div className="mt-8 bg-gray-950 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <TrendingUp size={15} /> Быстрые действия
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/blog/new" className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
            + Новая статья
          </Link>
          <Link to="/admin/portfolio" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors">
            Загрузить фото
          </Link>
          <Link to="/admin/content" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors">
            Редактировать текст
          </Link>
        </div>
      </div>
    </div>
  )
}
