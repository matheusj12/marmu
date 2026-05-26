import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()

  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await resetPassword(email)
      if (error) { setError(error.message); return }
      setSent(true)
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
            Recuperar senha
          </h1>
          <p className="text-sm text-on-surface-variant">
            Enviaremos um link de redefinição para seu e-mail
          </p>
        </div>

        {sent ? (
          /* Sucesso */
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 px-4 py-6 rounded-xl bg-tertiary-container border border-tertiary/20 text-center">
              <span className="material-symbols-outlined text-3xl text-tertiary">mark_email_read</span>
              <div>
                <p className="text-sm font-medium text-on-tertiary-container">E-mail enviado!</p>
                <p className="text-xs text-on-tertiary-container/80 mt-1 leading-relaxed">
                  Verifique a caixa de entrada de <strong>{email}</strong> e clique no link para redefinir sua senha.
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="block w-full py-2.5 rounded-lg border border-outline-variant text-on-surface text-sm font-medium text-center hover:bg-surface-container transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-on-surface" htmlFor="email">
                E-mail da conta
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
                  Enviando...
                </>
              ) : 'Enviar link de recuperação'}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-base leading-none">arrow_back</span>
              Voltar para o login
            </Link>
          </form>
        )}

      </div>
    </div>
  )
}
