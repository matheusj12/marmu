import { useRef, useEffect, useCallback } from 'react';
import { CountertopConfig, StaircaseConfig, ProjectType, StoneMaterial } from '../types';

interface Editor2DProps {
  type: ProjectType;
  countertop: CountertopConfig;
  staircase: StaircaseConfig;
  material: StoneMaterial;
  onCountertopChange?: (c: CountertopConfig) => void;
  onStaircaseChange?: (s: StaircaseConfig) => void;
}

type DragMode =
  | { type: 'width';   startMX: number; startVal: number }
  | { type: 'depth';   startMY: number; startVal: number }
  | { type: 'corner';  startMX: number; startMY: number; startW: number; startD: number }
  | { type: 'sink';    startMX: number; startVal: number; scale: number; slabX0: number; slabW: number; sinkW: number }
  | { type: 'cooktop'; startMX: number; startVal: number; scale: number; slabX0: number; slabW: number; ctW: number };

const SNAP = 5; // cm
const snap = (v: number, s: number) => Math.round(v / s) * s;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function Editor2D({
  type, countertop, staircase, material,
  onCountertopChange, onStaircaseChange,
}: Editor2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<DragMode | null>(null);
  const svgW = 600, svgH = 350;

  // ── SVG pixel coordinates ──────────────────────────────────────────────
  const marginX = 80, marginY = 80;
  const scale = Math.min(440 / 300, 190 / 120);
  const wPx = countertop.width * scale;
  const dPx = countertop.depth * scale;
  const x0 = marginX + (440 - wPx) / 2;
  const y0 = marginY + (190 - dPx) / 2;

  const maxSinkOffset = countertop.width / 2 - countertop.sinkWidth / 2 - 15;
  const sinkOffCm = clamp((countertop.sinkX / 100) * maxSinkOffset, -maxSinkOffset, maxSinkOffset);
  const sinkXPx = x0 + (countertop.width / 2 + sinkOffCm) * scale;
  const sinkYPx = y0 + dPx / 2;
  const swPx = countertop.sinkWidth * scale;
  const sdPx = countertop.sinkDepth * scale;

  const maxCtOffset = countertop.width / 2 - countertop.cooktopWidth / 2 - 15;
  const ctOffCm = clamp((countertop.cooktopX / 100) * maxCtOffset, -maxCtOffset, maxCtOffset);
  const ctXPx = x0 + (countertop.width / 2 + ctOffCm) * scale;
  const ctYPx = y0 + dPx / 2;
  const cwPx = countertop.cooktopWidth * scale;
  const cdPx = countertop.cooktopDepth * scale;

  // ── Coordinate helpers ─────────────────────────────────────────────────
  const svgCoords = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const rx = svgW / rect.width;
    const ry = svgH / rect.height;
    return { x: (clientX - rect.left) * rx, y: (clientY - rect.top) * ry };
  }, []);

  // ── Global drag handlers ───────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current || !onCountertopChange) return;
      const { x, y } = svgCoords(e.clientX, e.clientY);
      const d = drag.current;

      if (d.type === 'width') {
        const delta = (x - d.startMX) / scale;
        const w = clamp(snap(d.startVal + delta, SNAP), 60, 300);
        onCountertopChange({ ...countertop, width: w });
      } else if (d.type === 'depth') {
        const delta = (y - d.startMY) / scale;
        const dep = clamp(snap(d.startVal + delta, SNAP), 40, 120);
        onCountertopChange({ ...countertop, depth: dep });
      } else if (d.type === 'corner') {
        const dw = (x - d.startMX) / scale;
        const dd = (y - d.startMY) / scale;
        const w = clamp(snap(d.startW + dw, SNAP), 60, 300);
        const dep = clamp(snap(d.startD + dd, SNAP), 40, 120);
        onCountertopChange({ ...countertop, width: w, depth: dep });
      } else if (d.type === 'sink') {
        const deltaX = (x - d.startMX) / d.scale;
        const rawPct = d.startVal + (deltaX / (d.slabW / 2)) * 100;
        const sinkX = clamp(snap(rawPct, 1), -100, 100);
        onCountertopChange({ ...countertop, sinkX });
      } else if (d.type === 'cooktop') {
        const deltaX = (x - d.startMX) / d.scale;
        const rawPct = d.startVal + (deltaX / (d.slabW / 2)) * 100;
        const cooktopX = clamp(snap(rawPct, 1), -100, 100);
        onCountertopChange({ ...countertop, cooktopX });
      }
    };

    const onUp = () => { drag.current = null; };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [countertop, onCountertopChange, scale, svgCoords]);

  // ── Handle mousedown starters ──────────────────────────────────────────
  const startWidth = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x } = svgCoords(e.clientX, e.clientY);
    drag.current = { type: 'width', startMX: x, startVal: countertop.width };
  };
  const startDepth = (e: React.MouseEvent) => {
    e.preventDefault();
    const { y } = svgCoords(e.clientX, e.clientY);
    drag.current = { type: 'depth', startMY: y, startVal: countertop.depth };
  };
  const startCorner = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = svgCoords(e.clientX, e.clientY);
    drag.current = { type: 'corner', startMX: x, startMY: y, startW: countertop.width, startD: countertop.depth };
  };
  const startSink = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x } = svgCoords(e.clientX, e.clientY);
    drag.current = { type: 'sink', startMX: x, startVal: countertop.sinkX, scale, slabX0: x0, slabW: wPx, sinkW: swPx };
  };
  const startCooktop = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x } = svgCoords(e.clientX, e.clientY);
    drag.current = { type: 'cooktop', startMX: x, startVal: countertop.cooktopX, scale, slabX0: x0, slabW: wPx, ctW: cwPx };
  };

  if (type === 'pia') {
    return (
      <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 shadow-xl select-none">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Blueprint CAD</span>
            <h4 className="text-sm font-semibold text-white">Detalhamento Técnico de Corte</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono px-2 py-1 rounded">
              ↔ Arraste as arestas
            </span>
            <span className="text-[9px] bg-white/5 text-gray-400 font-mono px-2 py-1 rounded">
              Cotado em cm
            </span>
          </div>
        </div>

        <div className="relative w-full overflow-x-auto flex justify-center">
          <svg
            ref={svgRef}
            width={svgW}
            height={svgH}
            className="text-gray-400 font-mono text-[10px]"
            style={{ minWidth: '500px', cursor: 'default' }}
          >
            <defs>
              <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.04" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cadGrid)" rx="8" />

            {/* Frontão lines */}
            {countertop.frontaoHeight > 0 && (
              <line x1={x0} y1={y0 - 6} x2={x0 + wPx} y2={y0 - 6} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />
            )}
            {countertop.frontaoHeight > 0 && countertop.frontaoLeft && (
              <line x1={x0 - 6} y1={y0} x2={x0 - 6} y2={y0 + dPx} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />
            )}
            {countertop.frontaoHeight > 0 && countertop.frontaoRight && (
              <line x1={x0 + wPx + 6} y1={y0} x2={x0 + wPx + 6} y2={y0 + dPx} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />
            )}

            {/* Main slab */}
            <rect x={x0} y={y0} width={wPx} height={dPx} fill="#242835" stroke="#94a3b8" strokeWidth="2" />

            {/* Polished edges */}
            <line x1={x0} y1={y0 + dPx} x2={x0 + wPx} y2={y0 + dPx} stroke="#f59e0b" strokeWidth="3.5" />
            {!countertop.frontaoLeft  && <line x1={x0}        y1={y0} x2={x0}        y2={y0 + dPx} stroke="#f59e0b" strokeWidth="2.5" />}
            {!countertop.frontaoRight && <line x1={x0 + wPx}  y1={y0} x2={x0 + wPx}  y2={y0 + dPx} stroke="#f59e0b" strokeWidth="2.5" />}

            {/* ── Sink ── */}
            {countertop.hasSink && (
              <g>
                <line x1={sinkXPx - swPx/2 - 20} y1={sinkYPx} x2={sinkXPx + swPx/2 + 20} y2={sinkYPx} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="4,4" />
                <line x1={sinkXPx} y1={sinkYPx - sdPx/2 - 20} x2={sinkXPx} y2={sinkYPx + sdPx/2 + 20} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="4,4" />
                <rect x={sinkXPx - swPx/2} y={sinkYPx - sdPx/2} width={swPx} height={sdPx}
                  fill="#181a20" stroke="#ef4444" strokeWidth="1.5" rx="4"
                  style={{ cursor: 'ew-resize' }}
                  onMouseDown={startSink}
                />
                <rect x={sinkXPx - swPx/2 + 4} y={sinkYPx - sdPx/2 + 4} width={swPx - 8} height={sdPx - 8}
                  fill="none" stroke="#475569" strokeWidth="1" rx="2" style={{ pointerEvents: 'none' }}
                />
                <circle cx={sinkXPx} cy={sinkYPx - sdPx/2 - 12} r="5" stroke="#ef4444" strokeWidth="1" fill="#ef4444" fillOpacity="0.2" />
                <text x={sinkXPx} y={sinkYPx + 4} textAnchor="middle" fill="#ef4444" fontWeight="bold" style={{ pointerEvents: 'none', fontSize: 9 }}>
                  {countertop.sinkType === 'esculpida' ? 'CUBA ESCULPIDA' : 'CUBA INOX'}
                </text>
                <text x={sinkXPx} y={sinkYPx + 14} textAnchor="middle" fill="#475569" style={{ pointerEvents: 'none', fontSize: 8 }}>
                  {countertop.sinkWidth} x {countertop.sinkDepth}cm
                </text>
              </g>
            )}

            {/* ── Cooktop ── */}
            {countertop.hasCooktop && (
              <g>
                <line x1={ctXPx - cwPx/2 - 15} y1={ctYPx} x2={ctXPx + cwPx/2 + 15} y2={ctYPx} stroke="#10b981" strokeWidth="0.5" strokeDasharray="4,4" />
                <line x1={ctXPx} y1={ctYPx - cdPx/2 - 15} x2={ctXPx} y2={ctYPx + cdPx/2 + 15} stroke="#10b981" strokeWidth="0.5" strokeDasharray="4,4" />
                <rect x={ctXPx - cwPx/2} y={ctYPx - cdPx/2} width={cwPx} height={cdPx}
                  fill="#0c0e12" stroke="#10b981" strokeWidth="1.5"
                  style={{ cursor: 'ew-resize' }}
                  onMouseDown={startCooktop}
                />
                <circle cx={ctXPx - cwPx/4} cy={ctYPx} r="7" stroke="#334155" strokeWidth="1" fill="none" style={{ pointerEvents: 'none' }} />
                <circle cx={ctXPx + cwPx/4} cy={ctYPx} r="9" stroke="#334155" strokeWidth="1" fill="none" style={{ pointerEvents: 'none' }} />
                <text x={ctXPx} y={ctYPx + 4} textAnchor="middle" fill="#10b981" fontWeight="bold" style={{ pointerEvents: 'none', fontSize: 9 }}>
                  COOKTOP (CORTE)
                </text>
                <text x={ctXPx} y={ctYPx + 14} textAnchor="middle" fill="#475569" style={{ pointerEvents: 'none', fontSize: 8 }}>
                  {countertop.cooktopWidth} x {countertop.cooktopDepth}cm
                </text>
              </g>
            )}

            {/* ── Dimension leaders ── */}
            {/* Width top */}
            <g stroke="#94a3b8" strokeWidth="0.75">
              <line x1={x0}        y1={y0} x2={x0}        y2={y0 - 45} />
              <line x1={x0 + wPx}  y1={y0} x2={x0 + wPx}  y2={y0 - 45} />
              <line x1={x0 + 8}    y1={y0 - 35} x2={x0 + wPx - 8} y2={y0 - 35} />
              <polygon points={`${x0},${y0-35} ${x0+8},${y0-38} ${x0+8},${y0-32}`} fill="#94a3b8" stroke="none" />
              <polygon points={`${x0+wPx},${y0-35} ${x0+wPx-8},${y0-38} ${x0+wPx-8},${y0-32}`} fill="#94a3b8" stroke="none" />
            </g>
            <rect x={x0 + wPx/2 - 25} y={y0 - 42} width="50" height="14" fill="#0f1115" rx="3" />
            <text x={x0 + wPx/2} y={y0 - 32} fill="#ffffff" textAnchor="middle" fontWeight="bold" style={{ fontSize: 10 }}>
              {countertop.width} cm
            </text>
            {/* Depth left */}
            <g stroke="#94a3b8" strokeWidth="0.75">
              <line x1={x0} y1={y0}       x2={x0 - 45} y2={y0} />
              <line x1={x0} y1={y0 + dPx} x2={x0 - 45} y2={y0 + dPx} />
              <line x1={x0 - 35} y1={y0 + 8} x2={x0 - 35} y2={y0 + dPx - 8} />
              <polygon points={`${x0-35},${y0} ${x0-38},${y0+8} ${x0-32},${y0+8}`} fill="#94a3b8" stroke="none" />
              <polygon points={`${x0-35},${y0+dPx} ${x0-38},${y0+dPx-8} ${x0-32},${y0+dPx-8}`} fill="#94a3b8" stroke="none" />
            </g>
            <rect x={x0 - 58} y={y0 + dPx/2 - 7} width="46" height="14" fill="#0f1115" rx="3" />
            <text x={x0 - 35} y={y0 + dPx/2 + 4} fill="#ffffff" textAnchor="middle" fontWeight="bold"
              style={{ fontSize: 10 }}
              transform={`rotate(-90 ${x0 - 35} ${y0 + dPx/2})`}
            >
              {countertop.depth} cm
            </text>

            {/* ── Spec annotations ── */}
            <g transform={`translate(${x0}, ${y0 + dPx + 35})`}>
              <text x="0" y="0"  fill="#f59e0b" fontWeight="bold" style={{ fontSize: 9 }}>— Espessura: {countertop.thickness}cm</text>
              <text x="0" y="12" fill="#3b82f6" fontWeight="bold" style={{ fontSize: 9 }}>
                ■ Frontão Traseiro: {countertop.frontaoHeight}cm {countertop.frontaoLeft && countertop.frontaoRight ? '(Com Lat. Esq/Dir)' : countertop.frontaoLeft ? '(Com Lat. Esq)' : countertop.frontaoRight ? '(Com Lat. Dir)' : '(Apenas Traseiro)'}
              </text>
              <text x="0" y="24" fill="#f59e0b" fontWeight="bold" style={{ fontSize: 9 }}>⌐ Saia Frontal: {countertop.saiaHeight}cm</text>
            </g>

            {/* ══ INTERACTIVE DRAG HANDLES ══════════════════════════════ */}

            {/* Right edge midpoint → width */}
            <g onMouseDown={startWidth} style={{ cursor: 'ew-resize' }}>
              <rect x={x0 + wPx - 5} y={y0 + dPx/2 - 20} width={18} height={40} fill="transparent" />
              <circle cx={x0 + wPx} cy={y0 + dPx/2} r={6} fill="#3b82f6" stroke="#fff" strokeWidth="1.5" opacity="0.9" />
              <line x1={x0 + wPx - 3} y1={y0 + dPx/2 - 5} x2={x0 + wPx - 3} y2={y0 + dPx/2 + 5} stroke="#fff" strokeWidth="1.2" />
              <line x1={x0 + wPx + 3} y1={y0 + dPx/2 - 5} x2={x0 + wPx + 3} y2={y0 + dPx/2 + 5} stroke="#fff" strokeWidth="1.2" />
            </g>

            {/* Bottom edge midpoint → depth */}
            <g onMouseDown={startDepth} style={{ cursor: 'ns-resize' }}>
              <rect x={x0 + wPx/2 - 20} y={y0 + dPx - 5} width={40} height={18} fill="transparent" />
              <circle cx={x0 + wPx/2} cy={y0 + dPx} r={6} fill="#3b82f6" stroke="#fff" strokeWidth="1.5" opacity="0.9" />
              <line x1={x0 + wPx/2 - 5} y1={y0 + dPx - 3} x2={x0 + wPx/2 + 5} y2={y0 + dPx - 3} stroke="#fff" strokeWidth="1.2" />
              <line x1={x0 + wPx/2 - 5} y1={y0 + dPx + 3} x2={x0 + wPx/2 + 5} y2={y0 + dPx + 3} stroke="#fff" strokeWidth="1.2" />
            </g>

            {/* Bottom-right corner → width + depth */}
            <g onMouseDown={startCorner} style={{ cursor: 'nwse-resize' }}>
              <rect x={x0 + wPx - 10} y={y0 + dPx - 10} width={20} height={20} fill="transparent" />
              <circle cx={x0 + wPx} cy={y0 + dPx} r={7} fill="#6366f1" stroke="#fff" strokeWidth="1.5" opacity="0.95" />
              <text x={x0 + wPx} y={y0 + dPx + 4} textAnchor="middle" fill="#fff" style={{ fontSize: 8, pointerEvents: 'none' }}>↗</text>
            </g>

            {/* Top-left corner (decorative, no drag) */}
            <circle cx={x0}       cy={y0}       r={4} fill="#475569" stroke="#94a3b8" strokeWidth="1" style={{ pointerEvents: 'none' }} />
            {/* Top-right corner (decorative) */}
            <circle cx={x0 + wPx} cy={y0}       r={4} fill="#475569" stroke="#94a3b8" strokeWidth="1" style={{ pointerEvents: 'none' }} />
            {/* Bottom-left corner (decorative) */}
            <circle cx={x0}       cy={y0 + dPx} r={4} fill="#475569" stroke="#94a3b8" strokeWidth="1" style={{ pointerEvents: 'none' }} />

          </svg>
        </div>
      </div>
    );
  }

  // ── STAIRCASE (unchanged) ─────────────────────────────────────────────
  const stairSvgW = 600, stairSvgH = 350;
  const safetyIndex = (2 * staircase.stepHeight) + staircase.stepDepth;
  const isBlondelMatch = safetyIndex >= 63 && safetyIndex <= 64;
  const startX = 60, startY = 280;
  const stepsCount = staircase.stepsCount;
  const stairScale = Math.min(380 / (stepsCount * staircase.stepDepth), 220 / (stepsCount * staircase.stepHeight));
  const sValDepth = staircase.stepDepth * stairScale;
  const sValHeight = staircase.stepHeight * stairScale;
  const tPx = staircase.thickness * stairScale;

  return (
    <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div>
          <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Corte Lateral CAD</span>
          <h4 className="text-sm font-semibold text-white">Elevação Ergonométrica da Escada</h4>
        </div>
        <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold ${isBlondelMatch ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
          Fórmula Blondel: {safetyIndex}cm ({isBlondelMatch ? 'Ideal' : 'Fora do Ideal'})
        </span>
      </div>
      <div className="relative w-full overflow-x-auto flex justify-center">
        <svg width={stairSvgW} height={stairSvgH} style={{ minWidth: '500px' }}>
          <defs>
            <pattern id="cadGrid2" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.04" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cadGrid2)" rx="8" />
          <line x1={startX - 20} y1={startY} x2={stairSvgW - 40} y2={startY} stroke="#1e293b" strokeWidth="1.5" />
          <line x1={startX + stepsCount * sValDepth} y1={startY} x2={startX + stepsCount * sValDepth} y2={startY - stepsCount * sValHeight - 40} stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
          {Array.from({ length: stepsCount }).map((_, i) => {
            const xPos = startX + i * sValDepth;
            const yPos = startY - i * sValHeight;
            return (
              <g key={i}>
                <rect x={xPos} y={yPos - tPx} width={sValDepth} height={tPx} fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
                {staircase.style !== 'flutuante' && (
                  <rect x={xPos + sValDepth - tPx} y={yPos} width={tPx} height={sValHeight - tPx} fill="#222e3f" stroke="#475569" strokeWidth="1" />
                )}
                {staircase.hasSkirting && (
                  <rect x={xPos} y={yPos - tPx - (12 * stairScale)} width={sValDepth} height={4 * stairScale} fill="#1e293b" opacity="0.5" />
                )}
                <text x={xPos + sValDepth/2} y={yPos - tPx - 6} fill="#3b82f6" textAnchor="middle" style={{ fontSize: 8, fontWeight: 600 }}>D{i+1}</text>
              </g>
            );
          })}
          {stepsCount > 0 && (
            <g stroke="#94a3b8" strokeWidth="0.75" transform={`translate(${startX}, ${startY + 20})`}>
              <line x1={0} y1={0} x2={0} y2={-15} />
              <line x1={sValDepth} y1={0} x2={sValDepth} y2={-15} />
              <line x1={4} y1={-8} x2={sValDepth - 4} y2={-8} />
              <polygon points={`0,-8 5,-10 5,-6`} fill="#94a3b8" stroke="none" />
              <polygon points={`${sValDepth},-8 ${sValDepth-5},-10 ${sValDepth-5},-6`} fill="#94a3b8" stroke="none" />
              <text x={sValDepth/2} y={-14} fill="#ffffff" textAnchor="middle" stroke="none" style={{ fontSize: 8, fontWeight: 700 }}>
                {staircase.stepDepth} cm (Pisada)
              </text>
            </g>
          )}
          {stepsCount > 0 && (
            <g stroke="#94a3b8" strokeWidth="0.75" transform={`translate(${startX - 23}, ${startY - sValHeight})`}>
              <line x1={0} y1={0} x2={18} y2={0} />
              <line x1={0} y1={sValHeight} x2={18} y2={sValHeight} />
              <line x1={5} y1={4} x2={5} y2={sValHeight - 4} />
              <polygon points={`5,0 3,5 7,5`} fill="#94a3b8" stroke="none" />
              <polygon points={`5,${sValHeight} 3,${sValHeight-5} 7,${sValHeight-5}`} fill="#94a3b8" stroke="none" />
              <text x={2} y={sValHeight/2} fill="#ffffff" stroke="none" textAnchor="middle"
                style={{ fontSize: 8, fontWeight: 700 }}
                transform={`rotate(-90 2 ${sValHeight/2})`}
              >
                {staircase.stepHeight} (Espelho)
              </text>
            </g>
          )}
          <g stroke="#64748b" strokeWidth="0.75">
            <line x1={startX} y1={startY + 38} x2={startX} y2={startY + 50} />
            <line x1={startX + stepsCount*sValDepth} y1={startY} x2={startX + stepsCount*sValDepth} y2={startY + 50} />
            <line x1={startX} y1={startY + 45} x2={startX + stepsCount*sValDepth} y2={startY + 45} />
          </g>
          <text x={startX + (stepsCount*sValDepth)/2} y={startY + 42} fill="#94a3b8" textAnchor="middle" style={{ fontSize: 9, fontWeight: 700 }}>
            Comprimento Total: {staircase.stepsCount * staircase.stepDepth}cm
          </text>
          <g transform="translate(280, 50)">
            <text x="0" y="0"  fill="#f59e0b" fontWeight="bold" style={{ fontSize: 9 }}>Altura Total: {staircase.stepsCount * staircase.stepHeight}cm</text>
            <text x="0" y="15" fill="#3b82f6" fontWeight="bold" style={{ fontSize: 9 }}>
              Modelo: {staircase.style === 'cascata' ? 'Cascata Plena' : staircase.style === 'flutuante' ? 'Degraus Flutuantes' : 'Plisada'}
            </text>
            <text x="0" y="30" fill="#a8a29e" fontWeight="bold" style={{ fontSize: 9 }}>Rodapé: {staircase.hasSkirting ? 'Lateral Ativo' : 'Sem acabamento'}</text>
            <text x="0" y="45" fill="#10b981" fontWeight="bold" style={{ fontSize: 9 }}>Largura do Lance: {staircase.stepWidth}cm</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
