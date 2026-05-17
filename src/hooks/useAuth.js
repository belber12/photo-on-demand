import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const checkedUid = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[useAuth] getSession:', session?.user?.email ?? null)
      setSession(session)
      if (session) checkAdmin(session.user.id)
      else setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useAuth] onAuthStateChange:', event, session?.user?.email ?? null)
      setSession(session)
      if (session) {
        if (checkedUid.current !== session.user.id) checkAdmin(session.user.id)
      } else {
        checkedUid.current = null
        setIsAdmin(false)
        setChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkAdmin(userId) {
    setChecking(true)
    const { data, error } = await supabase
      .from('admin_roles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    console.log('[useAuth] checkAdmin:', userId, 'data:', data, 'error:', error)
    checkedUid.current = userId
    setIsAdmin(!!data)
    setChecking(false)
  }

  return {
    session,
    user: session?.user ?? null,
    isAdmin,
    loading: session === undefined || checking,
  }
}
