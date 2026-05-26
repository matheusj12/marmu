import { CountertopConfig, StaircaseConfig, ProjectType, StoneMaterial } from '../types';

interface Editor2DProps {
  type: ProjectType;
  countertop: CountertopConfig;
  staircase: StaircaseConfig;
  material: StoneMaterial;
}

export default function Editor2D({ type, countertop, staircase, material }: Editor2DProps) {
  
  if (type === 'pia') {
    // --- COUNTERTOP BLUEPRINT MATH ---
    // Let's scale centimeter measurements to pixels
    const svgWidth = 600;
    const svgHeight = 350;
    
    // Fit drawing comfortably inside bounds of 450x200
    const marginX = 80;
    const marginY = 80;
    
    // Determine scale dynamically: max length 300cm fitted in 440px
    const scaleX = 440 / 300;
    // Max width 120cm fitted in 200px
    const scaleY = 190 / 120;
    
    // Apply uniform coordinate scale to prevent distortion
    const scale = Math.min(scaleX, scaleY);
    
    const wPx = countertop.width * scale;
    const dPx = countertop.depth * scale;
    
    // Calculate top-left of the slab
    const x0 = marginX + (440 - wPx) / 2;
    const y0 = marginY + (190 - dPx) / 2;
    
    // Sink cutout parameters
    const swPx = countertop.sinkWidth * scale;
    const sdPx = countertop.sinkDepth * scale;
    const maxOffset = countertop.width / 2 - countertop.sinkWidth / 2 - 15;
    const actualSinkOffsetCentimeters = Math.max(-maxOffset, Math.min(maxOffset, (countertop.sinkX / 100) * maxOffset));
    const sinkXPx = x0 + (countertop.width / 2 + actualSinkOffsetCentimeters) * scale;
    const sinkYPx = y0 + dPx / 2; // centered vertically

    // Cooktop cutout parameters
    const cwPx = countertop.cooktopWidth * scale;
    const cdPx = countertop.cooktopDepth * scale;
    const maxCooktopOffset = countertop.width / 2 - countertop.cooktopWidth / 2 - 15;
    const actualCooktopOffsetCentimeters = Math.max(-maxCooktopOffset, Math.min(maxCooktopOffset, (countertop.cooktopX / 100) * maxCooktopOffset));
    const cooktopXPx = x0 + (countertop.width / 2 + actualCooktopOffsetCentimeters) * scale;
    const cooktopYPx = y0 + dPx / 2; // centered vertically

    return (
      <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Blueprint CAD</span>
            <h4 className="text-sm font-semibold text-white">Detalhamento Técnico de Corte</h4>
          </div>
          <span className="text-[10px] bg-white/5 text-gray-400 font-mono px-2 py-1 rounded">
            Cotado em cm
          </span>
        </div>

        <div className="relative w-full overflow-x-auto flex justify-center">
          <svg 
            width={svgWidth} 
            height={svgHeight} 
            className="text-gray-400 font-mono text-[10px]"
            style={{ minWidth: '500px' }}
          >
            {/* Grid grid-background */}
            <defs>
              <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.04" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cadGrid)" rx="8" />

            {/* ---- MAIN STONE OUTLINE ---- */}
            {/* Draw backsplashes as dashed borders */}
            {countertop.frontaoHeight > 0 && (
              // Traseiro (Back)
              <line x1={x0} y1={y0 - 6} x2={x0 + wPx} y2={y0 - 6} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />
            )}
            {countertop.frontaoHeight > 0 && countertop.frontaoLeft && (
              // Esquerdo
              <line x1={x0 - 6} y1={y0} x2={x0 - 6} y2={y0 + dPx} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />
            )}
            {countertop.frontaoHeight > 0 && countertop.frontaoRight && (
              // Direito
              <line x1={x0 + wPx + 6} y1={y0} x2={x0 + wPx + 6} y2={y0 + dPx} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />
            )}

            {/* Main slab rectangle */}
            <rect 
              x={x0} 
              y={y0} 
              width={wPx} 
              height={dPx} 
              fill="#242835" 
              stroke="#94a3b8" 
              strokeWidth="2" 
            />

            {/* Polished Edge (Borda Polida / Acabamento Visível - Thick line) */}
            <line 
              x1={x0} y1={y0 + dPx} 
              x2={x0 + wPx} y2={y0 + dPx} 
              stroke="#f59e0b" 
              strokeWidth="3.5" 
            />
            {/* Left/Right exposed polished edges (if no lateral wall backsplash blocks them) */}
            {!countertop.frontaoLeft && (
              <line x1={x0} y1={y0} x2={x0} y2={y0 + dPx} stroke="#f59e0b" strokeWidth="2.5" />
            )}
            {!countertop.frontaoRight && (
              <line x1={x0 + wPx} y1={y0} x2={x0 + wPx} y2={y0 + dPx} stroke="#f59e0b" strokeWidth="2.5" />
            )}

            {/* ---- SINK POSITION CUTOUT ---- */}
            {countertop.hasSink && (
              <g>
                {/* Outlying dash centerlines */}
                <line x1={sinkXPx - swPx/2 - 20} y1={sinkYPx} x2={sinkXPx + swPx/2 + 20} y2={sinkYPx} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="4,4" />
                <line x1={sinkXPx} y1={sinkYPx - sdPx/2 - 20} x2={sinkXPx} y2={sinkYPx + sdPx/2 + 20} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="4,4" />
                
                {/* Secondary outline for lip */}
                <rect 
                  x={sinkXPx - swPx/2} 
                  y={sinkYPx - sdPx/2} 
                  width={swPx} 
                  height={sdPx} 
                  fill="#181a20" 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                  rx="4"
                />
                <rect 
                  x={sinkXPx - swPx/2 + 4} 
                  y={sinkYPx - sdPx/2 + 4} 
                  width={swPx - 8} 
                  height={sdPx - 8} 
                  fill="none" 
                  stroke="#475569" 
                  strokeWidth="1" 
                  rx="2"
                />
                
                {/* Water tap location symbol */}
                <circle cx={sinkXPx} cy={sinkYPx - sdPx/2 - 12} r="5" stroke="#ef4444" strokeWidth="1" fill="#ef4444" fillOpacity="0.2" />
                <path d={`M ${sinkXPx} ${sinkYPx - sdPx/2 - 12} c 0 -8, 6 -8, 6 -1`} fill="none" stroke="#ef4444" strokeWidth="1.5" />

                {/* Annotation */}
                <text x={sinkXPx} y={sinkYPx + 4} textAnchor="middle" fill="#ef4444" fontWeight="bold" className="text-[9px]">
                  {countertop.sinkType === 'esculpida' ? 'CUBA ESCULPIDA' : 'CUBA INOX'}
                </text>
                <text x={sinkXPx} y={sinkYPx + 14} textAnchor="middle" fill="#475569" className="text-[8px]">
                  {countertop.sinkWidth} x {countertop.sinkDepth}cm
                </text>
              </g>
            )}

            {/* ---- COOKTOP POSITION CUTOUT ---- */}
            {countertop.hasCooktop && (
              <g>
                {/* Outlying dash centerlines */}
                <line x1={cooktopXPx - cwPx/2 - 15} y1={cooktopYPx} x2={cooktopXPx + cwPx/2 + 15} y2={cooktopYPx} stroke="#10b981" strokeWidth="0.5" strokeDasharray="4,4" />
                <line x1={cooktopXPx} y1={cooktopYPx - cdPx/2 - 15} x2={cooktopXPx} y2={cooktopYPx + cdPx/2 + 15} stroke="#10b981" strokeWidth="0.5" strokeDasharray="4,4" />

                <rect 
                  x={cooktopXPx - cwPx/2} 
                  y={cooktopYPx - cdPx/2} 
                  width={cwPx} 
                  height={cdPx} 
                  fill="#0c0e12" 
                  stroke="#10b981" 
                  strokeWidth="1.5" 
                />
                {/* Core zones */}
                <circle cx={cooktopXPx - cwPx/4} cy={cooktopYPx} r="7" stroke="#334155" strokeWidth="1" fill="none" />
                <circle cx={cooktopXPx + cwPx/4} cy={cooktopYPx} r="9" stroke="#334155" strokeWidth="1" fill="none" />

                {/* Annotation */}
                <text x={cooktopXPx} y={cooktopYPx + 4} textAnchor="middle" fill="#10b981" fontWeight="bold" className="text-[9px]">
                  COOKTOP (CORTE)
                </text>
                <text x={cooktopXPx} y={cooktopYPx + 14} textAnchor="middle" fill="#475569" className="text-[8px]">
                  {countertop.cooktopWidth} x {countertop.cooktopDepth}cm
                </text>
              </g>
            )}

            {/* ---- DIMENSION LEADERS (Linhas de Cota) ---- */}
            {/* 1. Overall Width (Largura Total - Top) */}
            <g stroke="#94a3b8" strokeWidth="0.75">
              {/* Left extension line */}
              <line x1={x0} y1={y0} x2={x0} y2={y0 - 45} />
              {/* Right extension line */}
              <line x1={x0 + wPx} y1={y0} x2={x0 + wPx} y2={y0 - 45} />
              {/* Dimension line with arrows */}
              <line x1={x0 + 8} y1={y0 - 35} x2={x0 + wPx - 8} y2={y0 - 35} />
              {/* Arrowheads */}
              <polygon points={`${x0},${y0-35} ${x0+8},${y0-38} ${x0+8},${y0-32}`} fill="#94a3b8" stroke="none" />
              <polygon points={`${x0+wPx},${y0-35} ${x0+wPx-8},${y0-38} ${x0+wPx-8},${y0-32}`} fill="#94a3b8" stroke="none" />
            </g>
            <rect x={x0 + wPx / 2 - 25} y={y0 - 42} width="50" height="14" fill="#0f1115" rx="3" />
            <text x={x0 + wPx/2} y={y0 - 32} fill="#ffffff" textAnchor="middle" className="text-[10px] font-bold">
              {countertop.width} cm
            </text>

            {/* 2. Overall Depth (Profundidade Total - Left) */}
            <g stroke="#94a3b8" strokeWidth="0.75">
              {/* Top extension line */}
              <line x1={x0} y1={y0} x2={x0 - 45} y2={y0} />
              {/* Bottom extension line */}
              <line x1={x0} y1={y0 + dPx} x2={x0 - 45} y2={y0 + dPx} />
              {/* Dimension line with arrows */}
              <line x1={x0 - 35} y1={y0 + 8} x2={x0 - 35} y2={y0 + dPx - 8} />
              {/* Arrowheads */}
              <polygon points={`${x0-35},${y0} ${x0-38},${y0+8} ${x0-32},${y0+8}`} fill="#94a3b8" stroke="none" />
              <polygon points={`${x0-35},${y0+dPx} ${x0-38},${y0+dPx-8} ${x0-32},${y0+dPx-8}`} fill="#94a3b8" stroke="none" />
            </g>
            <rect x={x0 - 58} y={y0 + dPx / 2 - 7} width="46" height="14" fill="#0f1115" rx="3" />
            <text 
              x={x0 - 35} 
              y={y0 + dPx/2 + 4} 
              fill="#ffffff" 
              textAnchor="middle" 
              className="text-[10px] font-bold"
              transform={`rotate(-90 ${x0 - 35} ${y0 + dPx/2})`}
            >
              {countertop.depth} cm
            </text>

            {/* 3. Small Spec annotations underneath */}
            <g transform={`translate(${x0}, ${y0 + dPx + 35})`} className="text-[9px]">
              <text x="0" y="0" fill="#f59e0b" fontWeight="bold">➖ Espessura: {countertop.thickness}cm</text>
              <text x="0" y="12" fill="#3b82f6" fontWeight="bold">📶 Frontão Traseiro: {countertop.frontaoHeight}cm {countertop.frontaoLeft && countertop.frontaoRight ? '(Com Lat. Esq/Dir)' : countertop.frontaoLeft ? '(Com Lat. Esq)' : countertop.frontaoRight ? '(Com Lat. Dir)' : '(Apenas Traseiro)'}</text>
              <text x="0" y="24" fill="#f59e0b" fontWeight="bold">📐 Saia Frontal: {countertop.saiaHeight}cm</text>
            </g>

          </svg>
        </div>
      </div>
    );
  } else {
    // --- STAIRCASE BLUEPRINT MATH ---
    // Render side cross-section (Vista lateral corte técnico) of the steps
    const svgWidth = 600;
    const svgHeight = 350;
    
    // Safety calculations: 2 * Espelho + Pisada
    const safetyIndex = (2 * staircase.stepHeight) + staircase.stepDepth;
    const isBlondelMatch = safetyIndex >= 63 && safetyIndex <= 64;

    // Draw parameters
    const startX = 60;
    const startY = 280;
    const stepsCount = staircase.stepsCount;
    
    // Adapt scales depending on steps count to avoid overflowing bounds (fit in 450x220)
    const scale = Math.min(
      380 / (stepsCount * staircase.stepDepth),
      220 / (stepsCount * staircase.stepHeight)
    );

    const sValDepth = staircase.stepDepth * scale;
    const sValHeight = staircase.stepHeight * scale;
    const tPx = staircase.thickness * scale;

    return (
      <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Corte Lateral Cad</span>
            <h4 className="text-sm font-semibold text-white">Elevação Ergonométrica da Escada</h4>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold ${isBlondelMatch ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              🔒 Fórmula Blondel: {safetyIndex} cm ({isBlondelMatch ? 'Ideal' : 'Forte Atenuante'})
            </span>
          </div>
        </div>

        <div className="relative w-full overflow-x-auto flex justify-center">
          <svg 
            width={svgWidth} 
            height={svgHeight} 
            className="text-gray-400 font-mono text-[10px]"
            style={{ minWidth: '500px' }}
          >
            {/* Background grids */}
            <rect width="100%" height="100%" fill="url(#cadGrid)" rx="8" />

            {/* Floor and wall limits */}
            <line x1={startX - 20} y1={startY} x2={svgWidth - 40} y2={startY} stroke="#1e293b" strokeWidth="1.5" />
            <line x1={startX + stepsCount * sValDepth} y1={startY} x2={startX + stepsCount * sValDepth} y2={startY - stepsCount * sValHeight - 40} stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />

            {/* DRAW STEPS IN CROSS-SECTION LOOP */}
            {Array.from({ length: stepsCount }).map((_, i) => {
              const xPos = startX + i * sValDepth;
              const yPos = startY - i * sValHeight;

              return (
                <g key={i}>
                  {/* Step Tread (Piso em corte) */}
                  <rect 
                    x={xPos} 
                    y={yPos - tPx} 
                    width={sValDepth} 
                    height={tPx} 
                    fill="#334155" 
                    stroke="#94a3b8" 
                    strokeWidth="1.2" 
                  />

                  {/* Step Riser (Espelho em corte) */}
                  {staircase.style !== 'flutuante' && (
                    <rect 
                      x={xPos + sValDepth - tPx} 
                      y={yPos} 
                      width={tPx} 
                      height={sValHeight - tPx} 
                      fill="#222e3f" 
                      stroke="#475569" 
                      strokeWidth="1" 
                    />
                  )}

                  {/* Skirting line (Decorative line above) */}
                  {staircase.hasSkirting && (
                    <rect
                      x={xPos}
                      y={yPos - tPx - (12 * scale)}
                      width={sValDepth}
                      height={4 * scale}
                      fill="#1e293b"
                      opacity="0.5"
                    />
                  )}

                  {/* Step index label */}
                  <text x={xPos + sValDepth/2} y={yPos - tPx - 6} fill="#3b82f6" textAnchor="middle" className="text-[8px] font-semibold">
                    D{i+1}
                  </text>
                </g>
              );
            })}

            {/* ---- MEASUREMENTS & SAFETY CALCULATIONS ---- */}
            {/* 1. Step Depth (Pisada - annotated on the first step) */}
            {stepsCount > 0 && (
              <g stroke="#94a3b8" strokeWidth="0.75" transform={`translate(${startX}, ${startY + 20})`}>
                <line x1={0} y1={0} x2={0} y2={-15} />
                <line x1={sValDepth} y1={0} x2={sValDepth} y2={-15} />
                <line x1={4} y1={-8} x2={sValDepth - 4} y2={-8} />
                <polygon points={`0,-8 5,-10 5,-6`} fill="#94a3b8" stroke="none" />
                <polygon points={`${sValDepth},-8 ${sValDepth-5},-10 ${sValDepth-5},-6`} fill="#94a3b8" stroke="none" />
                <text x={sValDepth/2} y={-14} fill="#ffffff" textAnchor="middle" stroke="none" className="text-[8px] font-bold">
                  {staircase.stepDepth} cm (Pisada)
                </text>
              </g>
            )}

            {/* 2. Step Riser Height (Espelho - annotated on the first step vertical) */}
            {stepsCount > 0 && (
              <g stroke="#94a3b8" strokeWidth="0.75" transform={`translate(${startX - 23}, ${startY - sValHeight})`}>
                <line x1={0} y1={0} x2={18} y2={0} />
                <line x1={0} y1={sValHeight} x2={18} y2={sValHeight} />
                <line x1={5} y1={4} x2={5} y2={sValHeight - 4} />
                <polygon points={`5,0 3,5 7,5`} fill="#94a3b8" stroke="none" />
                <polygon points={`5,${sValHeight} 3,${sValHeight-5} 7,${sValHeight-5}`} fill="#94a3b8" stroke="none" />
                <text 
                  x={2} 
                  y={sValHeight/2} 
                  fill="#ffffff" 
                  stroke="none" 
                  textAnchor="middle" 
                  className="text-[8px] font-bold"
                  transform={`rotate(-90 2 ${sValHeight/2})`}
                >
                  {staircase.stepHeight} (Espelho)
                </text>
              </g>
            )}

            {/* Annotated total length */}
            <g stroke="#64748b" strokeWidth="0.75">
              <line x1={startX} y1={startY + 38} x2={startX} y2={startY + 50} />
              <line x1={startX + stepsCount*sValDepth} y1={startY} x2={startX + stepsCount*sValDepth} y2={startY + 50} />
              <line x1={startX} y1={startY + 45} x2={startX + stepsCount*sValDepth} y2={startY + 45} />
            </g>
            <text x={startX + (stepsCount*sValDepth)/2} y={startY + 42} fill="#94a3b8" textAnchor="middle" className="text-[9px] font-bold">
              Comprimento Total Projetado: {staircase.stepsCount * staircase.stepDepth}cm
            </text>

            {/* Annotations specifications */}
            <g transform={`translate(280, 50)`} className="text-[9px] font-mono leading-5 space-y-4">
              <text x="0" y="0" fill="#f59e0b" fontWeight="bold">📐 Altura Total: {staircase.stepsCount * staircase.stepHeight} cm</text>
              <text x="0" y="15" fill="#3b82f6" fontWeight="bold">🪵 Modelo: {staircase.style === 'cascata' ? 'Cascata Plena' : staircase.style === 'flutuante' ? 'Degraus Flutuantes Suspensos' : 'Plisada (Mitered)'}</text>
              <text x="0" y="30" fill="#a8a29e" fontWeight="bold">🧱 Acabamento Rodapé: {staircase.hasSkirting ? 'Rodapé Lateral Ativo (10cm)' : 'Sem Acabamentos'}</text>
              <text x="0" y="45" fill="#10b981" fontWeight="bold">🛠️ Largura Útil do Lance: {staircase.stepWidth} cm</text>
            </g>

          </svg>
        </div>
      </div>
    );
  }
}
