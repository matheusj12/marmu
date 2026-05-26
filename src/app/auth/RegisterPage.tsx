import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [name, setName]         = useState('')
  const [company, setCompany]   = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      const { error } = await signUp(email, password, name, company)
      if (error) { setError(error.message); return }
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  const strength = password.length === 0 ? 0
    : password.length < 8 ? 1
    : password.length < 12 ? 2
    : 3

  const strengthLabel = ['', 'Fraca', 'Boa', 'Forte']
  const strengthColor = ['', 'bg-error', 'bg-tertiary/60', 'bg-tertiary']

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-primary-container items-center justify-center">
            <span className="text-on-primary-container text-xl font-bold">M</span>
          </div>
          <h1 className="text-2xl font-semibold text-on-surface tracking-tight">
            Criar sua conta
          </h1>
          <p className="text-sm text-on-surface-variant">
            Configure sua marmoraria em minutos
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="name">
              Seu nome
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João Silva"
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container border border-outline-variant text-on-surface placeholder-on-surface-variant text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="company">
              Nome da empresa
            </label>
            <input
              id="company"
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Marmoraria Silva"
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container border border-outline-variant text-on-surface placeholder-on-surface-variant text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

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

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
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
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-outline-variant'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant">
                  Força: <span className={strength === 3 ? 'text-tertiary' : strength === 2 ? 'text-tertiary/60' : 'text-error'}>{strengthLabel[strength]}</span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="confirm">
              Confirmar senha
            </label>
            <input
              id="confirm"
              type={showPass ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              className={`w-full px-3 py-2.5 rounded-lg bg-surface-container border text-on-surface placeholder-on-surface-variant text-sm outline-none focus:ring-2 transition-colors ${
                confirm && confirm !== password
                  ? 'border-error focus:border-error focus:ring-error/20'
                  : 'border-outline-variant focus:border-primary focus:ring-primary/20'
              }`}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-error-container border border-error/20">
              <span className="material-symbols-outlined text-sm text-on-error-container mt-0.5 shrink-0">error</span>
              <p className="text-xs text-on-error-container leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-medium text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Criando conta...
              </>
            ) : 'Criar conta'}
          </button>

          <p className="text-xs text-on-surface-variant text-center leading-relaxed">
            Ao criar uma conta você concorda com os{' '}
            <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>
            {' '}e a{' '}
            <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
          </p>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-background text-xs text-on-surface-variant">
              Já tem conta?
            </span>
          </div>
        </div>

        <Link
          to="/login"
          className="block w-full py-2.5 rounded-lg border border-outline-variant text-on-surface text-sm font-medium text-center hover:bg-surface-container transition-colors"
        >
          Entrar
        </Link>

      </div>
    </div>
  )
}
