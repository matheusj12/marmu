import { ProjectType, CountertopConfig, StaircaseConfig, StoneMaterial, ClientQuote } from '../types';

export interface BudgetResult {
  subtotal: number;
  discountAmount: number;
  total: number;
  baseAreaM2: number;
  mlFrontao: number;
  mlSaia: number;
  fabricationCost: number;
}

export function calcBudgets(
  projectType: ProjectType,
  countertop: CountertopConfig,
  staircase: StaircaseConfig,
  material: StoneMaterial,
  quote: ClientQuote
): BudgetResult {
  let baseAreaM2 = 0;
  let mlSaia = 0;
  let mlFrontao = 0;
  let fabricationCost = 0;

  if (projectType === 'pia') {
    const wM = countertop.width / 100;
    const dM = countertop.depth / 100;

    baseAreaM2 = wM * dM;
    mlFrontao = wM;
    if (countertop.frontaoLeft) mlFrontao += dM;
    if (countertop.frontaoRight) mlFrontao += dM;

    mlSaia = wM + (2 * dM);

    if (countertop.hasSink) {
      fabricationCost += countertop.sinkType === 'esculpida' ? 450 : 150;
    }
    if (countertop.hasCooktop) {
      fabricationCost += 120;
    }
  } else {
    const swM = staircase.stepWidth / 100;
    const sdM = staircase.stepDepth / 100;
    const shM = staircase.stepHeight / 100;
    const steps = staircase.stepsCount;

    baseAreaM2 = steps * (swM * sdM);
    if (staircase.style !== 'flutuante') {
      baseAreaM2 += steps * (swM * (shM - 0.02));
    }
    if (staircase.hasSkirting) {
      mlFrontao = steps * (sdM + shM);
    }
    fabricationCost = steps * 40;
  }

  const stoneCost = baseAreaM2 * material.pricePerM2;
  const frontaoCost = mlFrontao * material.pricePerML_Frontao;
  const saiaCost = mlSaia * material.pricePerML_Saia;

  const subtotal = stoneCost + frontaoCost + saiaCost + fabricationCost;
  const discountAmount = subtotal * (quote.discount / 100);
  const total = subtotal - discountAmount + Number(quote.tax || 0);

  return { subtotal, discountAmount, total, baseAreaM2, mlFrontao, mlSaia, fabricationCost };
}
