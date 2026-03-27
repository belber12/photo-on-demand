import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Tag, Image, BookOpen, Inbox, ExternalLink, LogOut
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const NAV = [
  { to: '/admin',           icon: LayoutDashboard, label: 'Обзор',      end: true },
  { to: '/admin/content',   icon: FileText,         label: 'Контент' },
  { to: '/admin/pricing',   icon: Tag,              label: 'Цены' },
  { to: '/admin/portfolio', icon: Image,            label: 'Портфолио' },
  { to: '/admin/blog',      icon: BookOpen,         label: 'Блог' },
  { to: '/admin/leads',     icon: Inbox,            label: 'Заявки' },
]

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <aside className={`fixed top-0 left-0 h-full w-56 bg-gray-950 border-r border-gray-800 flex flex-col z-40 transition-transform duration-300
      ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      {/* Логотип */}
      <div className="px-5 py-5 border-b border-gray-800">
        <span className="text-white font-semibold text-sm tracking-wide">📷 Фото — Админ</span>
      </div>

      {/* Навигация */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Нижние кнопки */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ExternalLink size={16} />
          На сайт
        </a>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </aside>
  )
}
