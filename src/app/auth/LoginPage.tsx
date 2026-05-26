import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getSupabaseClient } from '../../lib/supabase'

const isDevMode = !getSupabaseClient()

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) { setError(error.message); return }
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-primary-container items-center justify-center">
            <span className="text-on-primary-container text-xl font-bold">M</span>
          </div>
          <h1 className="text-2xl font-semibold text-on-surface tracking-tight">
            Entrar no Marmu
          </h1>
          <p className="text-sm text-on-surface-variant">
            Acesse sua conta para gerenciar orçamentos
          </p>
        </div>

        {/* Aviso modo dev local */}
        {isDevMode && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-surface-container border border-outline-variant">
            <span className="material-symbols-outlined text-sm text-tertiary mt-0.5 shrink-0">code</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <span className="text-tertiary font-medium">Modo local</span> — Supabase não configurado.
              Use o e-mail master para entrar.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container border border-outline-variant text-on-surface placeholder-on-surface-variant text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-on-surface" htmlFor="password">
                Senha
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Esqueci a senha
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 rounded-lg bg-surface-container border border-outline-variant text-on-surface placeholder-on-surface-variant text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-base leading-none select-none">
                  {showPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-error-container border border-error/20">
              <span className="material-symbols-outlined text-sm text-on-error-container mt-0.5 shrink-0">error</span>
              <p className="text-xs text-on-error-container leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-medium text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Entrando...
              </>
            ) : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-background text-xs text-on-surface-variant">
              Não tem conta?
            </span>
          </div>
        </div>

        {/* Link cadastro */}
        <Link
          to="/register"
          className="block w-full py-2.5 rounded-lg border border-outline-variant text-on-surface text-sm font-medium text-center hover:bg-surface-container transition-colors"
        >
          Criar conta grátis
        </Link>

      </div>
    </div>
  )
}
