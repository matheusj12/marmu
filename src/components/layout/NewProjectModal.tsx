import { useNavigate } from 'react-router-dom'
import { useConfiguratorStore } from '../../store/configuratorStore'
import type { ProjectType } from '../../types'

interface ProjectItem {
  label: string
  desc:  string
  type:  ProjectType
  new?:  boolean   // badge "NOVO"
}

interface Category {
  id:    string
  label: string
  icon:  string
  color: string
  items: ProjectItem[]
}

const CATEGORIES: Category[] = [
  {
    id: 'bancadas', label: 'Bancadas e Superfícies', icon: 'countertops', color: 'text-primary',
    items: [
      { label: 'Bancada Cozinha / Banheiro', desc: 'Pia com cuba, cooktop e acabamentos', type: 'pia',                  new: true },
      { label: 'Bancada em L',               desc: 'Formato L — dois segmentos',          type: 'bancada_l'             },
      { label: 'Bancada em U',               desc: 'Formato U — três segmentos',           type: 'bancada_u'             },
      { label: 'Ilha de Cozinha',            desc: 'Ilha central com saia e acabamentos', type: 'ilha'                  },
      { label: 'Bancada p/ Lavanderia',      desc: 'Com tanque embutido',                 type: 'lavanderia'            },
      { label: 'Tampos para Mesas',          desc: 'Mesas, aparadores e buffets',         type: 'tampo'                 },
      { label: 'Churrasqueira / Gourmet',    desc: 'Área externa com bancada em pedra',   type: 'churrasqueira_gourmet' },
    ],
  },
  {
    id: 'revestimentos', label: 'Revestimentos', icon: 'wall', color: 'text-tertiary',
    items: [
      { label: 'Rebaixo Italiano',           desc: 'Espelho fundo, 1–3 cm de profundidade', type: 'rebaixo_italiano'    },
      { label: 'Rebaixo Americano',          desc: 'Cuba embutida com rebaixo',              type: 'rebaixo_americano'   },
      { label: 'Revestimento de Paredes',    desc: 'Banheiro, sala ou fachada',              type: 'revestimento_parede' },
      { label: 'Piso em Pedra Natural',      desc: 'Mármore, granito ou porcelanato',        type: 'piso'                },
      { label: 'Rodapés Mármore / Granito',  desc: 'Rodapé alto ou baixo',                  type: 'rodape'              },
      { label: 'Frisos e Molduras',          desc: 'Detalhes decorativos em pedra',          type: 'friso'               },
    ],
  },
  {
    id: 'soleiras', label: 'Soleiras, Peitoris e Escadas', icon: 'stairs', color: 'text-primary',
    items: [
      { label: 'Escada em Pedra',            desc: 'Degraus em granito ou mármore',       type: 'escada',        new: true },
      { label: 'Soleiras',                   desc: 'Soleiras de porta e passagem',        type: 'soleira'                 },
      { label: 'Peitoris de Janela',         desc: 'Peitoril interno e externo',          type: 'peitoril'                },
      { label: 'Degraus Avulsos',            desc: 'Degraus soltos sem espelho',          type: 'degrau_avulso'           },
      { label: 'Espelhos de Escada',         desc: 'Parte vertical do degrau',            type: 'espelho_escada'          },
      { label: 'Guardas e Pingadeiras',      desc: 'Pingadeiras e guarda-chuvas',         type: 'guarda'                  },
    ],
  },
  {
    id: 'banheiro', label: 'Banheiro Completo', icon: 'bathtub', color: 'text-tertiary',
    items: [
      { label: 'Cuba Esculpida na Pedra',    desc: 'Monobloco em mármore ou granito',     type: 'cuba_esculpida' },
      { label: 'Nicho Embutido na Parede',   desc: 'Nicho em pedra natural',              type: 'nicho'          },
      { label: 'Prateleiras de Pedra',       desc: 'Prateleiras e apoios',                type: 'prateleira'     },
      { label: 'Piso e Revestimento do Box', desc: 'Box completo em pedra natural',       type: 'piso_box'       },
      { label: 'Banco de Box',               desc: 'Assento em pedra',                    type: 'banco_box'      },
      { label: 'Tampo com Cuba',             desc: 'Tampo + cuba de embutir/sobrepor',    type: 'tampo_cuba'     },
    ],
  },
  {
    id: 'externos', label: 'Ambientes Externos e Comerciais', icon: 'storefront', color: 'text-primary',
    items: [
      { label: 'Fachadas de Lojas',          desc: 'Fachadas em pedra natural',             type: 'fachada'           },
      { label: 'Churrasqueiras em Pedra',    desc: 'Bancadas e revestimentos externos',      type: 'churrasqueira_ext' },
      { label: 'Piscinas',                   desc: 'Bordas e revestimento de piscina',       type: 'piscina'           },
      { label: 'Balcões Comerciais',         desc: 'Recepções e balcões de atendimento',     type: 'balcao'            },
      { label: 'Calçadas e Áreas Externas',  desc: 'Piso de área externa',                   type: 'calcada'           },
      { label: 'Soleiras de Portões',        desc: 'Soleiras de entrada e portões',          type: 'soleira_portao'    },
    ],
  },
  {
    id: 'acabamentos', label: 'Acabamentos e Serviços', icon: 'handyman', color: 'text-tertiary',
    items: [
      { label: 'Polimento e Restauração',    desc: 'Pedras antigas e danificadas',           type: 'polimento'          },
      { label: 'Cristalização de Mármores',  desc: 'Brilho espelho em mármore',              type: 'cristalizacao'      },
      { label: 'Impermeabilização',          desc: 'Proteção contra manchas',                type: 'impermeabilizacao'  },
      { label: 'Chanfros e Bordas',          desc: 'Chanfro, bisotê e bordas trabalhadas',   type: 'chanfro_borda'      },
      { label: 'Furos e Recortes',           desc: 'Pias, torneiras e cooktops',             type: 'furo_recorte'       },
      { label: 'Gravação a Jato',            desc: 'Letreiros e números de casa',            type: 'gravacao_jato'      },
      { label: 'Mosaico em Pedra Natural',   desc: 'Arte em pedra natural',                  type: 'mosaico'            },
    ],
  },
]

/* Tipos com configurador 3D completo */
const HAS_3D: ProjectType[] = ['pia', 'escada']

interface Props {
  onClose: () => void
}

export default function NewProjectModal({ onClose }: Props) {
  const navigate       = useNavigate()
  const setProjectType = useConfiguratorStore((s) => s.setProjectType)

  function handleSelect(type: ProjectType) {
    setProjectType(type)
    navigate('/dashboard/new')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low w-full max-w-4xl max-h-[90vh] rounded-3xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="px-8 pt-7 pb-5 border-b border-outline-variant flex-shrink-0 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">Novo Projeto</h2>
            <p className="text-sm text-secondary mt-1">
              Escolha a especialidade para iniciar o orçamento
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container-highest transition-colors flex-shrink-0 mt-0.5"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* grid de categorias */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => (
              <div
                key={cat.id}
                className="bg-surface-container rounded-2xl border border-outline-variant overflow-hidden"
              >
                {/* cabeçalho da categoria */}
                <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-high flex items-center gap-2.5">
                  <span
                    className={`material-symbols-outlined ${cat.color} text-[20px]`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {cat.icon}
                  </span>
                  <span className="text-[11px] font-bold text-on-surface tracking-wide uppercase">
                    {cat.label}
                  </span>
                </div>

                {/* itens */}
                <div className="divide-y divide-outline-variant/30">
                  {cat.items.map(item => {
                    const has3D = HAS_3D.includes(item.type)
                    return (
                      <button
                        key={item.type}
                        onClick={() => handleSelect(item.type)}
                        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition-all group hover:bg-primary-container/8 cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-on-surface group-hover:text-primary leading-snug transition-colors">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-secondary/60 mt-0.5 leading-tight truncate">
                            {item.desc}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                          {item.new && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-on-primary bg-primary px-1.5 py-0.5 rounded">
                              3D
                            </span>
                          )}
                          {has3D && !item.new && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-primary bg-primary-container/30 px-1.5 py-0.5 rounded border border-primary/20">
                              3D
                            </span>
                          )}
                          <span className="material-symbols-outlined text-secondary group-hover:text-primary text-[17px] transition-colors">
                            arrow_forward
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* rodapé */}
        <div className="px-8 py-4 border-t border-outline-variant bg-surface-container-lowest flex-shrink-0">
          <p className="text-[11px] text-secondary/50 text-center">
            <span className="material-symbols-outlined text-[13px] align-middle mr-1"
              style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            Itens com badge
            <span className="inline-block text-[8px] font-black text-on-primary bg-primary px-1 rounded mx-1">3D</span>
            incluem configurador interativo · Os demais geram orçamento por formulário
          </p>
        </div>
      </div>
    </div>
  )
}
