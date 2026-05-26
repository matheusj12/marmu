import { CountertopConfig, StaircaseConfig, ProjectType, StoneMaterial, ClientQuote } from '../../types';
import Editor2D from '../Editor2D';

interface BudgetInvoiceProps {
  type: ProjectType;
  countertop: CountertopConfig;
  staircase: StaircaseConfig;
  material: StoneMaterial;
  quote: ClientQuote;
  onClose: () => void;
}

export default function BudgetInvoice({
  type,
  countertop,
  staircase,
  material,
  quote,
  onClose,
}: BudgetInvoiceProps) {
  
  // --- DETAILED PRICING COMPUTATIONS ---
  const computations = () => {
    let baseAreaM2 = 0;
    let mlSaia = 0;
    let mlFrontao = 0;
    let laborCutCount = 0;
    let fabricationCost = 0;

    if (type === 'pia') {
      const wM = countertop.width / 100;
      const dM = countertop.depth / 100;
      const shM = countertop.saiaHeight / 100;
      const fhM = countertop.frontaoHeight / 100;

      // 1. Base stone plate surface area (m²)
      baseAreaM2 = wM * dM;
      
      // 2. Linear meters of Backsplashes (Frontão)
      // Always has back, optionally left and right
      mlFrontao = wM;
      if (countertop.frontaoLeft) mlFrontao += dM;
      if (countertop.frontaoRight) mlFrontao += dM;

      // 3. Linear meters of mitered aprons (Saia)
      // Front apron + both sides
      mlSaia = wM + (2 * dM);

      // 4. Labor costs for cuts / hollowings
      if (countertop.hasSink) {
        laborCutCount += 1;
        fabricationCost += countertop.sinkType === 'esculpida' ? 450 : 150; // sculpted ramp costs more
      }
      if (countertop.hasCooktop) {
        laborCutCount += 1;
        fabricationCost += 120; // standard induction cooktop polishing
      }
    } else {
      // Stair math
      const swM = staircase.stepWidth / 100;
      const sdM = staircase.stepDepth / 100;
      const shM = staircase.stepHeight / 100;
      const steps = staircase.stepsCount;

      // 1. Total horizontal stone area (m²)
      baseAreaM2 = steps * (swM * sdM);
      
      // 2. Total vertical stone risers area (m²)
      if (staircase.style !== 'flutuante') {
        const riserAreaM2 = steps * (swM * (shM - 0.02));
        baseAreaM2 += riserAreaM2;
      }

      // 3. Skirting boards (Rodapé lateral)
      if (staircase.hasSkirting) {
        // Runs along steps and risers (approx 1 linear meter of trim per 2 steps)
        mlFrontao = steps * (sdM + shM);
      }

      fabricationCost = steps * 40; // R$40 polish fee per stair step
    }

    const stoneCost = baseAreaM2 * material.pricePerM2;
    const frontaoCost = mlFrontao * material.pricePerML_Frontao;
    const saiaCost = mlSaia * material.pricePerML_Saia;

    const subtotal = stoneCost + frontaoCost + saiaCost + fabricationCost;
    const discountAmount = subtotal * (quote.discount / 100);
    const total = subtotal - discountAmount + Number(quote.tax || 0);

    return {
      baseAreaM2,
      mlFrontao,
      mlSaia,
      stoneCost,
      frontaoCost,
      saiaCost,
      fabricationCost,
      subtotal,
      discountAmount,
      total,
    };
  };

  const cost = computations();
  const today = new Date().toLocaleDateString('pt-BR');
  const quoteId = Math.floor(100000 + Math.random() * 900000);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex justify-center p-4 sm:p-6 print:p-0 print:bg-white print:relative print:inset-auto">
      
      <div className="w-full max-w-4xl bg-[#121214] border border-white/10 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative print:border-none print:shadow-none print:bg-white print:text-black print:p-0">
        
        {/* --- ACTIONS HEADER (Hidden on print) --- */}
        <div className="flex justify-between items-center bg-black/20 p-4 -mx-8 -mt-8 border-b border-white/10 rounded-t-3xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-display">Proposta Comercial & Detalhes de Corte</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-lg shadow-blue-500/20 uppercase tracking-widest font-display"
            >
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="bg-white/5 hover:bg-white/10 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-white/5"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* --- PRINTABLE BODY --- */}
        <div className="flex flex-col gap-6 print:text-black print:bg-white">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-200 dark:border-white/5 pb-6 gap-4 print:border-gray-300 print:text-black">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">M</span>
                <h1 className="text-xl font-bold tracking-tight text-white print:text-black">MARMU DESIGN CO.</h1>
              </div>
              <p className="text-xs text-gray-400 print:text-gray-600">Alta Precisão em Rochas Ornamentais</p>
              <p className="text-[10px] text-gray-500 print:text-gray-500 mt-1">
                Rodovia AC 23, KM 4 - Distrito Industrial, PR<br />
                Contato: (41) 3224-8890 | contato@marmudesign.com
              </p>
            </div>

            <div className="text-right sm:text-right flex flex-col items-end">
              <span className="text-[10px] bg-blue-500/10 text-blue-400 print:bg-gray-100 print:text-gray-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Orçamento Técnico
              </span>
              <h2 className="text-lg font-mono font-bold mt-2 text-white print:text-black">Nº #{quoteId}</h2>
              <p className="text-[11px] text-gray-400 print:text-gray-600 mt-1">Data de Emissão: {today}</p>
              <p className="text-[11px] text-gray-450 print:text-gray-550">Validade: 15 dias</p>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 print:bg-gray-50 print:border-gray-200 print:text-black">
            <div>
              <h4 className="text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-2 print:text-gray-500">Dados do Cliente</h4>
              <p className="text-sm font-semibold text-white print:text-black">{quote.clientName || 'Cliente Consumidor Final'}</p>
              <p className="text-xs text-gray-400 print:text-gray-600 mt-1">📞 {quote.clientPhone || '(41) 99999-0000'}</p>
              <p className="text-xs text-gray-400 print:text-gray-650 mt-1">📍 {quote.clientAddress || 'Curitiba, PR'}</p>
            </div>
            
            <div className="md:border-l md:border-white/5 md:pl-6 print:border-gray-200">
              <h4 className="text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-2 print:text-gray-500">Material Contratado</h4>
              <p className="text-sm font-semibold text-blue-400 print:text-blue-800">{material.name}</p>
              <p className="text-xs text-gray-400 print:text-gray-650 mt-0.5">
                Categoria: <span className="capitalize">{material.category}</span>
              </p>
              <p className="text-xs text-gray-400 print:text-gray-650">
                Tipo do Projeto: <span className="uppercase">{type === 'pia' ? 'Bancada de Cozinha/Banheiro' : 'Escadaria Helicoidal/Acessos'}</span>
              </p>
            </div>
          </div>

          {/* Details CAD Embed (Print version shows diagram cleanly) */}
          <div className="p-1 border border-white/5 rounded-2xl print:bg-white print:border-gray-300">
            <h3 className="text-[10px] font-bold text-gray-450 uppercase tracking-widest px-4 pt-3 print:text-gray-600">
              Croqui Esquemático do Projeto
            </h3>
            <div className="transform scale-90 origin-top">
              <Editor2D type={type} countertop={countertop} staircase={staircase} material={material} />
            </div>
          </div>

          {/* Itemized Invoice Table */}
          <div className="mt-4 flex flex-col">
            <h3 className="text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-3 print:text-gray-600">
              Detalhamento de Valores
            </h3>
            
            <div className="overflow-hidden border border-white/5 rounded-2xl print:border-gray-200">
              <table className="w-full text-left text-xs text-gray-300 print:text-black">
                <thead className="bg-white/5 text-[10px] font-bold uppercase text-gray-400 border-b border-white/5 print:bg-gray-100 print:text-gray-700 print:border-gray-300">
                  <tr>
                    <th className="px-5 py-3">Especificação</th>
                    <th className="px-5 py-3 text-center">Quantidade</th>
                    <th className="px-5 py-3 text-right">Valor Unid (M² ou ML)</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-gray-200">
                  
                  {/* Base Material Row */}
                  <tr>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-white print:text-black">Área da Pedra Principal</span>
                      <p className="text-[10px] text-gray-400 print:text-gray-600">Placas recortadas sob-medida</p>
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono">
                      {cost.baseAreaM2.toFixed(3)} m²
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      R$ {material.pricePerM2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold">
                      R$ {cost.stoneCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Leftover / Accessory linear items depending on type */}
                  {type === 'pia' ? (
                    <>
                      {/* Frontão */}
                      {cost.mlFrontao > 0 && (
                        <tr>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-white print:text-black">Frontões (Espelhos Laterais / Traseiro)</span>
                            <p className="text-[10px] text-gray-400 print:text-gray-600">Altura: {countertop.frontaoHeight}cm • Acabamento polido</p>
                          </td>
                          <td className="px-5 py-3.5 text-center font-mono">
                            {cost.mlFrontao.toFixed(2)} ml
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono">
                            R$ {material.pricePerML_Frontao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-semibold">
                            R$ {cost.frontaoCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}

                      {/* Saia */}
                      {cost.mlSaia > 0 && (
                        <tr>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-white print:text-black">Saias de Borda (Mitered Edge / 45º)</span>
                            <p className="text-[10px] text-gray-400 print:text-gray-600">Altura: {countertop.saiaHeight}cm • Emenda imperceptível</p>
                          </td>
                          <td className="px-5 py-3.5 text-center font-mono">
                            {cost.mlSaia.toFixed(2)} ml
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono">
                            R$ {material.pricePerML_Saia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-semibold">
                            R$ {cost.saiaCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Stair special trims */}
                      {staircase.hasSkirting && (
                        <tr>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-white print:text-black">Rodapé Lateral Jacaré / Plinto</span>
                            <p className="text-[10px] text-gray-400 print:text-gray-600">Acabamento decorativo de parede</p>
                          </td>
                          <td className="px-5 py-3.5 text-center font-mono">
                            {cost.mlFrontao.toFixed(2)} ml
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono">
                            R$ {material.pricePerML_Frontao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-semibold">
                            R$ {cost.frontaoCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                    </>
                  )}

                  {/* Cutout processes & fabrication */}
                  {cost.fabricationCost > 0 && (
                    <tr>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-white print:text-black">Processo de Acabamento e Recortes</span>
                        <p className="text-[10px] text-gray-400 print:text-gray-600">
                          {type === 'pia' 
                            ? `Cortes especiais polidos (Cuba/Cooktop)` 
                            : `Bisoteamento de cantos em ${staircase.stepsCount} degraus`
                          }
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono">
                        Atividade
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono">
                        Taxa Pacote
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold">
                        R$ {cost.fabricationCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary Breakdown */}
          <div className="flex flex-col sm:flex-row justify-end gap-6 items-end mt-4">
            
            <div className="w-full sm:w-80 bg-white/5 p-5 rounded-2xl border border-white/5 space-y-2.5 print:bg-transparent print:border-none print:p-0">
              <div className="flex justify-between text-xs text-gray-400 print:text-gray-600">
                <span>Subtotal Projetado:</span>
                <span className="font-mono text-white print:text-black">R$ {cost.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              
              {quote.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400 print:text-emerald-700">
                  <span>Desconto Aplicado ({quote.discount}%):</span>
                  <span className="font-mono">- R$ {cost.discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {Number(quote.tax) > 0 && (
                <div className="flex justify-between text-xs text-gray-450 print:text-gray-600">
                  <span>Frete / Instalação:</span>
                  <span className="font-mono text-white print:text-black">R$ {Number(quote.tax).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="border-t border-white/10 pt-3 flex justify-between items-baseline print:border-gray-300">
                <span className="text-sm font-bold text-gray-200 print:text-gray-800">Total Final Líquido:</span>
                <span className="text-xl font-mono font-black text-blue-400 print:text-blue-900">
                  R$ {cost.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

          </div>

          {/* Guidelines Observations Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-6 text-[10px] text-gray-450 leading-relaxed print:border-gray-300 print:text-gray-605">
            <div>
              <h5 className="font-bold text-gray-300 uppercase tracking-wider mb-1 print:text-gray-800">Termos e Condições Comerciais</h5>
              <p>1. O prazo de entrega estimado das peças é de 10 a 15 dias úteis a contar após aferição física final das medidas na obra.</p>
              <p>2. Variações orgânicas de tonalidades e veias em pedras naturais são propriedades autênticas e não constituem defeito de fabricação.</p>
              <p>3. Condições de Pagamento: 50% de sinal no aceite da proposta / 50% na finalização da instalação.</p>
            </div>
            
            <div>
              <h5 className="font-bold text-gray-300 uppercase tracking-wider mb-1 print:text-gray-800">Observações Gerais</h5>
              <p className="italic text-gray-400 print:text-gray-600">
                {quote.observations || 'Nenhuma observação descrita. Projeto segue as diretivas aprovadas na modelagem técnica tridimensional.'}
              </p>
              
              <div className="mt-8 flex justify-between gap-4 items-center print:mt-12">
                <div className="flex-1 border-t border-gray-400 pt-1 text-center">
                  <span className="text-[9px]">Representante Marmu</span>
                </div>
                <div className="flex-1 border-t border-gray-400 pt-1 text-center">
                  <span className="text-[9px]">Aceite do Cliente</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
