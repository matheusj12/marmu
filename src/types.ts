export type ProjectType = 'pia' | 'escada';

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
