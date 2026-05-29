import { useRef, useEffect, useCallback, useState } from 'react';
import { CountertopConfig, StaircaseConfig, ProjectType, StoneMaterial, Vertex2D, Cutout2D } from '../types';

interface Editor2DProps {
  type: ProjectType;
  countertop: CountertopConfig;
  staircase: StaircaseConfig;
  material: StoneMaterial;
  onCountertopChange?: (c: CountertopConfig) => void;
  onStaircaseChange?: (s: StaircaseConfig) => void;
}

const SNAP = 5;
const snap = (v: number, s: number) => Math.round(v / s) * s;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const edgeLen = (a: Vertex2D, b: Vertex2D) =>
  Math.round(Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2));

type RectDrag =
  | { type: 'width';   startMX: number; startVal: number }
  | { type: 'depth';   startMY: number; startVal: number }
  | { type: 'corner';  startMX: number; startMY: number; startW: number; startD: number }
  | { type: 'sink';    startMX: number; startVal: number; scale: number; slabW: number }
  | { type: 'cooktop'; startMX: number; startVal: number; scale: number; slabW: number };

type PolyDrag =
  | { type: 'vertex';       idx: number; startMX: number; startMY: number; startV: Vertex2D; polyScale: number }
  | { type: 'cutout-move';  id: number;  startMX: number; startMY: number; startC: Cutout2D; polyScale: number }
  | { type: 'cutout-resize';id: number;  corner: 'tl'|'tr'|'br'|'bl'; startMX: number; startMY: number; startC: Cutout2D; polyScale: number };

type DragState = RectDrag | PolyDrag | null;

const SVG_W = 600, SVG_H = 350;
const MARGIN_X = 80, MARGIN_Y = 80;
const RECT_SCALE = Math.min(440 / 300, 190 / 120);

export default function Editor2D({
  type, countertop, staircase, material,
  onCountertopChange, onStaircaseChange,
}: Editor2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<DragState>(null);
  const polyLayout = useRef({ scale: RECT_SCALE, ox: 0, oy: 0 });

  const freeMode = !!(countertop.vertices && countertop.vertices.length >= 3);
  const [selectedCutoutId, setSelectedCutoutId] = useState<number | null>(null);

  // ── Coordinate helpers ─────────────────────────────────────────────────
  const svgCoords = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (SVG_W / rect.width),
      y: (clientY - rect.top) * (SVG_H / rect.height),
    };
  }, []);

  // ── Rectangle mode layout ──────────────────────────────────────────────
  const rScale = RECT_SCALE;
  const wPx = countertop.width * rScale;
  const dPx = countertop.depth * rScale;
  const x0 = MARGIN_X + (440 - wPx) / 2;
  const y0 = MARGIN_Y + (190 - dPx) / 2;

  const maxSinkOff = countertop.width / 2 - countertop.sinkWidth / 2 - 15;
  const sinkOffCm = clamp((countertop.sinkX / 100) * maxSinkOff, -maxSinkOff, maxSinkOff);
  const sinkXPx = x0 + (countertop.width / 2 + sinkOffCm) * rScale;
  const sinkYPx = y0 + dPx / 2;
  const swPx = countertop.sinkWidth * rScale;
  const sdPx = countertop.sinkDepth * rScale;

  const maxCtOff = countertop.width / 2 - countertop.cooktopWidth / 2 - 15;
  const ctOffCm = clamp((countertop.cooktopX / 100) * maxCtOff, -maxCtOff, maxCtOff);
  const ctXPx = x0 + (countertop.width / 2 + ctOffCm) * rScale;
  const ctYPx = y0 + dPx / 2;
  const cwPx = countertop.cooktopWidth * rScale;
  const cdPx = countertop.cooktopDepth * rScale;

  // ── Polygon mode layout ────────────────────────────────────────────────
  const verts: Vertex2D[] = freeMode ? countertop.vertices! : [];

  let polyScale = RECT_SCALE, polyOX = x0, polyOY = y0;
  if (freeMode && verts.length >= 3) {
    const xs = verts.map(v => v.x), ys = verts.map(v => v.y);
    const bw = Math.max(...xs) - Math.min(...xs) || 1;
    const bh = Math.max(...ys) - Math.min(...ys) || 1;
    polyScale = Math.min(440 / bw, 190 / bh) * 0.85;
    polyOX = MARGIN_X + (440 - bw * polyScale) / 2 - Math.min(...xs) * polyScale;
    polyOY = MARGIN_Y + (190 - bh * polyScale) / 2 - Math.min(...ys) * polyScale;
    polyLayout.current = { scale: polyScale, ox: polyOX, oy: polyOY };
  }

  const toPx = (v: Vertex2D) => ({ x: polyOX + v.x * polyScale, y: polyOY + v.y * polyScale });
  const polyPath = freeMode ? verts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toPx(v).x} ${toPx(v).y}`).join(' ') + ' Z' : '';

  // ── Global drag ────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current || !onCountertopChange) return;
      const { x, y } = svgCoords(e.clientX, e.clientY);
      const d = drag.current;

      if (d.type === 'vertex') {
        const newVerts = [...(countertop.vertices ?? [])];
        newVerts[d.idx] = {
          x: snap(d.startV.x + (x - d.startMX) / d.polyScale, SNAP),
          y: snap(d.startV.y + (y - d.startMY) / d.polyScale, SNAP),
        };
        onCountertopChange({ ...countertop, vertices: newVerts });
      } else if (d.type === 'cutout-move') {
        const dx = (x - d.startMX) / d.polyScale, dy = (y - d.startMY) / d.polyScale;
        const xs = (countertop.vertices ?? []).map(v => v.x), ys2 = (countertop.vertices ?? []).map(v => v.y);
        const PAD = 5;
        const bMinX = Math.min(...xs) + PAD, bMaxX = Math.max(...xs) - d.startC.w - PAD;
        const bMinY = Math.min(...ys2) + PAD, bMaxY = Math.max(...ys2) - d.startC.h - PAD;
        const updated = (countertop.cutouts ?? []).map(c =>
          c.id === d.id ? {
            ...c,
            x: clamp(snap(d.startC.x + dx, SNAP), bMinX, bMaxX),
            y: clamp(snap(d.startC.y + dy, SNAP), bMinY, bMaxY),
          } : c
        );
        onCountertopChange({ ...countertop, cutouts: updated });
      } else if (d.type === 'cutout-resize') {
        const dx = (x - d.startMX) / d.polyScale, dy = (y - d.startMY) / d.polyScale;
        const c = d.startC;
        const xs = (countertop.vertices ?? []).map(v => v.x), ys2 = (countertop.vertices ?? []).map(v => v.y);
        const PAD = 5;
        const bMinX = Math.min(...xs) + PAD, bMaxX = Math.max(...xs) - PAD;
        const bMinY = Math.min(...ys2) + PAD, bMaxY = Math.max(...ys2) - PAD;
        let nx = c.x, ny = c.y, nw = c.w, nh = c.h;
        if (d.corner === 'br') { nw = clamp(Math.max(10, snap(c.w + dx, SNAP)), 10, bMaxX - c.x); nh = clamp(Math.max(10, snap(c.h + dy, SNAP)), 10, bMaxY - c.y); }
        if (d.corner === 'bl') { nx = clamp(snap(c.x + dx, SNAP), bMinX, c.x + c.w - 10); nw = Math.max(10, c.x + c.w - nx); nh = clamp(Math.max(10, snap(c.h + dy, SNAP)), 10, bMaxY - c.y); }
        if (d.corner === 'tr') { ny = clamp(snap(c.y + dy, SNAP), bMinY, c.y + c.h - 10); nw = clamp(Math.max(10, snap(c.w + dx, SNAP)), 10, bMaxX - c.x); nh = Math.max(10, c.y + c.h - ny); }
        if (d.corner === 'tl') { nx = clamp(snap(c.x + dx, SNAP), bMinX, c.x + c.w - 10); ny = clamp(snap(c.y + dy, SNAP), bMinY, c.y + c.h - 10); nw = Math.max(10, c.x + c.w - nx); nh = Math.max(10, c.y + c.h - ny); }
        const updated = (countertop.cutouts ?? []).map(ct =>
          ct.id === d.id ? { ...ct, x: nx, y: ny, w: nw, h: nh } : ct
        );
        onCountertopChange({ ...countertop, cutouts: updated });
      } else if (d.type === 'width') {
        onCountertopChange({ ...countertop, width: clamp(snap(d.startVal + (x - d.startMX) / rScale, SNAP), 60, 300) });
      } else if (d.type === 'depth') {
        onCountertopChange({ ...countertop, depth: clamp(snap(d.startVal + (y - d.startMY) / rScale, SNAP), 40, 120) });
      } else if (d.type === 'corner') {
        onCountertopChange({
          ...countertop,
          width: clamp(snap(d.startW + (x - d.startMX) / rScale, SNAP), 60, 300),
          depth: clamp(snap(d.startD + (y - d.startMY) / rScale, SNAP), 40, 120),
        });
      } else if (d.type === 'sink') {
        const rawPct = d.startVal + ((x - d.startMX) / d.scale) / (d.slabW / 2) * 100;
        onCountertopChange({ ...countertop, sinkX: clamp(snap(rawPct, 1), -100, 100) });
      } else if (d.type === 'cooktop') {
        const rawPct = d.startVal + ((x - d.startMX) / d.scale) / (d.slabW / 2) * 100;
        onCountertopChange({ ...countertop, cooktopX: clamp(snap(rawPct, 1), -100, 100) });
      }
    };
    const onUp = () => { drag.current = null; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [countertop, onCountertopChange, rScale, svgCoords]);

  // ── Keyboard: Delete/Backspace removes selected cutout ─────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCutoutId !== null && onCountertopChange) {
        onCountertopChange({ ...countertop, cutouts: (countertop.cutouts ?? []).filter(c => c.id !== selectedCutoutId) });
        setSelectedCutoutId(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCutoutId, countertop, onCountertopChange]);

  // ── Mode toggles ───────────────────────────────────────────────────────
  const enterFreeMode = () => {
    if (!onCountertopChange) return;
    const w = countertop.width, d = countertop.depth;
    onCountertopChange({ ...countertop, vertices: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: d }, { x: 0, y: d }] });
  };
  const exitFreeMode = () => {
    if (!onCountertopChange) return;
    const xs = verts.map(v => v.x), ys = verts.map(v => v.y);
    const bw = Math.max(...xs) - Math.min(...xs);
    const bh = Math.max(...ys) - Math.min(...ys);
    onCountertopChange({ ...countertop, width: clamp(snap(bw, SNAP), 60, 300), depth: clamp(snap(bh, SNAP), 40, 120), vertices: null });
  };
  const addCutout = () => {
    if (!onCountertopChange || verts.length < 3) return;
    const xs = verts.map(v => v.x), ys = verts.map(v => v.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const W = 30, H = 25; // tamanho padrão seguro
    const cx = snap((minX + maxX) / 2 - W / 2, SNAP);
    const cy = snap((minY + maxY) / 2 - H / 2, SNAP);
    const newCutout: Cutout2D = { id: Date.now(), x: cx, y: cy, w: W, h: H, label: 'Vão' };
    onCountertopChange({ ...countertop, cutouts: [...(countertop.cutouts ?? []), newCutout] });
  };
  const removeCutout = (id: number) => {
    if (!onCountertopChange) return;
    onCountertopChange({ ...countertop, cutouts: (countertop.cutouts ?? []).filter(c => c.id !== id) });
  };

  const addVertexOnEdge = (i: number) => {
    if (!onCountertopChange || !freeMode) return;
    const n = verts.length;
    const a = verts[i], b = verts[(i + 1) % n];
    const mid: Vertex2D = { x: snap((a.x + b.x) / 2, SNAP), y: snap((a.y + b.y) / 2, SNAP) };
    const newVerts = [...verts];
    newVerts.splice(i + 1, 0, mid);
    onCountertopChange({ ...countertop, vertices: newVerts });
  };
  const removeVertex = (i: number) => {
    if (!onCountertopChange || !freeMode || verts.length <= 3) return;
    const newVerts = verts.filter((_, idx) => idx !== i);
    onCountertopChange({ ...countertop, vertices: newVerts });
  };

  // ── Rectangle mode drag starters ──────────────────────────────────────
  const startWidth  = (e: React.MouseEvent) => { e.preventDefault(); const { x } = svgCoords(e.clientX, e.clientY); drag.current = { type: 'width',  startMX: x, startVal: countertop.width }; };
  const startDepth  = (e: React.MouseEvent) => { e.preventDefault(); const { y } = svgCoords(e.clientX, e.clientY); drag.current = { type: 'depth',  startMY: y, startVal: countertop.depth }; };
  const startCorner = (e: React.MouseEvent) => { e.preventDefault(); const { x, y } = svgCoords(e.clientX, e.clientY); drag.current = { type: 'corner', startMX: x, startMY: y, startW: countertop.width, startD: countertop.depth }; };
  const startSink   = (e: React.MouseEvent) => { e.preventDefault(); const { x } = svgCoords(e.clientX, e.clientY); drag.current = { type: 'sink',   startMX: x, startVal: countertop.sinkX,   scale: rScale, slabW: wPx }; };
  const startCooktop= (e: React.MouseEvent) => { e.preventDefault(); const { x } = svgCoords(e.clientX, e.clientY); drag.current = { type: 'cooktop',startMX: x, startVal: countertop.cooktopX,scale: rScale, slabW: wPx }; };

  if (type !== 'pia') {
    // ── STAIRCASE ────────────────────────────────────────────────────────
    const safetyIndex = (2 * staircase.stepHeight) + staircase.stepDepth;
    const isBlondelMatch = safetyIndex >= 63 && safetyIndex <= 64;
    const startX = 60, startY = 280, stepsCount = staircase.stepsCount;
    const sc = Math.min(380 / (stepsCount * staircase.stepDepth), 220 / (stepsCount * staircase.stepHeight));
    const svD = staircase.stepDepth * sc, svH = staircase.stepHeight * sc, tPxS = staircase.thickness * sc;
    return (
      <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Corte Lateral CAD</span>
            <h4 className="text-sm font-semibold text-white">Elevação Ergonométrica da Escada</h4>
          </div>
          <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold ${isBlondelMatch ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            Blondel: {safetyIndex}cm ({isBlondelMatch ? 'Ideal' : 'Fora do Ideal'})
          </span>
        </div>
        <div className="w-full overflow-x-auto flex justify-center">
          <svg width={SVG_W} height={SVG_H} style={{ minWidth: '500px' }}>
            <defs><pattern id="g2" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#fff" strokeWidth="0.5" strokeOpacity="0.04" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#g2)" rx="8" />
            <line x1={startX - 20} y1={startY} x2={SVG_W - 40} y2={startY} stroke="#1e293b" strokeWidth="1.5" />
            {Array.from({ length: stepsCount }).map((_, i) => {
              const xP = startX + i * svD, yP = startY - i * svH;
              return (
                <g key={i}>
                  <rect x={xP} y={yP - tPxS} width={svD} height={tPxS} fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
                  {staircase.style !== 'flutuante' && <rect x={xP + svD - tPxS} y={yP} width={tPxS} height={svH - tPxS} fill="#222e3f" stroke="#475569" strokeWidth="1" />}
                  <text x={xP + svD / 2} y={yP - tPxS - 6} fill="#3b82f6" textAnchor="middle" style={{ fontSize: 8, fontWeight: 600 }}>D{i + 1}</text>
                </g>
              );
            })}
            <text x={startX + (stepsCount * svD) / 2} y={startY + 42} fill="#94a3b8" textAnchor="middle" style={{ fontSize: 9 }}>
              Total: {staircase.stepsCount * staircase.stepDepth}cm · Altura: {staircase.stepsCount * staircase.stepHeight}cm · Lance: {staircase.stepWidth}cm
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // ── PIA / BANCADA ─────────────────────────────────────────────────────
  return (
    <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 shadow-xl select-none">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div>
          <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Blueprint CAD</span>
          <h4 className="text-sm font-semibold text-white">Detalhamento Técnico de Corte</h4>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          {onCountertopChange && (
            freeMode ? (
              <>
                <button
                  onClick={addCutout}
                  className="text-[9px] bg-orange-600 hover:bg-orange-500 text-white font-bold px-2.5 py-1 rounded border border-orange-400/30 transition-all cursor-pointer"
                  title="Adicionar vão/recorte interno"
                >
                  + Vão
                </button>
                <button
                  onClick={exitFreeMode}
                  className="text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1 rounded border border-indigo-400/30 transition-all cursor-pointer"
                  title="Voltar ao modo retângulo"
                >
                  ▦ Retângulo
                </button>
              </>
            ) : (
              <button
                onClick={enterFreeMode}
                className="text-[9px] bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1 rounded border border-purple-400/30 transition-all cursor-pointer"
                title="Editar forma livremente"
              >
                ⬡ Forma Livre
              </button>
            )
          )}
          {freeMode ? (
            <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono px-2 py-1 rounded">
              Arraste vértices · clique aresta p/ adicionar · 2× p/ remover
            </span>
          ) : (
            <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono px-2 py-1 rounded">
              ↔ Arraste as arestas
            </span>
          )}
          <span className="text-[9px] bg-white/5 text-gray-400 font-mono px-2 py-1 rounded">Cotado em cm</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto flex justify-center">
        <svg ref={svgRef} width={SVG_W} height={SVG_H} style={{ minWidth: '500px', cursor: 'default' }} onClick={() => setSelectedCutoutId(null)}>
          <defs>
            <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#fff" strokeWidth="0.5" strokeOpacity="0.04" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cadGrid)" rx="8" />

          {/* ══ FREE POLYGON MODE ══════════════════════════════════════ */}
          {freeMode && verts.length >= 3 && (() => {
            const n = verts.length;
            return (
              <g>
                {/* Fill */}
                <path d={polyPath} fill="#242835" stroke="#94a3b8" strokeWidth="2" />

                {/* Polished edge (bottom-most edge) */}
                {(() => {
                  const maxY = Math.max(...verts.map(v => v.y));
                  const bottomVerts = verts.filter(v => v.y >= maxY - SNAP);
                  if (bottomVerts.length >= 2) {
                    const sv1 = toPx(bottomVerts[0]), sv2 = toPx(bottomVerts[bottomVerts.length - 1]);
                    return <line x1={sv1.x} y1={sv1.y} x2={sv2.x} y2={sv2.y} stroke="#f59e0b" strokeWidth="3.5" />;
                  }
                  return null;
                })()}

                {/* Edge lines + midpoint add-vertex handles */}
                {verts.map((v, i) => {
                  const next = verts[(i + 1) % n];
                  const sv1 = toPx(v), sv2 = toPx(next);
                  const mx = (sv1.x + sv2.x) / 2, my = (sv1.y + sv2.y) / 2;
                  const len = edgeLen(v, next);
                  const angle = Math.atan2(sv2.y - sv1.y, sv2.x - sv1.x) * 180 / Math.PI;
                  const labelFlip = Math.abs(angle) > 90;
                  return (
                    <g key={`edge-${i}`}>
                      {/* Dimension label */}
                      <g transform={`translate(${mx},${my}) rotate(${labelFlip ? angle + 180 : angle})`}>
                        <rect x={-16} y={-14} width="32" height="12" fill="#0f1115" rx="2" opacity="0.85" />
                        <text x={0} y={-5} textAnchor="middle" fill="#e2e8f0" style={{ fontSize: 9, fontWeight: 700 }}>{len} cm</text>
                      </g>
                      {/* Midpoint add-vertex handle */}
                      <circle
                        cx={mx} cy={my} r={5}
                        fill="#22c55e" stroke="#fff" strokeWidth="1" opacity="0.75"
                        style={{ cursor: 'copy' }}
                        onClick={() => addVertexOnEdge(i)}
                      />
                    </g>
                  );
                })}

                {/* ── Cutout (vão) handles ── */}
                {(countertop.cutouts ?? []).map(cut => {
                  const px = toPx({ x: cut.x, y: cut.y });
                  const pw = cut.w * polyScale, ph = cut.h * polyScale;
                  const corners: { key: 'tl'|'tr'|'br'|'bl'; cx: number; cy: number; cursor: string }[] = [
                    { key: 'tl', cx: px.x,       cy: px.y,       cursor: 'nwse-resize' },
                    { key: 'tr', cx: px.x + pw,   cy: px.y,       cursor: 'nesw-resize' },
                    { key: 'br', cx: px.x + pw,   cy: px.y + ph,  cursor: 'nwse-resize' },
                    { key: 'bl', cx: px.x,         cy: px.y + ph,  cursor: 'nesw-resize' },
                  ];
                  return (
                    <g key={`cut-${cut.id}`}>
                      {/* Fill — clipped out visually */}
                      <rect
                        x={px.x} y={px.y} width={pw} height={ph}
                        fill="#0f1115"
                        stroke={selectedCutoutId === cut.id ? '#fbbf24' : '#f97316'}
                        strokeWidth={selectedCutoutId === cut.id ? 2.5 : 1.5}
                        strokeDasharray="5,3"
                        style={{ cursor: 'move' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedCutoutId(cut.id); }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedCutoutId(cut.id);
                          const { x, y } = svgCoords(e.clientX, e.clientY);
                          drag.current = { type: 'cutout-move', id: cut.id, startMX: x, startMY: y, startC: { ...cut }, polyScale };
                        }}
                      />
                      {selectedCutoutId === cut.id && (
                        <text x={px.x + pw/2} y={px.y - 6} textAnchor="middle" fill="#fbbf24" style={{ fontSize: 8, fontWeight: 700, pointerEvents: 'none' }}>
                          ⌫ Delete para remover
                        </text>
                      )}
                      {/* Label + remove button */}
                      <text x={px.x + pw/2} y={px.y + ph/2 - 4} textAnchor="middle" fill="#fb923c" style={{ fontSize: 9, fontWeight: 700, pointerEvents: 'none' }}>
                        {cut.label ?? 'Vão'}
                      </text>
                      <text x={px.x + pw/2} y={px.y + ph/2 + 8} textAnchor="middle" fill="#64748b" style={{ fontSize: 8, pointerEvents: 'none' }}>
                        {cut.w}×{cut.h} cm
                      </text>
                      {/* × remove */}
                      <g onClick={() => removeCutout(cut.id)} style={{ cursor: 'pointer' }}>
                        <circle cx={px.x + pw - 6} cy={px.y + 6} r={7} fill="#ef4444" opacity="0.85" />
                        <text x={px.x + pw - 6} y={px.y + 10} textAnchor="middle" fill="#fff" style={{ fontSize: 10, fontWeight: 700, pointerEvents: 'none' }}>×</text>
                      </g>
                      {/* Corner resize handles */}
                      {corners.map(co => (
                        <circle
                          key={co.key} cx={co.cx} cy={co.cy} r={5}
                          fill="#f97316" stroke="#fff" strokeWidth="1" opacity="0.9"
                          style={{ cursor: co.cursor }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const { x, y } = svgCoords(e.clientX, e.clientY);
                            drag.current = { type: 'cutout-resize', id: cut.id, corner: co.key, startMX: x, startMY: y, startC: { ...cut }, polyScale };
                          }}
                        />
                      ))}
                    </g>
                  );
                })}

                {/* Vertex handles */}
                {verts.map((v, i) => {
                  const sv = toPx(v);
                  return (
                    <g key={`v-${i}`}>
                      {/* Larger invisible hit area */}
                      <circle
                        cx={sv.x} cy={sv.y} r={10} fill="transparent"
                        style={{ cursor: 'move' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const { x, y } = svgCoords(e.clientX, e.clientY);
                          drag.current = { type: 'vertex', idx: i, startMX: x, startMY: y, startV: { ...v }, polyScale };
                        }}
                        onDoubleClick={() => removeVertex(i)}
                      />
                      <circle cx={sv.x} cy={sv.y} r={6} fill="#6366f1" stroke="#fff" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />
                      {/* Vertex index */}
                      <text x={sv.x} y={sv.y - 10} textAnchor="middle" fill="#a5b4fc" style={{ fontSize: 8, pointerEvents: 'none' }}>V{i + 1}</text>
                    </g>
                  );
                })}

                {/* Bounding box dimensions */}
                {(() => {
                  const xs = verts.map(v => v.x), ys = verts.map(v => v.y);
                  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
                  const p1 = toPx({ x: minX, y: minY }), p2 = toPx({ x: maxX, y: minY }), p3 = toPx({ x: minX, y: maxY });
                  return (
                    <g stroke="#475569" strokeWidth="0.5" strokeDasharray="3,3">
                      {/* Top bbox arrow */}
                      <line x1={p1.x} y1={p1.y - 30} x2={p2.x} y2={p1.y - 30} stroke="#64748b" strokeWidth="1" strokeDasharray="none" />
                      <rect x={(p1.x + p2.x)/2 - 22} y={p1.y - 43} width="44" height="13" fill="#0f1115" rx="2" />
                      <text x={(p1.x + p2.x) / 2} y={p1.y - 33} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 9, fontWeight: 700 }}>
                        {Math.round(maxX - minX)} cm
                      </text>
                      {/* Left bbox arrow */}
                      <line x1={p1.x - 30} y1={p1.y} x2={p1.x - 30} y2={p3.y} stroke="#64748b" strokeWidth="1" strokeDasharray="none" />
                      <rect x={p1.x - 55} y={(p1.y + p3.y)/2 - 6} width="23" height="13" fill="#0f1115" rx="2" />
                      <text x={p1.x - 44} y={(p1.y + p3.y) / 2 + 4} textAnchor="middle" fill="#94a3b8"
                        style={{ fontSize: 9, fontWeight: 700 }}
                        transform={`rotate(-90 ${p1.x - 44} ${(p1.y + p3.y) / 2})`}
                      >
                        {Math.round(maxY - minY)} cm
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })()}

          {/* ══ RECTANGLE MODE ════════════════════════════════════════ */}
          {!freeMode && (
            <g>
              {/* Frontão lines */}
              {countertop.frontaoHeight > 0 && <line x1={x0} y1={y0 - 6} x2={x0 + wPx} y2={y0 - 6} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />}
              {countertop.frontaoHeight > 0 && countertop.frontaoLeft  && <line x1={x0 - 6}       y1={y0} x2={x0 - 6}       y2={y0 + dPx} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />}
              {countertop.frontaoHeight > 0 && countertop.frontaoRight && <line x1={x0 + wPx + 6} y1={y0} x2={x0 + wPx + 6} y2={y0 + dPx} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />}

              <rect x={x0} y={y0} width={wPx} height={dPx} fill="#242835" stroke="#94a3b8" strokeWidth="2" />
              <line x1={x0} y1={y0 + dPx} x2={x0 + wPx} y2={y0 + dPx} stroke="#f59e0b" strokeWidth="3.5" />
              {!countertop.frontaoLeft  && <line x1={x0}       y1={y0} x2={x0}       y2={y0 + dPx} stroke="#f59e0b" strokeWidth="2.5" />}
              {!countertop.frontaoRight && <line x1={x0 + wPx} y1={y0} x2={x0 + wPx} y2={y0 + dPx} stroke="#f59e0b" strokeWidth="2.5" />}

              {/* Sink */}
              {countertop.hasSink && (
                <g>
                  <line x1={sinkXPx - swPx/2 - 20} y1={sinkYPx} x2={sinkXPx + swPx/2 + 20} y2={sinkYPx} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="4,4" />
                  <line x1={sinkXPx} y1={sinkYPx - sdPx/2 - 20} x2={sinkXPx} y2={sinkYPx + sdPx/2 + 20} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="4,4" />
                  <rect x={sinkXPx - swPx/2} y={sinkYPx - sdPx/2} width={swPx} height={sdPx} fill="#181a20" stroke="#ef4444" strokeWidth="1.5" rx="4" style={{ cursor: 'ew-resize' }} onMouseDown={startSink} />
                  <rect x={sinkXPx - swPx/2 + 4} y={sinkYPx - sdPx/2 + 4} width={swPx - 8} height={sdPx - 8} fill="none" stroke="#475569" strokeWidth="1" rx="2" style={{ pointerEvents: 'none' }} />
                  <text x={sinkXPx} y={sinkYPx + 4} textAnchor="middle" fill="#ef4444" fontWeight="bold" style={{ pointerEvents: 'none', fontSize: 9 }}>
                    {countertop.sinkType === 'esculpida' ? 'CUBA ESCULPIDA' : 'CUBA INOX'}
                  </text>
                  <text x={sinkXPx} y={sinkYPx + 14} textAnchor="middle" fill="#475569" style={{ pointerEvents: 'none', fontSize: 8 }}>
                    {countertop.sinkWidth} x {countertop.sinkDepth}cm
                  </text>
                </g>
              )}

              {/* Cooktop */}
              {countertop.hasCooktop && (
                <g>
                  <line x1={ctXPx - cwPx/2 - 15} y1={ctYPx} x2={ctXPx + cwPx/2 + 15} y2={ctYPx} stroke="#10b981" strokeWidth="0.5" strokeDasharray="4,4" />
                  <line x1={ctXPx} y1={ctYPx - cdPx/2 - 15} x2={ctXPx} y2={ctYPx + cdPx/2 + 15} stroke="#10b981" strokeWidth="0.5" strokeDasharray="4,4" />
                  <rect x={ctXPx - cwPx/2} y={ctYPx - cdPx/2} width={cwPx} height={cdPx} fill="#0c0e12" stroke="#10b981" strokeWidth="1.5" style={{ cursor: 'ew-resize' }} onMouseDown={startCooktop} />
                  <text x={ctXPx} y={ctYPx + 4} textAnchor="middle" fill="#10b981" fontWeight="bold" style={{ pointerEvents: 'none', fontSize: 9 }}>COOKTOP</text>
                </g>
              )}

              {/* Width dimension */}
              <g stroke="#94a3b8" strokeWidth="0.75">
                <line x1={x0} y1={y0} x2={x0} y2={y0 - 45} /><line x1={x0 + wPx} y1={y0} x2={x0 + wPx} y2={y0 - 45} />
                <line x1={x0 + 8} y1={y0 - 35} x2={x0 + wPx - 8} y2={y0 - 35} />
                <polygon points={`${x0},${y0-35} ${x0+8},${y0-38} ${x0+8},${y0-32}`} fill="#94a3b8" stroke="none" />
                <polygon points={`${x0+wPx},${y0-35} ${x0+wPx-8},${y0-38} ${x0+wPx-8},${y0-32}`} fill="#94a3b8" stroke="none" />
              </g>
              <rect x={x0 + wPx/2 - 25} y={y0 - 42} width="50" height="14" fill="#0f1115" rx="3" />
              <text x={x0 + wPx/2} y={y0 - 32} fill="#fff" textAnchor="middle" fontWeight="bold" style={{ fontSize: 10 }}>{countertop.width} cm</text>

              {/* Depth dimension */}
              <g stroke="#94a3b8" strokeWidth="0.75">
                <line x1={x0} y1={y0} x2={x0 - 45} y2={y0} /><line x1={x0} y1={y0 + dPx} x2={x0 - 45} y2={y0 + dPx} />
                <line x1={x0 - 35} y1={y0 + 8} x2={x0 - 35} y2={y0 + dPx - 8} />
                <polygon points={`${x0-35},${y0} ${x0-38},${y0+8} ${x0-32},${y0+8}`} fill="#94a3b8" stroke="none" />
                <polygon points={`${x0-35},${y0+dPx} ${x0-38},${y0+dPx-8} ${x0-32},${y0+dPx-8}`} fill="#94a3b8" stroke="none" />
              </g>
              <rect x={x0 - 58} y={y0 + dPx/2 - 7} width="46" height="14" fill="#0f1115" rx="3" />
              <text x={x0 - 35} y={y0 + dPx/2 + 4} fill="#fff" textAnchor="middle" fontWeight="bold" style={{ fontSize: 10 }} transform={`rotate(-90 ${x0-35} ${y0+dPx/2})`}>{countertop.depth} cm</text>

              {/* Spec annotations */}
              <g transform={`translate(${x0},${y0 + dPx + 35})`}>
                <text x="0" y="0"  fill="#f59e0b" fontWeight="bold" style={{ fontSize: 9 }}>— Espessura: {countertop.thickness}cm</text>
                <text x="0" y="12" fill="#3b82f6" fontWeight="bold" style={{ fontSize: 9 }}>■ Frontão: {countertop.frontaoHeight}cm {countertop.frontaoLeft ? '(Esq)' : ''}{countertop.frontaoRight ? '(Dir)' : ''}</text>
                <text x="0" y="24" fill="#f59e0b" fontWeight="bold" style={{ fontSize: 9 }}>⌐ Saia: {countertop.saiaHeight}cm</text>
              </g>

              {/* Drag handles */}
              <g onMouseDown={startWidth} style={{ cursor: 'ew-resize' }}>
                <rect x={x0 + wPx - 5} y={y0 + dPx/2 - 20} width={18} height={40} fill="transparent" />
                <circle cx={x0 + wPx} cy={y0 + dPx/2} r={6} fill="#3b82f6" stroke="#fff" strokeWidth="1.5" opacity="0.9" />
              </g>
              <g onMouseDown={startDepth} style={{ cursor: 'ns-resize' }}>
                <rect x={x0 + wPx/2 - 20} y={y0 + dPx - 5} width={40} height={18} fill="transparent" />
                <circle cx={x0 + wPx/2} cy={y0 + dPx} r={6} fill="#3b82f6" stroke="#fff" strokeWidth="1.5" opacity="0.9" />
              </g>
              <g onMouseDown={startCorner} style={{ cursor: 'nwse-resize' }}>
                <rect x={x0 + wPx - 10} y={y0 + dPx - 10} width={20} height={20} fill="transparent" />
                <circle cx={x0 + wPx} cy={y0 + dPx} r={7} fill="#6366f1" stroke="#fff" strokeWidth="1.5" opacity="0.95" />
              </g>
              <circle cx={x0}       cy={y0}       r={4} fill="#475569" stroke="#94a3b8" strokeWidth="1" style={{ pointerEvents: 'none' }} />
              <circle cx={x0 + wPx} cy={y0}       r={4} fill="#475569" stroke="#94a3b8" strokeWidth="1" style={{ pointerEvents: 'none' }} />
              <circle cx={x0}       cy={y0 + dPx} r={4} fill="#475569" stroke="#94a3b8" strokeWidth="1" style={{ pointerEvents: 'none' }} />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
