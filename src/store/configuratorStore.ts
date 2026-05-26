import { create } from 'zustand'
import { STONE_MATERIALS } from '../materials'
import type {
  ProjectType,
  StoneMaterial,
  CountertopConfig,
  StaircaseConfig,
  ClientQuote,
} from '../types'

interface ConfiguratorState {
  projectType: ProjectType
  selectedMaterial: StoneMaterial
  materialFilter: string
  autoRotate: boolean
  showInvoice: boolean

  countertop: CountertopConfig
  staircase: StaircaseConfig
  quote: ClientQuote

  setProjectType: (v: ProjectType) => void
  setSelectedMaterial: (v: StoneMaterial) => void
  setMaterialFilter: (v: string) => void
  setAutoRotate: (v: boolean) => void
  setShowInvoice: (v: boolean) => void
  setCountertop: (v: Partial<CountertopConfig>) => void
  setStaircase: (v: Partial<StaircaseConfig>) => void
  setQuote: (v: Partial<ClientQuote>) => void
  resetConfigurator: () => void
}

const defaultCountertop: CountertopConfig = {
  width: 180,
  depth: 60,
  thickness: 2,
  saiaHeight: 4,
  frontaoHeight: 10,
  frontaoLeft: true,
  frontaoRight: false,
  cornerStyle: 'reto',
  hasSink: true,
  sinkType: 'inox_embutir',
  sinkWidth: 50,
  sinkDepth: 40,
  sinkX: 0,
  hasCooktop: false,
  cooktopWidth: 70,
  cooktopDepth: 50,
  cooktopX: 40,
}

const defaultStaircase: StaircaseConfig = {
  style: 'cascata',
  stepsCount: 5,
  stepWidth: 110,
  stepDepth: 30,
  stepHeight: 18,
  thickness: 2,
  hasSkirting: true,
  skirtingStyle: 'reto',
}

const defaultQuote: ClientQuote = {
  clientName: '',
  clientPhone: '',
  clientAddress: '',
  discount: 5,
  tax: 0,
  observations: '',
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  projectType: 'pia',
  selectedMaterial: STONE_MATERIALS[0],
  materialFilter: 'todos',
  autoRotate: false,
  showInvoice: false,
  countertop: defaultCountertop,
  staircase: defaultStaircase,
  quote: defaultQuote,

  setProjectType: (v) => set({ projectType: v }),
  setSelectedMaterial: (v) => set({ selectedMaterial: v }),
  setMaterialFilter: (v) => set({ materialFilter: v }),
  setAutoRotate: (v) => set({ autoRotate: v }),
  setShowInvoice: (v) => set({ showInvoice: v }),
  setCountertop: (v) => set((s) => ({ countertop: { ...s.countertop, ...v } })),
  setStaircase: (v) => set((s) => ({ staircase: { ...s.staircase, ...v } })),
  setQuote: (v) => set((s) => ({ quote: { ...s.quote, ...v } })),
  resetConfigurator: () =>
    set({
      projectType: 'pia',
      selectedMaterial: STONE_MATERIALS[0],
      materialFilter: 'todos',
      countertop: defaultCountertop,
      staircase: defaultStaircase,
      quote: defaultQuote,
    }),
}))
