import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/admin/login" replace />

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Доступ запрещён</p>
          <p className="text-gray-400 text-sm mb-6">Ваш аккаунт не имеет прав администратора</p>
          <button
            onClick={() => import('../../lib/supabase').then(m => m.supabase.auth.signOut())}
            className="text-sm text-gray-400 hover:text-white underline"
          >
            Выйти
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
