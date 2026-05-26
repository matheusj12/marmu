import { useState } from 'react'

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: QuoteFormData) => void
}

export interface QuoteFormData {
  nome: string
  documento: string
  celular: string
  endereco: string
  pagamentos: string[]
  prazo: number
  descontoPct: number
  parcelamentoMax: number
}

const PAYMENT_OPTIONS = [
  { value: 'dinheiro_pix', label: 'Dinheiro/Pix', icon: 'payments' },
  { value: 'credito',      label: 'Crédito',      icon: 'credit_card' },
  { value: 'debito',       label: 'Débito',        icon: 'credit_card' },
  { value: 'boleto',       label: 'Boleto',        icon: 'description' },
]

export default function QuoteFinalizationModal({ isOpen, onClose, onConfirm }: QuoteModalProps) {
  const [nome, setNome] = useState('')
  const [documento, setDocumento] = useState('')
  const [celular, setCelular] = useState('')
  const [endereco, setEndereco] = useState('')
  const [pagamentos, setPagamentos] = useState<string[]>(['dinheiro_pix', 'credito'])
  const [prazo, setPrazo] = useState(15)
  const [descontoPct] = useState(10)
  const [parcelamentoMax] = useState(12)

  if (!isOpen) return null

  function togglePagamento(value: string) {
    setPagamentos((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    )
  }

  function handleSubmit() {
    onConfirm({ nome, documento, celular, endereco, pagamentos, prazo, descontoPct, parcelamentoMax })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface-container-low w-full max-w-xl rounded-3xl border border-outline-variant shadow-2xl relative my-auto">

        {/* Fechar */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-6 right-6 p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-outline-variant/50">
          <h2 className="text-2xl font-black text-on-surface tracking-tight mb-1">Dados do Cliente</h2>
          <p className="text-sm text-secondary">Preencha as informações para gerar o orçamento.</p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">

          {/* Dados pessoais */}
          <div className="space-y-5">

            <div>
              <label className="block text-xs font-bold text-secondary tracking-widest uppercase mb-2" htmlFor="qf-nome">
                Nome Completo
              </label>
              <input
                id="qf-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full bg-surface-container text-on-surface border border-outline-variant rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-secondary/50 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-secondary tracking-widest uppercase mb-2" htmlFor="qf-doc">
                  CPF / CNPJ
                </label>
                <input
                  id="qf-doc"
                  type="text"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-surface-container text-on-surface border border-outline-variant rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-secondary/50 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary tracking-widest uppercase mb-2" htmlFor="qf-cel">
                  Celular
                </label>
                <input
                  id="qf-cel"
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-surface-container text-on-surface border border-outline-variant rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-secondary/50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary tracking-widest uppercase mb-2" htmlFor="qf-end">
                Endereço de Entrega
              </label>
              <input
                id="qf-end"
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, Número, Bairro, Cidade"
                className="w-full bg-surface-container text-on-surface border border-outline-variant rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-secondary/50 font-medium"
              />
            </div>

          </div>

          {/* Formas de pagamento */}
          <div>
            <label className="block text-xs font-bold text-secondary tracking-widest uppercase mb-4">
              Formas de Pagamento Aceitas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PAYMENT_OPTIONS.map((opt) => {
                const selected = pagamentos.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => togglePagamento(opt.value)}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
                      selected
                        ? 'border-primary bg-primary-container/10 text-primary'
                        : 'border-outline-variant bg-surface-container text-secondary hover:border-outline hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Prazo + Opções adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div>
              <label className="block text-xs font-bold text-secondary tracking-widest uppercase mb-3" htmlFor="qf-prazo">
                Prazo de Entrega (Dias)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-secondary text-[20px]">schedule</span>
                </div>
                <input
                  id="qf-prazo"
                  type="number"
                  min={1}
                  max={365}
                  value={prazo}
                  onChange={(e) => setPrazo(Number(e.target.value))}
                  className="w-full bg-surface-container text-on-surface border border-outline-variant rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-bold text-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary tracking-widest uppercase mb-3">
                Opções Adicionais
              </label>
              <div className="space-y-3">

                {/* Desconto à vista */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-tertiary/30 bg-tertiary-container/10">
                  <div>
                    <span className="block text-[10px] font-bold text-tertiary tracking-wider uppercase mb-0.5">
                      Desconto P/ Vista
                    </span>
                    <div className="flex items-baseline gap-1 text-on-surface">
                      <span className="font-bold text-lg">{descontoPct}</span>
                      <span className="text-sm font-medium text-secondary">%</span>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-tertiary flex items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                    <span className="material-symbols-outlined text-on-tertiary text-[14px]">check</span>
                  </div>
                </div>

                {/* Parcelamento */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary-container/10">
                  <div>
                    <span className="block text-[10px] font-bold text-primary tracking-wider uppercase mb-0.5">
                      Parcelamento S/ Juros
                    </span>
                    <div className="flex items-baseline gap-1 text-on-surface">
                      <span className="text-xs font-medium text-secondary mr-1">Até</span>
                      <span className="font-bold text-lg">{parcelamentoMax}</span>
                      <span className="text-sm font-medium text-secondary">x</span>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-[0_0_10px_rgba(167,139,250,0.3)]">
                    <span className="material-symbols-outlined text-on-primary text-[14px]">check</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Footer CTA */}
        <div className="px-8 pb-8 pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-fixed hover:scale-[1.02] active:scale-[0.98] text-on-primary font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(167,139,250,0.2)]"
          >
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="tracking-wide">GERAR ORÇAMENTO FINAL</span>
          </button>
        </div>

      </div>
    </div>
  )
}
