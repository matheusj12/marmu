import { StoneMaterial } from './types';

export const STONE_MATERIALS: StoneMaterial[] = [
  {
    id: 'preto_sao_gabriel',
    name: 'Preto São Gabriel',
    category: 'granito',
    color: '#0d0d0d',
    secondaryColor: '#3a3a3a',
    textureType: 'granite',
    pricePerM2: 520,
    pricePerML_Saia: 90,
    pricePerML_Frontao: 85,
    roughness: 0.12,
    metalness: 0.1
  },
  {
    id: 'verde_ubatuba',
    name: 'Verde Ubatuba',
    category: 'granito',
    color: '#0b1613',
    secondaryColor: '#2b5042',
    textureType: 'granite',
    pricePerM2: 450,
    pricePerML_Saia: 80,
    pricePerML_Frontao: 75,
    roughness: 0.15,
    metalness: 0.15
  },
  {
    id: 'branco_prime',
    name: 'Branco Prime',
    category: 'marmore',
    color: '#f9f9fa',
    secondaryColor: '#e1e3e8',
    textureType: 'composite',
    pricePerM2: 680,
    pricePerML_Saia: 110,
    pricePerML_Frontao: 105,
    roughness: 0.08,
    metalness: 0.05
  },
  {
    id: 'marmore_crema_marfil',
    name: 'Crema Marfil',
    category: 'marmore',
    color: '#f4ede1',
    secondaryColor: '#decbb4',
    textureType: 'marble',
    pricePerM2: 890,
    pricePerML_Saia: 140,
    pricePerML_Frontao: 130,
    roughness: 0.18,
    metalness: 0.05
  },
  {
    id: 'marmore_branco_carrara',
    name: 'Branco Carrara',
    category: 'marmore',
    color: '#eaeaea',
    secondaryColor: '#b0b5be',
    textureType: 'marble',
    pricePerM2: 1450,
    pricePerML_Saia: 220,
    pricePerML_Frontao: 210,
    roughness: 0.2,
    metalness: 0.05
  },
  {
    id: 'quartzo_cinza_absoluto',
    name: 'Cinza Absoluto',
    category: 'quartzo',
    color: '#42454a',
    secondaryColor: '#232529',
    textureType: 'composite',
    pricePerM2: 950,
    pricePerML_Saia: 160,
    pricePerML_Frontao: 150,
    roughness: 0.08,
    metalness: 0.05
  },
  {
    id: 'quartzo_calacatta_gold',
    name: 'Calacatta Gold (Premium)',
    category: 'quartzo',
    color: '#fbfbfb',
    secondaryColor: '#cca256', // veins gold
    textureType: 'marble',
    pricePerM2: 2100,
    pricePerML_Saia: 320,
    pricePerML_Frontao: 300,
    roughness: 0.06,
    metalness: 0.05
  },
  {
    id: 'ultra_compact_dekton',
    name: 'Slate Black (Dekton Style)',
    category: 'ultra',
    color: '#1a1b1d',
    secondaryColor: '#34363a',
    textureType: 'solid',
    pricePerM2: 2400,
    pricePerML_Saia: 380,
    pricePerML_Frontao: 350,
    roughness: 0.4,
    metalness: 0.1
  }
];
