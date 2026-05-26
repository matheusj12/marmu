import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import PricePanel from '../../components/ui/PricePanel'
import { getQuoteById, updateQuoteStatus, deleteQuote, type QuoteRow, type QuoteStatus } from '../../services/quotesService'
import { fmtBRL } from '../../lib/priceCalc'
import type { PriceBreakdown } from '../../lib/priceCalc'

const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Rascunho',  color: '#71717a',  bg: '#27272a' },
  sent:     { label: 'Enviado',   color: '#a78bfa',  bg: '#2e1065' },
  approved: { label: 'Aprovado',  color: '#34d399',  bg: '#065f46' },
  rejected: { label: 'Rejeitado', color: '#ef4444',  bg: '#3b1111' },
  expired:  { label: 'Expirado',  color: '#f59e0b',  bg: '#451a03' },
}

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro_pix: 'Dinheiro / Pix',
  credito:      'Crédito',
  debito:       'Débito',
  boleto:       'Boleto',
}

function quoteToBreakdown(q: QuoteRow): PriceBreakdown {
  return {
    baseAreaM2:      0,
    mlSaia:          0,
    mlFrontao:       0,
    stoneCost:       q.subtotal,
    saiaCost:        0,
    frontaoCost:     0,
    fabricationCost: 0,
    subtotal:        q.subtotal,
    discountPct:     q.discount_pct,
    discountValue:   q.discount_value,
    tax:             0,
    total:           q.total,
  }
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [quote, setQuote]         = useState<QuoteRow | null>(null)
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    getQuoteById(id).then((q) => { setQuote(q); setLoading(false) })
  }, [id])

  async function handleStatusChange(status: QuoteStatus) {
    if (!quote) return
    await updateQuoteStatus(quote.id, status)
    setQuote({ ...quote, status })
  }

  async function handleDelete() {
    if (!quote) return
    setDeleting(true)
    await deleteQuote(quote.id)
    navigate('/dashboard/orcamentos')
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // ---- Loading ----
  if (loading) {
    return (
      <div className="bg-background flex overflow-hidden h-screen">
        <Sidebar />
        <div className="ml-64 flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // ---- Not found ----
  if (!quote) {
    return (
      <div className="bg-background flex overflow-hidden h-screen">
        <Sidebar />
        <main className="ml-64 flex-1 flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30">description_off</span>
          <h1 className="text-xl font-bold text-on-surface">Orçamento não encontrado</h1>
          <Link to="/dashboard/orcamentos" className="text-sm text-primary hover:underline">
            Voltar para Orçamentos
          </Link>
        </main>
      </div>
    )
  }

  const st = STATUS_CONFIG[quote.status]

  return (
    <div className="bg-background flex overflow-hidden h-screen">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col overflow-hidden">

        {/* TopBar */}
        <header className="flex-shrink-0 h-14 bg-surface-container-low border-b border-outline-variant flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/orcamentos"
              className="p-1.5 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span>Orçamentos</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface font-medium font-mono">#{quote.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status selector */}
            <select
              value={quote.status}
              onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
              className="text-xs font-bold border rounded-lg px-3 py-1.5 appearance-none cursor-pointer focus:outline-none"
              style={{
                backgroundColor: st.bg,
                color: st.color,
                borderColor: `${st.color}40`,
              }}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            {/* PDF (em breve) */}
            <button
              disabled
              title="Gerar PDF (em breve)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-secondary text-sm font-medium opacity-50 cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              PDF
            </button>

            {/* Deletar */}
            {!confirmDel ? (
              <button
                onClick={() => setConfirmDel(true)}
                className="p-1.5 rounded-md text-secondary hover:text-error hover:bg-error-container/20 transition-colors"
                title="Excluir orçamento"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-error-container/20 border border-error/30 rounded-lg px-3 py-1.5">
                <span className="text-xs text-on-error-container">Confirmar exclusão?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-bold text-error hover:opacity-80"
                >
                  {deleting ? 'Excluindo…' : 'Sim'}
                </button>
                <button
                  onClick={() => setConfirmDel(false)}
                  className="text-xs text-secondary hover:text-on-surface"
                >
                  Não
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Coluna esquerda: informações */}
            <div className="lg:col-span-2 space-y-6">

              {/* Cabeçalho do orçamento */}
              <div className="bg-surface-container rounded-2xl border border-outline-variant p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-black text-on-surface tracking-tight mb-1">
                      {quote.project_name}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-secondary">
                      <span>{quote.project_type === 'pia' ? '🪨 Bancada' : '🪜 Escada'}</span>
                      {quote.material_name && (
                        <>
                          <span className="text-outline-variant">·</span>
                          <span>{quote.material_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className="inline-block text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                    <p className="text-xs text-secondary mt-1">{fmtDate(quote.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="bg-surface-container rounded-2xl border border-outline-variant p-6">
                <h2 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Cliente
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Info label="Nome" value={quote.client_name} />
                  {quote.client_phone && <Info label="Celular" value={quote.client_phone} />}
                  {quote.client_cpf_cnpj && <Info label="CPF / CNPJ" value={quote.client_cpf_cnpj} />}
                  {quote.client_address && (
                    <div className="sm:col-span-2">
                      <Info label="Endereço" value={quote.client_address} />
                    </div>
                  )}
                </div>
              </div>

              {/* Condições comerciais */}
              <div className="bg-surface-container rounded-2xl border border-outline-variant p-6">
                <h2 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">handshake</span>
                  Condições Comerciais
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Info
                    label="Prazo de Entrega"
                    value={`${quote.delivery_days} dias`}
                    icon="schedule"
                  />
                  {quote.installments > 1 && (
                    <Info
                      label="Parcelamento"
                      value={`Até ${quote.installments}x s/ juros`}
                      icon="credit_score"
                    />
                  )}
                  {quote.discount_pct > 0 && (
                    <Info
                      label="Desconto à Vista"
                      value={`${quote.discount_pct}%`}
                      icon="sell"
                      valueColor="#34d399"
                    />
                  )}
                </div>

                {quote.payment_methods.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
                      Formas de Pagamento
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quote.payment_methods.map((p) => (
                        <span
                          key={p}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-surface-container-highest border border-outline-variant text-on-surface-variant"
                        >
                          {PAYMENT_LABELS[p] ?? p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna direita: preço */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">
                  Resumo Financeiro
                </p>
                <PricePanel breakdown={quoteToBreakdown(quote)} />
              </div>

              {/* Total destaque */}
              <div className="bg-surface-container rounded-2xl border border-outline-variant p-5 text-center">
                <p className="text-xs text-secondary mb-1">Total do Orçamento</p>
                <p className="text-3xl font-black text-primary font-mono">
                  {fmtBRL(quote.total)}
                </p>
                {quote.installments > 1 && (
                  <p className="text-xs text-secondary mt-1">
                    ou {quote.installments}x de{' '}
                    <span className="text-on-surface font-bold font-mono">
                      {fmtBRL(quote.total / quote.installments)}
                    </span>
                  </p>
                )}
              </div>

              {/* Ações rápidas */}
              <div className="space-y-2">
                <button
                  onClick={() => handleStatusChange('sent')}
                  disabled={quote.status === 'sent'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 text-primary font-medium text-sm hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Marcar como Enviado
                </button>
                <button
                  onClick={() => handleStatusChange('approved')}
                  disabled={quote.status === 'approved'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-tertiary/30 text-tertiary font-medium text-sm hover:bg-tertiary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Marcar como Aprovado
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

function Info({
  label,
  value,
  icon,
  valueColor,
}: {
  label: string
  value: string
  icon?: string
  valueColor?: string
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5 flex items-center gap-1">
        {icon && <span className="material-symbols-outlined text-[12px]">{icon}</span>}
        {label}
      </p>
      <p className="text-sm font-medium text-on-surface" style={valueColor ? { color: valueColor } : {}}>
        {value}
      </p>
    </div>
  )
}
