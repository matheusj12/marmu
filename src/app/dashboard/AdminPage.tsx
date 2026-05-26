import DashboardLayout from '../../components/layout/DashboardLayout'

// Dados mock — serão substituídos por queries Supabase na Fase 4
const MOCK_TENANTS = [
  { id: '1', empresa: 'Marmoraria Silva',    plano: 'Pro',   status: 'ativo',       mrr: 'R$ 297',  usuarios: 3, cadastro: '15/01/2026' },
  { id: '2', empresa: 'Granitos Noroeste',   plano: 'Basic', status: 'ativo',       mrr: 'R$ 97',   usuarios: 1, cadastro: '20/02/2026' },
  { id: '3', empresa: 'Pedras Premium Ltda', plano: 'Pro',   status: 'inadimplente',mrr: 'R$ 297',  usuarios: 5, cadastro: '03/03/2026' },
  { id: '4', empresa: 'Mármores Elegance',   plano: 'Trial', status: 'trial',       mrr: '—',       usuarios: 1, cadastro: '22/05/2026' },
]

const STATS = [
  { label: 'Tenants Totais',    value: '4',        icon: 'business',     color: 'text-primary' },
  { label: 'Assinaturas Ativas',value: '2',        icon: 'verified',     color: 'text-tertiary' },
  { label: 'MRR Estimado',      value: 'R$ 691',   icon: 'trending_up',  color: 'text-tertiary' },
  { label: 'Usuários Totais',   value: '10',       icon: 'group',        color: 'text-primary' },
]

const STATUS_STYLES: Record<string, string> = {
  ativo:       'text-tertiary bg-tertiary-container/20 border border-tertiary/20',
  trial:       'text-primary bg-primary-container/20 border border-primary/20',
  inadimplente:'text-error bg-error-container/30 border border-error/20',
  suspenso:    'text-secondary bg-surface-container-highest border border-outline-variant',
}

export default function AdminPage() {
  return (
    <DashboardLayout>
      <div className="p-8 lg:p-12 max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                Painel de Controle
              </span>
              <span className="material-symbols-outlined text-outline text-[12px]">remove</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest bg-primary-container/30 text-primary border border-primary/20 uppercase">
                MASTER
              </span>
            </div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Admin Global</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Controle total da plataforma Marmu — visível apenas para você.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-on-primary font-bold py-2.5 px-5 rounded-lg hover:bg-primary-fixed hover:-translate-y-0.5 transition-all active:scale-95 text-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Tenant
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-container border border-outline-variant rounded-2xl p-5 flex flex-col gap-3"
            >
              <span className={`material-symbols-outlined text-[22px] ${stat.color}`}
                style={{ fontVariationSettings: "'FILL' 1" }}>
                {stat.icon}
              </span>
              <div>
                <p className="text-2xl font-black text-on-surface">{stat.value}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tenants Table */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
            <h2 className="font-black text-on-surface tracking-tight">Empresas Cadastradas</h2>
            <span className="text-xs text-secondary">{MOCK_TENANTS.length} tenants · dados mock (Fase 4)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  {['Empresa', 'Plano', 'Status', 'MRR', 'Usuários', 'Cadastro', 'Ações'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_TENANTS.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-surface-container-high transition-colors ${
                      i < MOCK_TENANTS.length - 1 ? 'border-b border-outline-variant/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-container/30 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-black text-primary">
                            {t.empresa[0]}
                          </span>
                        </div>
                        <span className="font-medium text-on-surface">{t.empresa}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{t.plano}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[t.status] ?? STATUS_STYLES.suspenso}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-on-surface-variant">{t.mrr}</td>
                    <td className="px-6 py-4 text-center text-on-surface-variant">{t.usuarios}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{t.cadastro}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          title="Ver detalhes"
                          className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-highest transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </button>
                        <button
                          title="Impersonar"
                          className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary-container/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Planos de Assinatura', icon: 'layers',        desc: 'Criar e editar planos',           soon: false },
            { label: 'Cobranças Asaas',      icon: 'receipt_long',  desc: 'Histórico de pagamentos',         soon: true  },
            { label: 'Configurações Globais',icon: 'admin_panel_settings', desc: 'Parâmetros da plataforma',soon: false },
          ].map((item) => (
            <button
              key={item.label}
              disabled={item.soon}
              className="bg-surface-container border border-outline-variant rounded-xl p-5 text-left hover:border-primary/30 hover:bg-surface-container-high transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <span
                className="material-symbols-outlined text-primary text-[24px] mb-3 block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {item.icon}
              </span>
              <p className="font-bold text-on-surface text-sm">{item.label}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {item.soon ? 'Em breve — Fase Asaas' : item.desc}
              </p>
            </button>
          ))}
        </div>

      </div>
    </DashboardLayout>
  )
}
