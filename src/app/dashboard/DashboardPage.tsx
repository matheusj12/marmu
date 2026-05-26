import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuthStore } from '../../store/authStore'

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)

  const firstName = profile?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuário'

  return (
    <DashboardLayout>
      <div className="p-8 lg:p-12 max-w-5xl">

        {/* Welcome Banner */}
        <header className="bg-surface-container border border-outline-variant rounded-2xl p-8 mb-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Painel de Controle</span>
              <span className="material-symbols-outlined text-outline text-[12px]">remove</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-secondary uppercase">Marmu</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2 tracking-tight">
              Olá, {firstName}!{' '}
              <span className="inline-block hover:animate-bounce cursor-default">👋</span>
            </h1>
            <p className="text-on-surface-variant text-lg">O que você deseja realizar hoje?</p>
          </div>
        </header>

      </div>
    </DashboardLayout>
  )
}
