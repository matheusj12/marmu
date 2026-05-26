import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'
import NewProjectModal from './NewProjectModal'

interface NavItem {
  label: string
  icon: string
  to: string
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Acesso Rápido', icon: 'bolt',                    to: '/dashboard' },
  { label: 'Orçamentos',    icon: 'description',             to: '/dashboard/orcamentos' },
  { label: 'Materiais',     icon: 'layers',                  to: '/dashboard/materiais' },
  { label: 'Produção',      icon: 'precision_manufacturing', to: '/dashboard/producao',    badge: 'EM BREVE' },
  { label: 'Estatísticas',  icon: 'bar_chart',               to: '/dashboard/estatisticas',badge: 'EM BREVE' },
  { label: 'NFe',           icon: 'receipt_long',            to: '/dashboard/nfe',         badge: 'BETA' },
]

const FOOTER_ITEMS: NavItem[] = [
  { label: 'Suporte',       icon: 'help',     to: '/dashboard/suporte' },
  { label: 'Configurações', icon: 'settings', to: '/dashboard/configuracoes' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { signOut } = useAuth()
  const isMaster = useAuthStore((s) => s.profile?.role === 'master')
  const [showNewProject, setShowNewProject] = useState(false)

  function isActive(to: string) {
    return pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
  }

  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col py-6 bg-background w-64 border-r border-outline-variant z-40">

      {/* Brand */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            widgets
          </span>
        </div>
        <div>
          <h2 className="text-xl font-black text-on-background tracking-tighter leading-none">Marmu</h2>
          <p className="text-[11px] text-secondary mt-0.5">Management System</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mb-5">
        <button
          onClick={() => setShowNewProject(true)}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-2.5 px-4 rounded-lg hover:bg-primary-container hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-[0_0_16px_rgba(167,139,250,0.25)]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo Projeto
        </button>
      </div>

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}

      {/* Nav principal */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-4 py-3 mx-1 rounded-lg text-sm transition-all ${
              isActive(item.to)
                ? 'bg-surface-container-highest text-primary font-bold'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {item.label}
            {item.badge && (
              <span className="ml-auto text-[10px] uppercase font-bold bg-surface-container-highest text-secondary-fixed px-1.5 py-0.5 rounded">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Link Admin — só para master */}
      {isMaster && (
        <div className="px-2 mb-2">
          <Link
            to="/dashboard/admin"
            className={`flex items-center gap-3 px-4 py-3 mx-1 rounded-lg text-sm transition-all ${
              isActive('/dashboard/admin')
                ? 'bg-primary-container/20 text-primary font-bold border border-primary/20'
                : 'text-primary/70 hover:text-primary hover:bg-primary-container/10 border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
            Admin Master
            <span className="ml-auto text-[9px] uppercase font-black bg-primary-container/30 text-primary px-1.5 py-0.5 rounded border border-primary/20">
              MASTER
            </span>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="px-2 mt-auto pt-4 border-t border-outline-variant mx-2 flex flex-col gap-0.5">
        {FOOTER_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 text-secondary hover:text-on-surface px-4 py-3 mx-1 rounded-lg text-sm transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <button
          onClick={signOut}
          className="flex items-center gap-3 text-secondary hover:text-error px-4 py-3 mx-1 rounded-lg text-sm transition-colors hover:bg-surface-container-high w-full text-left"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sair
        </button>
      </div>
    </aside>
  )
}
