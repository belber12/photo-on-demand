import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../hooks/useAuth'

export default function AdminLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Sidebar />
      <div className="ml-56 flex flex-col min-h-screen">
        {/* Топбар */}
        <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-end">
          <span className="text-sm text-gray-400">{user?.email}</span>
        </header>
        {/* Контент страницы */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
