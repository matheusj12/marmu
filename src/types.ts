/* Especialidades disponíveis no catálogo de projetos */
export type ProjectType =
  /* ── Bancadas e Superfícies ── */
  | 'pia'                   // Bancada Cozinha / Banheiro  (configurador 3D)
  | 'bancada_l'             // Bancada em L
  | 'bancada_u'             // Bancada em U
  | 'ilha'                  // Ilha de Cozinha
  | 'lavanderia'            // Bancada p/ Lavanderia
  | 'tampo'                 // Tampos para Mesas e Aparadores
  | 'churrasqueira_gourmet' // Churrasqueira / Área Gourmet
  /* ── Revestimentos ── */
  | 'rebaixo_italiano'      // Rebaixo Italiano
  | 'rebaixo_americano'     // Rebaixo Americano
  | 'revestimento_parede'   // Revestimento de Paredes
  | 'piso'                  // Piso em Pedra Natural
  | 'rodape'                // Rodapés Mármore/Granito
  | 'friso'                 // Frisos e Molduras Decorativas
  /* ── Soleiras, Peitoris e Escadas ── */
  | 'escada'                // Escada em Pedra              (configurador 3D)
  | 'soleira'               // Soleiras
  | 'peitoril'              // Peitoris de Janela
  | 'degrau_avulso'         // Degraus Avulsos
  | 'espelho_escada'        // Espelhos de Escada
  | 'guarda'                // Guardas e Pingadeiras
  /* ── Banheiro Completo ── */
  | 'cuba_esculpida'        // Cuba Esculpida na Pedra
  | 'nicho'                 // Nicho Embutido na Parede
  | 'prateleira'            // Prateleiras de Pedra
  | 'piso_box'              // Piso e Revestimento do Box
  | 'banco_box'             // Banco de Box (assento em pedra)
  | 'tampo_cuba'            // Tampo com Cuba de Embutir/Sobrepor
  /* ── Ambientes Externos e Comerciais ── */
  | 'fachada'               // Fachadas de Lojas e Edifícios
  | 'churrasqueira_ext'     // Churrasqueiras em Pedra (externo)
  | 'piscina'               // Piscinas (bordas e revestimento)
  | 'balcao'                // Balcões Comerciais e Recepções
  | 'calcada'               // Calçadas e Áreas Externas
  | 'soleira_portao'        // Soleiras de Portões
  /* ── Acabamentos e Serviços ── */
  | 'polimento'             // Polimento e Restauração
  | 'cristalizacao'         // Cristalização de Mármores
  | 'impermeabilizacao'     // Impermeabilização
  | 'chanfro_borda'         // Chanfros e Bordas Trabalhadas
  | 'furo_recorte'          // Furos p/ Pias, Torneiras e Cooktops
  | 'gravacao_jato'         // Gravação a Jato
  | 'mosaico';              // Mosaico em Pedra Natural

/* Mapeia qualquer ProjectType para o modelo 3D base disponível */
export function getBaseModel(type: ProjectType): 'pia' | 'escada' {
  const escadaTypes: ProjectType[] = ['escada', 'degrau_avulso', 'espelho_escada']
  return escadaTypes.includes(type) ? 'escada' : 'pia'
}

/* Tipos de modelo 3D específico */
export type Model3DType =
  | 'bancada'
  | 'bancada_l'
  | 'bancada_u'
  | 'escada'
  | 'slab'
  | 'wall'
  | 'floor'
  | 'bathroom'
  | 'commercial'
  | 'service'

/* Mapeia ProjectType para o componente 3D correto */
export function get3DModel(type: ProjectType): Model3DType {
  switch (type) {
    case 'pia': case 'lavanderia': case 'tampo_cuba': case 'ilha': case 'tampo':
      return 'bancada'
    case 'bancada_l': case 'churrasqueira_gourmet':
      return 'bancada_l'
    case 'bancada_u':
      return 'bancada_u'
    case 'escada': case 'degrau_avulso': case 'espelho_escada':
      return 'escada'
    case 'soleira': case 'peitoril': case 'guarda': case 'rodape':
    case 'friso': case 'soleira_portao': case 'chanfro_borda': case 'furo_recorte':
      return 'slab'
    case 'revestimento_parede': case 'rebaixo_italiano': case 'rebaixo_americano': case 'fachada':
      return 'wall'
    case 'piso': case 'calcada': case 'piso_box':
      return 'floor'
    case 'cuba_esculpida': case 'nicho': case 'prateleira': case 'banco_box':
      return 'bathroom'
    case 'balcao': case 'churrasqueira_ext': case 'piscina':
      return 'commercial'
    default:
      return 'service'
  }
}

export interface StoneMaterial {
  id: string;
  name: string;
  category: 'granito' | 'marmore' | 'quartzo' | 'ultra';
  color: string;
  secondaryColor?: string;
  textureType: 'solid' | 'marble' | 'granite' | 'composite';
  pricePerM2: number;
  pricePerML_Saia: number;   // Preço por metro linear de saia
  pricePerML_Frontao: number; // Preço por metro linear de frontão
  roughness: number;
  metalness: number;
  specular?: string;
}

export interface CountertopConfig {
  width: number;       // em cm
  depth: number;       // em cm
  thickness: number;   // em cm (geralmente 2 ou 3)
  saiaHeight: number;  // em cm (altura da saia frontal/lateral)
  frontaoHeight: number; // em cm (altura do frontão traseiro)
  frontaoLeft: boolean;  // lateral esquerda
  frontaoRight: boolean; // lateral direita
  cornerStyle: 'reto' | 'chanfro' | 'boleado';
  hasSink: boolean;
  sinkType: 'inox_embutir' | 'inox_sobrepor' | 'esculpida';
  sinkWidth: number;   // em cm
  sinkDepth: number;   // em cm
  sinkX: number;       // offset do centro em %
  hasCooktop: boolean;
  cooktopWidth: number;
  cooktopDepth: number;
  cooktopX: number;    // offset do centro em %
}

export interface StaircaseConfig {
  style: 'cascata' | 'flutuante' | 'plisada'; // cascata=solid sides, flutuante=floating, plisada=zig zag
  stepsCount: number;
  stepWidth: number;   // largura do degrau em cm
  stepDepth: number;   // pisada do degrau em cm
  stepHeight: number;  // espelho do degrau em cm
  thickness: number;   // em cm
  hasSkirting: boolean; // Rodapé de escada ("plinto" ou "rodapé jacaré")
  skirtingStyle: 'reto' | 'jacare';
}

export interface ClientQuote {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  discount: number; // % desconto
  tax: number; // acréscimo / frete
  observations: string;
}
