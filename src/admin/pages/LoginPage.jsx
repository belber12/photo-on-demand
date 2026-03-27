import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 минут
const STORAGE_KEY = 'admin_login_attempts'

function getLockoutState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { attempts: 0, lockedUntil: 0 }
    return JSON.parse(raw)
  } catch {
    return { attempts: 0, lockedUntil: 0 }
  }
}

function saveLockoutState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { session, isAdmin, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [attempts, setAttempts] = useState(0)

  // Если уже вошли — редирект
  useEffect(() => {
    if (!loading && session && isAdmin) navigate('/admin', { replace: true })
  }, [session, isAdmin, loading, navigate])

  // Загрузить состояние блокировки
  useEffect(() => {
    const state = getLockoutState()
    setAttempts(state.attempts)
    setLockedUntil(state.lockedUntil)
  }, [])

  // Таймер обратного отсчёта
  const [countdown, setCountdown] = useState(0)
  useEffect(() => {
    if (lockedUntil <= Date.now()) return
    const update = () => setCountdown(Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [lockedUntil])

  async function handleEmailLogin(e) {
    e.preventDefault()
    setError('')

    // Проверка блокировки
    const state = getLockoutState()
    if (state.lockedUntil > Date.now()) {
      setLockedUntil(state.lockedUntil)
      return
    }

    setSubmitting(true)
    // Задержка против брутфорса
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400))

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const newAttempts = state.attempts + 1
      const newLocked = newAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0
      const newState = { attempts: newLocked ? 0 : newAttempts, lockedUntil: newLocked }
      saveLockoutState(newState)
      setAttempts(newState.attempts)
      setLockedUntil(newState.lockedUntil)

      if (newLocked) {
        setError(`Слишком много попыток. Доступ заблокирован на 15 минут.`)
      } else {
        setError(`Неверный email или пароль. Попыток осталось: ${MAX_ATTEMPTS - newAttempts}`)
      }
    } else {
      // Успешный вход — сбросить счётчик
      saveLockoutState({ attempts: 0, lockedUntil: 0 })
      setAttempts(0)
      setLockedUntil(0)
    }

    setSubmitting(false)
  }

  async function handleGoogleLogin() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` },
    })
    if (error) setError('Ошибка входа через Google')
  }

  const isLocked = lockedUntil > Date.now()

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <main className="w-full max-w-sm">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="text-3xl mb-3">📷</div>
          <h1 className="text-white text-xl font-semibold">Вход в админ-панель</h1>
          <p className="text-gray-400 text-sm mt-1">Фото на заказ</p>
        </div>

        {/* Блокировка */}
        {isLocked ? (
          <div className="bg-red-950 border border-red-800 rounded-lg p-4 text-center">
            <p className="text-red-400 text-sm font-medium mb-1">Доступ временно заблокирован</p>
            <p className="text-red-500 text-xs">
              Повторите через {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </p>
          </div>
        ) : (
          <>
            {/* Форма */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* Honeypot — скрытое поле, боты заполняют его */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
                aria-hidden="true"
              />
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {attempts > 0 && !error && (
                <p className="text-yellow-500 text-xs">Попыток осталось: {MAX_ATTEMPTS - attempts}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white text-gray-900 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Проверка...' : 'Войти'}
              </button>
            </form>

            {/* Разделитель */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-400 text-xs">или</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 border border-gray-700 rounded-lg py-2.5 text-sm text-white hover:border-gray-500 hover:bg-gray-800 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Войти через Google
            </button>
          </>
        )}
      </main>
    </div>
  )
}
