import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import ThreeView from '../../components/3d/ThreeView'
import Editor2D from '../../components/2d/Editor2D'
import Editor2DL from '../../components/2d/Editor2DL'
import DimensionSchematic from '../../components/2d/DimensionSchematic'
import QuoteFinalizationModal, { type QuoteFormData } from '../../components/ui/QuoteFinalizationModal'
import PricePanel from '../../components/ui/PricePanel'
import { useConfiguratorStore } from '../../store/configuratorStore'
import { useAuthStore } from '../../store/authStore'
import { STONE_MATERIALS } from '../../materials'
import { calcPrice } from '../../lib/priceCalc'
import { createQuote } from '../../services/quotesService'
import { getBaseModel } from '../../types'

const PROJECT_LABELS: Partial<Record<string, string>> = {
  pia: 'Bancada Cozinha / Banheiro', bancada_l: 'Bancada em L', bancada_u: 'Bancada em U',
  ilha: 'Ilha de Cozinha', lavanderia: 'Bancada p/ Lavanderia', tampo: 'Tampos para Mesas',
  churrasqueira_gourmet: 'Churrasqueira / Gourmet',
  rebaixo_italiano: 'Rebaixo Italiano', rebaixo_americano: 'Rebaixo Americano',
  revestimento_parede: 'Revestimento de Paredes', piso: 'Piso em Pedra Natural',
  rodape: 'Rodapés Mármore/Granito', friso: 'Frisos e Molduras',
  escada: 'Escada em Pedra', soleira: 'Soleiras', peitoril: 'Peitoris de Janela',
  degrau_avulso: 'Degraus Avulsos', espelho_escada: 'Espelhos de Escada', guarda: 'Guardas e Pingadeiras',
  cuba_esculpida: 'Cuba Esculpida', nicho: 'Nicho Embutido', prateleira: 'Prateleiras de Pedra',
  piso_box: 'Piso e Revestimento do Box', banco_box: 'Banco de Box', tampo_cuba: 'Tampo com Cuba',
  fachada: 'Fachadas de Lojas', churrasqueira_ext: 'Churrasqueiras em Pedra',
  piscina: 'Piscinas', balcao: 'Balcões Comerciais', calcada: 'Calçadas e Áreas Externas',
  soleira_portao: 'Soleiras de Portões', polimento: 'Polimento e Restauração',
  cristalizacao: 'Cristalização', impermeabilizacao: 'Impermeabilização',
  chanfro_borda: 'Chanfros e Bordas', furo_recorte: 'Furos e Recortes',
  gravacao_jato: 'Gravação a Jato', mosaico: 'Mosaico em Pedra',
}

type TabView = 'dimensoes' | 'visualizacao'

export default function ConfiguratorPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabView>('dimensoes')
  const [projectName, setProjectName] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const profile = useAuthStore((s) => s.profile)

  const {
    projectType,
    selectedMaterial,
    setSelectedMaterial,
    countertop,
    setCountertop,
    staircase,
    autoRotate,
    setAutoRotate,
  } = useConfiguratorStore()

  const baseModel = getBaseModel(projectType)
  const specialtyLabel = PROJECT_LABELS[projectType] ?? projectType

  const breakdown = useMemo(
    () => calcPrice({ projectType: baseModel, countertop, staircase, material: selectedMaterial }),
    [baseModel, countertop, staircase, selectedMaterial],
  )

  async function handleQuoteConfirm(data: QuoteFormData) {
    const discountValue = breakdown.subtotal * (data.descontoPct / 100)
    try {
      await createQuote({
        tenant_id:       profile?.tenant_id ?? 'local',
        client_name:     data.nome,
        client_phone:    data.celular,
        client_cpf_cnpj: data.documento,
        client_address:  data.endereco,
        project_type:    projectType,
        project_name:    projectName,
        material_id:     selectedMaterial.id,
        material_name:   selectedMaterial.name,
        configuration:   baseModel === 'pia' ? countertop : staircase,
        payment_methods: data.pagamentos,
        delivery_days:   data.prazo,
        subtotal:        breakdown.subtotal,
        discount_pct:    data.descontoPct,
        discount_value:  discountValue,
        installments:    data.parcelamentoMax,
        total:           breakdown.subtotal - discountValue,
        status:          'draft',
      })
    } catch (e) {
      console.error('[Marmu] Erro ao criar orçamento:', e)
    }
    setModalOpen(false)
    navigate('/dashboard/orcamentos')
  }

  return (
    <div className="bg-background flex overflow-hidden h-screen">
      <Sidebar />

      {/* Área principal */}
      <div className="ml-64 flex-1 flex flex-col h-screen overflow-hidden">

        {/* TopAppBar */}
        <header className="h-14 flex-shrink-0 bg-surface-container-low border-b border-outline-variant flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="p-1 text-secondary hover:text-on-surface hover:bg-surface-container-highest rounded-md transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <span className="text-sm font-black text-on-surface tracking-tight">{specialtyLabel}</span>
              <span className="ml-2 text-[10px] text-secondary/60 uppercase tracking-widest font-bold">Editor 3D</span>
            </div>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {([
              { id: 'dimensoes',   label: 'Dimensões'   },
              { id: 'visualizacao', label: 'Visualização' },
            ] as { id: TabView; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <button
              title="Rotação automática"
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-md transition-colors ${
                autoRotate ? 'text-primary bg-surface-container-highest' : 'text-secondary hover:text-on-surface hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">360</span>
            </button>
            <button className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-container-highest rounded-md transition-colors">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <button className="bg-primary text-on-primary px-4 py-1.5 rounded-md font-medium text-sm hover:bg-primary-container transition-colors">
              Salvar Projeto
            </button>
          </div>
        </header>

        {/* Conteúdo: viewport 3D + painel config */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Viewport: 3D ou 2D dependendo da tab */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === 'dimensoes' && baseModel === 'pia' ? (
              <>
                {/* Vista 2D (60% altura) — Editor interativo para pia, esquemático para demais */}
                <div className="flex-1 min-h-0 border-b border-outline-variant">
                  {projectType === 'pia'
                    ? <Editor2D />
                    : (projectType === 'bancada_l' || projectType === 'churrasqueira_gourmet')
                      ? <Editor2DL projectType={projectType} />
                      : <DimensionSchematic projectType={projectType} countertop={countertop} />
                  }
                </div>
                {/* Mini 3D preview (40% altura) */}
                <div className="h-56 flex-shrink-0 relative">
                  <div className="absolute top-2 left-3 z-10">
                    <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">
                      Visualização 3D
                    </span>
                  </div>
                  <ThreeView
                    type={projectType}
                    countertop={countertop}
                    staircase={staircase}
                    material={selectedMaterial}
                    autoRotate={autoRotate}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 relative min-h-0">
                <ThreeView
                  type={projectType}
                  countertop={countertop}
                  staircase={staircase}
                  material={selectedMaterial}
                  autoRotate={autoRotate}
                />
              </div>
            )}
          </div>

          {/* Painel de configuração (direita) */}
          <aside className="w-96 flex-shrink-0 h-full bg-surface-container border-l border-outline-variant flex flex-col shadow-[-8px_0_24px_rgba(0,0,0,0.5)]">

            {/* Header do painel */}
            <div className="p-5 border-b border-outline-variant bg-surface-container-high flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-black text-on-surface text-base tracking-tight">Configuração de Peça</h2>
                <p className="text-xs text-secondary mt-0.5">Defina materiais e acabamentos</p>
              </div>
            </div>

            {/* Scrollable config */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Nome do projeto */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={`Ex: ${specialtyLabel}`}
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                {/* Material */}
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                    Tipo de Pedra
                  </label>
                  <div className="relative">
                    <select
                      value={selectedMaterial.id}
                      onChange={(e) => {
                        const mat = STONE_MATERIALS.find((m) => m.id === e.target.value)
                        if (mat) setSelectedMaterial(mat)
                      }}
                      className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    >
                      {STONE_MATERIALS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — R$ {m.pricePerM2.toFixed(0)}/m²
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-secondary">
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-outline-variant" />

              {/* Dimensões (bancada) */}
              {baseModel === 'pia' && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Dimensões
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { key: 'width', label: 'Largura', unit: 'cm' },
                        { key: 'depth', label: 'Profund.', unit: 'cm' },
                        { key: 'thickness', label: 'Espessura', unit: 'cm' },
                      ] as const
                    ).map(({ key, label, unit }) => (
                      <div key={key}>
                        <label className="block text-[10px] text-secondary mb-1">{label}</label>
                        <input
                          type="number"
                          value={countertop[key]}
                          onChange={(e) => setCountertop({ [key]: Number(e.target.value) })}
                          className="w-full bg-surface-container-highest border border-outline-variant rounded px-2 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary text-center font-mono"
                        />
                        <p className="text-[10px] text-secondary text-center mt-0.5">{unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dimensões (escada) */}
              {baseModel === 'escada' && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Dimensões da Escada
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { key: 'stepsCount', label: 'Degraus', unit: 'un' },
                        { key: 'stepWidth', label: 'Largura', unit: 'cm' },
                        { key: 'stepDepth', label: 'Pisada', unit: 'cm' },
                      ] as const
                    ).map(({ key, label, unit }) => (
                      <div key={key}>
                        <label className="block text-[10px] text-secondary mb-1">{label}</label>
                        <input
                          type="number"
                          value={staircase[key]}
                          onChange={(e) =>
                            useConfiguratorStore.getState().setStaircase({ [key]: Number(e.target.value) })
                          }
                          className="w-full bg-surface-container-highest border border-outline-variant rounded px-2 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary text-center font-mono"
                        />
                        <p className="text-[10px] text-secondary text-center mt-0.5">{unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Painel de preço em tempo real */}
              <div>
                <div className="h-px w-full bg-outline-variant mb-4" />
                <PricePanel breakdown={breakdown} />
              </div>

            </div>

            {/* Footer do painel */}
            <div className="p-4 border-t border-outline-variant flex-shrink-0">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-fixed text-on-primary font-bold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(167,139,250,0.2)]"
              >
                <span className="material-symbols-outlined">receipt_long</span>
                Finalizar Orçamento
              </button>
            </div>

          </aside>
        </div>
      </div>

      {/* Modal de finalização */}
      <QuoteFinalizationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleQuoteConfirm}
      />
    </div>
  )
}
