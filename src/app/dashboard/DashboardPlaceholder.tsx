import { useAuth } from '../../hooks/useAuth'

export default function DashboardPlaceholder() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mx-auto">
          <span className="text-on-primary-container text-xl font-bold">M</span>
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">Dashboard</h1>
        <p className="text-on-surface-variant text-sm">
          Olá, <span className="text-primary">{user?.email}</span>
        </p>
        <p className="text-on-surface-variant text-xs">
          Fase 5 em desenvolvimento — em breve aqui estará o painel completo.
        </p>
        <button
          onClick={signOut}
          className="mt-4 px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm hover:bg-surface-container-high transition-colors"
        >
          Sair
        </button>
      </div>
    </div>
  )
}
