import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { getQuotes, updateQuoteStatus, deleteQuote, type QuoteRow, type QuoteStatus } from '../../services/quotesService'

const STATUS_TABS: { key: 'todos' | QuoteStatus; label: string }[] = [
  { key: 'todos',    label: 'Todos'     },
  { key: 'draft',    label: 'Rascunho'  },
  { key: 'sent',     label: 'Enviado'   },
  { key: 'approved', label: 'Aprovado'  },
  { key: 'rejected', label: 'Rejeitado' },
]

const STATUS_STYLE: Record<QuoteStatus, string> = {
  draft:    'text-secondary bg-surface-container-highest border border-outline-variant',
  sent:     'text-primary bg-primary-container/20 border border-primary/20',
  approved: 'text-tertiary bg-tertiary-container/20 border border-tertiary/20',
  rejected: 'text-error bg-error-container/30 border border-error/20',
  expired:  'text-secondary bg-surface-container-highest border border-outline-variant',
}

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft:    'Rascunho',
  sent:     'Enviado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  expired:  'Expirado',
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function QuotesPage() {
  const navigate = useNavigate()
  const [quotes,   setQuotes]   = useState<QuoteRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'todos' | QuoteStatus>('todos')
  const [search,   setSearch]   = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setQuotes(await getQuotes()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = quotes.filter((q) => {
    if (filter !== 'todos' && q.status !== filter) return false
    if (search && !q.client_name.toLowerCase().includes(search.toLowerCase())
      && !q.project_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleStatusChange(id: string, status: QuoteStatus) {
    await updateQuoteStatus(id, status)
    setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status } : q))
  }

  async function handleDelete(id: string) {
    await deleteQuote(id)
    setQuotes((prev) => prev.filter((q) => q.id !== id))
    setDeleteId(null)
  }

  const totals = {
    todos:    quotes.length,
    draft:    quotes.filter((q) => q.status === 'draft').length,
    sent:     quotes.filter((q) => q.status === 'sent').length,
    approved: quotes.filter((q) => q.status === 'approved').length,
    rejected: quotes.filter((q) => q.status === 'rejected').length,
  }

  return (
    <DashboardLayout>
      <div className="p-8 lg:p-12 max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Orçamentos</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {quotes.length} gerados · {quotes.filter((q) => q.status === 'approved').length} aprovados
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/new')}
            className="flex items-center gap-2 bg-primary text-on-primary font-bold py-2.5 px-5 rounded-lg hover:bg-primary-fixed hover:-translate-y-0.5 transition-all active:scale-95 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Orçamento
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 p-1 bg-surface-container rounded-xl border border-outline-variant overflow-x-auto">
            {STATUS_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  filter === key
                    ? 'bg-surface-container-highest text-primary'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {label}
                <span className="text-[10px] font-black bg-surface-container-highest text-secondary px-1.5 py-0.5 rounded-full">
                  {totals[key] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente ou projeto..."
              className="w-full pl-9 pr-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-surface-container border border-outline-variant rounded-2xl">
            <span className="material-symbols-outlined text-[48px] mb-3 block opacity-30 text-on-surface-variant">receipt_long</span>
            <p className="font-medium text-on-surface-variant">Nenhum orçamento encontrado</p>
            <button
              onClick={() => navigate('/dashboard/new')}
              className="mt-4 px-5 py-2 rounded-lg bg-primary text-on-primary font-bold text-sm hover:bg-primary-fixed transition-colors"
            >
              Gerar primeiro orçamento
            </button>
          </div>
        ) : (
          <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant">
                    {['Cliente', 'Projeto', 'Material', 'Total', 'Status', 'Data', 'Ações'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q, i) => (
                    <tr
                      key={q.id}
                      className={`hover:bg-surface-container-high transition-colors ${
                        i < filtered.length - 1 ? 'border-b border-outline-variant/50' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-on-surface">{q.client_name}</p>
                          {q.client_phone && <p className="text-xs text-secondary">{q.client_phone}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-on-surface">{q.project_name}</p>
                          <p className="text-xs text-secondary capitalize">{q.project_type === 'pia' ? 'Bancada' : 'Escada'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-on-surface-variant">{q.material_name ?? '—'}</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-on-surface">{fmtCurrency(q.total)}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={q.status}
                          onChange={(e) => handleStatusChange(q.id, e.target.value as QuoteStatus)}
                          className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border cursor-pointer appearance-none bg-transparent ${STATUS_STYLE[q.status]}`}
                        >
                          {Object.entries(STATUS_LABEL).map(([k, v]) => (
                            <option key={k} value={k} className="bg-surface-container text-on-surface normal-case text-sm tracking-normal font-normal">
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-on-surface-variant text-xs">{fmt(q.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button title="Ver detalhes"
                            onClick={() => navigate(`/dashboard/orcamentos/${q.id}`)}
                            className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </button>
                          <button title="Excluir"
                            onClick={() => setDeleteId(q.id)}
                            className="p-1.5 rounded-lg text-secondary hover:text-error hover:bg-error-container/20 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmação de exclusão */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <span className="material-symbols-outlined text-error text-[36px] mb-3 block"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              delete_forever
            </span>
            <h3 className="font-black text-on-surface mb-1">Excluir orçamento?</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-error text-on-error text-sm font-bold hover:opacity-90 transition-opacity">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
