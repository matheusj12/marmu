import type { ProjectType, CountertopConfig, StaircaseConfig, StoneMaterial } from '../types'

export interface PriceBreakdown {
  baseAreaM2:      number   // m² líquido da pedra
  mlSaia:          number   // metros lineares de saia
  mlFrontao:       number   // metros lineares de frontão
  stoneCost:       number   // custo da pedra (m² × preço)
  saiaCost:        number   // custo da saia (ml × preço)
  frontaoCost:     number   // custo do frontão (ml × preço)
  fabricationCost: number   // mão de obra / elementos extras
  subtotal:        number
  discountPct:     number
  discountValue:   number
  tax:             number   // frete / acréscimo
  total:           number
}

export interface PriceInput {
  projectType:    ProjectType
  countertop:     CountertopConfig
  staircase:      StaircaseConfig
  material:       StoneMaterial
  discountPct?:   number   // padrão 0
  tax?:           number   // padrão 0
}

export function calcPrice(input: PriceInput): PriceBreakdown {
  const { projectType, countertop, staircase, material, discountPct = 0, tax = 0 } = input

  let baseAreaM2 = 0
  let mlSaia     = 0
  let mlFrontao  = 0
  let fabricationCost = 0

  if (projectType === 'pia') {
    const wM = countertop.width  / 100
    const dM = countertop.depth  / 100

    baseAreaM2 = wM * dM
    mlFrontao  = wM
    if (countertop.frontaoLeft)  mlFrontao += dM
    if (countertop.frontaoRight) mlFrontao += dM
    mlSaia = wM + 2 * dM

    if (countertop.hasSink)    fabricationCost += countertop.sinkType === 'esculpida' ? 450 : 150
    if (countertop.hasCooktop) fabricationCost += 120

  } else {
    const swM   = staircase.stepWidth  / 100
    const sdM   = staircase.stepDepth  / 100
    const shM   = staircase.stepHeight / 100
    const steps = staircase.stepsCount

    baseAreaM2 = steps * (swM * sdM)
    if (staircase.style !== 'flutuante') baseAreaM2 += steps * (swM * (shM - 0.02))
    if (staircase.hasSkirting)           mlFrontao   = steps * (sdM + shM)
    fabricationCost = steps * 40
  }

  const stoneCost   = baseAreaM2 * material.pricePerM2
  const frontaoCost = mlFrontao  * material.pricePerML_Frontao
  const saiaCost    = mlSaia     * material.pricePerML_Saia

  const subtotal      = stoneCost + frontaoCost + saiaCost + fabricationCost
  const discountValue = subtotal * (discountPct / 100)
  const total         = subtotal - discountValue + tax

  return {
    baseAreaM2, mlSaia, mlFrontao,
    stoneCost, saiaCost, frontaoCost, fabricationCost,
    subtotal, discountPct, discountValue, tax, total,
  }
}

// Formata moeda BRL
export function fmtBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
