import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checkAdmin(session.user.id)
      else setAdminChecked(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checkAdmin(session.user.id)
      else { setIsAdmin(false); setAdminChecked(true) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkAdmin(userId) {
    const { data } = await supabase
      .from('admin_roles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    setIsAdmin(!!data)
    setAdminChecked(true)
  }

  return {
    session,
    user: session?.user ?? null,
    isAdmin,
    loading: session === undefined || (session !== null && !adminChecked),
  }
}
