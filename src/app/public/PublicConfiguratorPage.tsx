import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import ThreeView from '../../components/3d/ThreeView'
import QuoteFinalizationModal, { type QuoteFormData } from '../../components/ui/QuoteFinalizationModal'
import PricePanel from '../../components/ui/PricePanel'
import { getTenantBySlug, getPublicMaterials, submitPublicQuote, type PublicTenant } from '../../services/publicTenantService'
import { useConfiguratorStore } from '../../store/configuratorStore'
import { calcPrice } from '../../lib/priceCalc'
import type { MaterialRow } from '../../services/materialsService'
import type { StoneMaterial } from '../../types'
import { getBaseModel } from '../../types'

type PageState = 'loading' | 'not-found' | 'ready' | 'submitting' | 'success'
type Category  = 'todos' | StoneMaterial['category']

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'todos',   label: 'Todos'   },
  { key: 'granito', label: 'Granito' },
  { key: 'marmore', label: 'Mármore' },
  { key: 'quartzo', label: 'Quartzo' },
  { key: 'ultra',   label: 'Ultra'   },
]

export default function PublicConfiguratorPage() {
  const { slug } = useParams<{ slug: string }>()

  const [state,     setState]     = useState<PageState>('loading')
  const [tenant,    setTenant]    = useState<PublicTenant | null>(null)
  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [category,  setCategory]  = useState<Category>('todos')
  const [modal,     setModal]     = useState(false)
  const [quoteId,   setQuoteId]   = useState<string | null>(null)

  const {
    projectType, setProjectType,
    selectedMaterial, setSelectedMaterial,
    countertop, setCountertop,
    staircase, autoRotate, setAutoRotate,
    resetConfigurator,
  } = useConfiguratorStore()

  useEffect(() => {
    resetConfigurator()
    if (!slug) { setState('not-found'); return }

    ;(async () => {
      try {
        const t = await getTenantBySlug(slug)
        if (!t) { setState('not-found'); return }

        const mats = await getPublicMaterials(t.id)
        setTenant(t)
        setMaterials(mats)
        if (mats.length > 0) setSelectedMaterial(mats[0])
        setState('ready')
      } catch {
        setState('not-found')
      }
    })()
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleQuoteSubmit(data: QuoteFormData) {
    if (!tenant) return
    setState('submitting')
    setModal(false)
    try {
      const discountValue = breakdown.subtotal * (data.descontoPct / 100)
      const result = await submitPublicQuote(tenant.id, {
        client_name:     data.nome,
        client_phone:    data.celular,
        client_cpf_cnpj: data.documento,
        client_address:  data.endereco,
        project_type:    projectType,
        project_name:    `${projectType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} — ${selectedMaterial.name}`,
        material_id:     selectedMaterial.id,
        configuration:   baseModel === 'pia' ? countertop as unknown as Record<string, unknown> : staircase as unknown as Record<string, unknown>,
        payment_methods: data.pagamentos,
        delivery_days:   data.prazo,
        subtotal:        breakdown.subtotal,
        discount_pct:    data.descontoPct,
        discount_value:  discountValue,
        installments:    data.parcelamentoMax,
        total:           breakdown.subtotal - discountValue,
      })
      setQuoteId(result.id)
      setState('success')
    } catch {
      setState('ready')
    }
  }

  const filteredMaterials = materials.filter(
    (m) => category === 'todos' || m.category === category,
  )

  const brandColor = tenant?.primary_color ?? '#a78bfa'
  const baseModel  = getBaseModel(projectType)

  const breakdown = useMemo(
    () => calcPrice({ projectType: baseModel, countertop, staircase, material: selectedMaterial }),
    [baseModel, countertop, staircase, selectedMaterial],
  )

  // ---- Estados da página ----

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${brandColor} transparent transparent transparent` }} />
          <p className="text-sm text-on-surface-variant">Carregando configurador...</p>
        </div>
      </div>
    )
  }

  if (state === 'not-found') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4">
            search_off
          </span>
          <h1 className="text-2xl font-black text-on-surface mb-2">Configurador não encontrado</h1>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            O link <span className="text-primary font-medium">/{slug}</span> não corresponde a
            nenhuma marmoraria ativa. Verifique o link recebido.
          </p>
        </div>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Ícone de sucesso */}
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `${brandColor}20`, border: `2px solid ${brandColor}40` }}>
            <span className="material-symbols-outlined text-[40px]"
              style={{ color: brandColor, fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>

          <h1 className="text-3xl font-black text-on-surface mb-3 tracking-tight">
            Orçamento enviado!
          </h1>
          <p className="text-on-surface-variant leading-relaxed mb-2">
            A equipe da <span className="font-bold text-on-surface">{tenant?.name}</span> vai
            entrar em contato em breve com seu orçamento detalhado.
          </p>
          {quoteId && (
            <p className="text-xs text-on-surface-variant/60 mb-8">
              Protocolo: <span className="font-mono">{quoteId.slice(0, 8).toUpperCase()}</span>
            </p>
          )}

          <button
            onClick={() => { resetConfigurator(); setState('ready') }}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: brandColor, color: '#0a0012' }}
          >
            Fazer outro orçamento
          </button>
        </div>
      </div>
    )
  }

  // ---- Página principal ----

  return (
    <div className="bg-background flex flex-col h-screen overflow-hidden">

      {/* Header minimal com branding do tenant */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-6 border-b border-outline-variant bg-surface-container-low z-30"
        style={{ borderBottomColor: `${brandColor}30` }}>
        <div className="flex items-center gap-3">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
              style={{ backgroundColor: `${brandColor}25`, color: brandColor }}>
              {tenant?.name?.[0]?.toUpperCase() ?? 'M'}
            </div>
          )}
          <span className="font-black text-on-surface tracking-tight">{tenant?.name}</span>
          <span className="hidden sm:inline text-xs text-on-surface-variant border border-outline-variant rounded px-1.5 py-0.5">
            Configurador 3D
          </span>
        </div>

        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 font-bold py-2 px-5 rounded-lg text-sm transition-all hover:opacity-90 active:scale-95 shadow-sm"
          style={{ backgroundColor: brandColor, color: '#0a0012' }}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          <span className="hidden sm:inline">Solicitar Orçamento</span>
          <span className="sm:hidden">Orçar</span>
        </button>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex overflow-hidden">

        {/* Viewport 3D */}
        <div className="flex-1 relative min-h-0">
          <ThreeView
            type={projectType}
            countertop={countertop}
            staircase={staircase}
            material={selectedMaterial}
            autoRotate={autoRotate}
          />

          {/* Controles flutuantes */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface-container-highest/80 backdrop-blur-md border border-outline-variant rounded-full px-3 py-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? 'Parar rotação' : 'Rotação automática'}
              className={`p-1.5 rounded-full transition-colors text-xs flex items-center gap-1 font-medium ${
                autoRotate ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">360</span>
              <span className="hidden sm:inline">{autoRotate ? 'Girando' : 'Girar'}</span>
            </button>
            <div className="w-px h-4 bg-outline-variant" />
            <span className="text-[10px] text-on-surface-variant">
              Arraste para rotacionar · Scroll para zoom
            </span>
          </div>
        </div>

        {/* Painel de configuração (direita) */}
        <aside className="w-80 flex-shrink-0 flex flex-col bg-surface-container border-l border-outline-variant overflow-hidden">

          {/* Tipo de projeto */}
          <div className="p-4 border-b border-outline-variant flex-shrink-0">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
              Tipo de Projeto
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['pia', 'escada'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setProjectType(type)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    projectType === type
                      ? 'text-on-surface border-transparent'
                      : 'border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                  style={projectType === type ? { backgroundColor: `${brandColor}20`, borderColor: `${brandColor}50`, color: brandColor } : {}}
                >
                  {type === 'pia' ? '🪨 Bancada' : '🪜 Escada'}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro de categoria */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
              Material
            </p>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {CATEGORIES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    category === key
                      ? 'text-on-surface'
                      : 'text-secondary hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                  style={category === key ? { backgroundColor: `${brandColor}20`, color: brandColor } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de materiais */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
            {filteredMaterials.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-8">
                Nenhum material nesta categoria
              </p>
            ) : (
              filteredMaterials.map((m) => {
                const isSelected = selectedMaterial.id === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMaterial(m)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'border-transparent'
                        : 'border-outline-variant hover:bg-surface-container-high hover:border-outline'
                    }`}
                    style={isSelected ? { backgroundColor: `${brandColor}15`, borderColor: `${brandColor}40` } : {}}
                  >
                    {/* Swatch */}
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0 border border-white/10"
                      style={{ backgroundColor: m.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isSelected ? '' : 'text-on-surface'}`}
                        style={isSelected ? { color: brandColor } : {}}>
                        {m.name}
                      </p>
                      <p className="text-xs text-on-surface-variant capitalize">{m.category}</p>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[18px] flex-shrink-0"
                        style={{ color: brandColor, fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Dimensões */}
          {baseModel === 'pia' && (
            <div className="px-4 py-4 border-t border-outline-variant flex-shrink-0 space-y-3">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                Dimensões (cm)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'width', label: 'Larg.' },
                    { key: 'depth', label: 'Prof.' },
                    { key: 'thickness', label: 'Esp.' },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-[10px] text-secondary text-center mb-1">{label}</p>
                    <input
                      type="number"
                      value={countertop[key]}
                      onChange={(e) => setCountertop({ [key]: Number(e.target.value) })}
                      className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-2 py-2 text-sm text-on-surface text-center font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {baseModel === 'escada' && (
            <div className="px-4 py-4 border-t border-outline-variant flex-shrink-0 space-y-3">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                Dimensões (cm)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'stepsCount', label: 'Degraus', unit: 'un' },
                    { key: 'stepWidth',  label: 'Largura',  unit: 'cm' },
                    { key: 'stepDepth',  label: 'Pisada',   unit: 'cm' },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-[10px] text-secondary text-center mb-1">{label}</p>
                    <input
                      type="number"
                      value={staircase[key]}
                      onChange={(e) =>
                        useConfiguratorStore.getState().setStaircase({ [key]: Number(e.target.value) })
                      }
                      className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-2 py-2 text-sm text-on-surface text-center font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Painel de preço */}
          <div className="px-4 pb-4 flex-shrink-0">
            <PricePanel breakdown={breakdown} brandColor={brandColor} compact />
          </div>

          {/* CTA bottom */}
          <div className="p-4 border-t border-outline-variant flex-shrink-0">
            <button
              onClick={() => setModal(true)}
              disabled={state === 'submitting'}
              className="w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg"
              style={{
                backgroundColor: brandColor,
                color: '#0a0012',
                boxShadow: `0 0 24px ${brandColor}40`,
              }}
            >
              {state === 'submitting' ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: `#0a0012 transparent transparent transparent` }} />
                  Enviando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  Solicitar Orçamento
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-on-surface-variant mt-2">
              Gratuito · Sem compromisso
            </p>
          </div>
        </aside>
      </div>

      {/* Modal de dados do cliente */}
      <QuoteFinalizationModal
        isOpen={modal}
        onClose={() => setModal(false)}
        onConfirm={handleQuoteSubmit}
      />
    </div>
  )
}
