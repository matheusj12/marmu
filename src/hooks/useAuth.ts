import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { useAuthStore, type UserProfile } from '../store/authStore'
import { getSupabaseClient } from '../lib/supabase'

const MASTER_EMAIL = import.meta.env.VITE_MASTER_EMAIL

function resolveProfile(user: User | null): UserProfile | null {
  if (!user) return null
  if (user.email === MASTER_EMAIL) {
    return {
      id: user.id,
      tenant_id: null,
      name: user.user_metadata?.name ?? 'Administrador Master',
      role: 'master',
    }
  }
  return {
    id: user.id,
    tenant_id: user.user_metadata?.tenant_id ?? null,
    name: user.user_metadata?.name ?? user.email ?? '',
    role: 'admin',
  }
}

// Cria um usuário simulado para desenvolvimento local sem Supabase
function createDevUser(email: string): User {
  return {
    id: 'local-dev-master',
    email,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: { name: 'Administrador Master' },
  } as unknown as User
}

export function useAuth() {
  const { user, session, profile, loading, setUser, setSession, setProfile, setLoading, reset } =
    useAuthStore()

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setProfile(resolveProfile(session?.user ?? null))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setProfile(resolveProfile(session?.user ?? null))
    })

    return () => subscription.unsubscribe()
  }, [setLoading, setProfile, setSession, setUser])

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient()

    // Modo dev local: sem Supabase, aceita o e-mail master com qualquer senha
    if (!supabase) {
      if (email === MASTER_EMAIL && password.length >= 4) {
        const mockUser = createDevUser(email)
        setUser(mockUser)
        setProfile(resolveProfile(mockUser))
        return { data: { user: mockUser, session: null }, error: null }
      }
      return {
        data: { user: null, session: null },
        error: { message: 'Modo local: use o e-mail master para entrar sem Supabase.' },
      }
    }

    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email: string, password: string, name: string, company: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return {
        data: { user: null, session: null },
        error: { message: 'Cadastro requer Supabase configurado.' },
      }
    }
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { name, company } },
    })
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) { reset(); return }
    await supabase.auth.signOut()
    reset()
  }

  const resetPassword = async (email: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return {
        data: {},
        error: { message: 'Redefinição de senha requer Supabase configurado.' },
      }
    }
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  }

  return { user, session, profile, loading, signIn, signUp, signOut, resetPassword }
}
