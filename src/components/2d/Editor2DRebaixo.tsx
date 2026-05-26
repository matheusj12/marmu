import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useConfiguratorStore } from '../../store/configuratorStore'
import type { ProjectType } from '../../types'

type PanelTab     = 'painel' | 'detalhes'
type CornerHandle = 'tl' | 'tr' | 'bl' | 'br'

interface DragState {
  kind:      'corner' | 'canvas'
  cornerId?: CornerHandle
  startMX:   number; startMY: number
  startW?:   number; startH?: number
  startOffX?: number; startOffY?: number
}

const ACCENT    = '#a78bfa'
const PANEL_W   = 160
const TOOLBAR_H = 34

interface Props { projectType?: ProjectType }

export default function Editor2DRebaixo({ projectType = 'rebaixo_italiano' }: Props) {
  const svgRef  = useRef<SVGSVGElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const [size,     setSize]     = useState({ w: 880, h: 480 })
  const [zoom,     setZoom]     = useState(1.0)
  const [pan,      setPan]      = useState({ x: 0, y: 0 })
  const [centered, setCentered] = useState(false)
  const [snapOn,   setSnapOn]   = useState(true)
  const [panMode,  setPanMode]  = useState(false)
  const [drag,     setDrag]     = useState<DragState | null>(null)
  const [tab,      setTab]      = useState<PanelTab>('painel')

  const { countertop, setCountertop } = useConfiguratorStore()

  const isItaliano = projectType === 'rebaixo_italiano'

  /* ── Mapeamento das configurações para painel de rebaixo ── */
  const W      = countertop.width                          // largura do painel (cm)
  const H      = countertop.depth                          // altura do painel (cm) — depth reaproveitado
  const moldW  = Math.max(4, countertop.frontaoHeight)     // largura da moldura (cm) — frontaoHeight reaproveitado
  const rD     = Math.max(1, countertop.saiaHeight)        // profundidade do rebaixo (cm) — saiaHeight reaproveitado

  /* Área interna (recesso) */
  const iW = Math.max(10, W - moldW * 2)
  const iH = Math.max(10, H - moldW * 2)

  /* Chanfro italiano: 50% da moldura */
  const chamfer = isItaliano ? moldW * 0.5 : 0

  /* ── Observer de tamanho do container ── */
  useEffect(() => {
    if (!wrapRef.current) return
    const obs = new ResizeObserver(entries => {
      const r = entries[0].contentRect
      setSize({ w: r.width, h: r.height })
      setCentered(false)
    })
    obs.observe(wrapRef.current)
    return () => obs.disconnect()
  }, [])

  const cvW = size.w - PANEL_W
  const cvH = size.h - TOOLBAR_H
  const PAD = 72

  /* escala base — painel preenche a tela */
  const baseScale = useMemo(() => {
    const sx = (cvW - PAD * 2) / (W || 1)
    const sy = (cvH - PAD * 2) / (H || 1)
    return Math.min(sx, sy, 5)
  }, [cvW, cvH, W, H])

  const effScale = baseScale * zoom

  /* auto-center */
  useEffect(() => {
    if (centered) return
    setPan({ x: (cvW - W * baseScale) / 2, y: (cvH - H * baseScale) / 2 })
    setZoom(1)
    setCentered(true)
  }, [centered, cvW, cvH, baseScale, W, H])

  /* ── transforms de coordenadas ── */
  const toSVG = useCallback(
    (cx: number, cy: number): [number, number] => [cx * effScale + pan.x, cy * effScale + pan.y],
    [effScale, pan],
  )
  const toCM = useCallback(
    (sx: number, sy: number): [number, number] => [(sx - pan.x) / effScale, (sy - pan.y) / effScale],
    [effScale, pan],
  )
  const snap = useCallback(
    (v: number) => snapOn ? Math.round(v / 5) * 5 : Math.round(v),
    [snapOn],
  )

  /* ── mouse handlers ── */
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.startMX
    const dy = e.clientY - drag.startMY
    if (drag.kind === 'canvas') {
      setPan({ x: drag.startOffX! + dx, y: drag.startOffY! + dy }); return
    }
    if (drag.kind === 'corner') {
      const dxCm = dx / effScale; const dyCm = dy / effScale
      let w = drag.startW!, h = drag.startH!
      switch (drag.cornerId) {
        case 'tl': w = snap(Math.max(40, w - dxCm)); h = snap(Math.max(40, h - dyCm)); break
        case 'tr': w = snap(Math.max(40, w + dxCm)); h = snap(Math.max(40, h - dyCm)); break
        case 'bl': w = snap(Math.max(40, w - dxCm)); h = snap(Math.max(40, h + dyCm)); break
        case 'br': w = snap(Math.max(40, w + dxCm)); h = snap(Math.max(40, h + dyCm)); break
      }
      setCountertop({ width: w, depth: h })
    }
  }, [drag, effScale, snap, setCountertop])

  const onMouseUp = useCallback(() => setDrag(null), [])

  useEffect(() => {
    if (!drag) return
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [drag, onMouseMove, onMouseUp])

  /* wheel zoom */
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const factor  = e.deltaY > 0 ? 0.88 : 1.13
      const newZoom = Math.max(0.2, Math.min(8, zoom * factor))
      const rect    = el.getBoundingClientRect()
      const [cx, cy] = toCM(e.clientX - rect.left, e.clientY - rect.top)
      const ns = baseScale * newZoom
      setPan({ x: (e.clientX - rect.left) - cx * ns, y: (e.clientY - rect.top) - cy * ns })
      setZoom(newZoom)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [zoom, baseScale, toCM])

  /* keyboard: Espaço = pan mode */
  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); setPanMode(true) } }
    const ku = (e: KeyboardEvent) => { if (e.code === 'Space') setPanMode(false) }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup',   ku)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku) }
  }, [])

  function fitScreen() { setCentered(false) }

  /* ── grid ── */
  const gridCm = useMemo(() => {
    const thresholds = [1, 2, 5, 10, 20, 50, 100]
    for (const s of thresholds) if (s * effScale >= 48) return s
    return 100
  }, [effScale])

  const gridLines = useMemo(() => {
    const lines: { x1:number; y1:number; x2:number; y2:number; major:boolean; label?:string; isV:boolean }[] = []
    const majorStep = gridCm * 5
    let cm = 0
    while (cm <= W + gridCm) {
      const [x] = toSVG(cm, 0)
      const major = cm % majorStep === 0
      lines.push({ x1:x, y1:toSVG(0,0)[1]-5, x2:x, y2:toSVG(0,H)[1]+5, major, label: major ? String(cm) : undefined, isV:true })
      cm += gridCm
    }
    cm = 0
    while (cm <= H + gridCm) {
      const [,y] = toSVG(0, cm)
      const major = cm % majorStep === 0
      lines.push({ x1:toSVG(0,0)[0]-5, y1:y, x2:toSVG(W,0)[0]+5, y2:y, major, label: major ? String(cm) : undefined, isV:false })
      cm += gridCm
    }
    return lines
  }, [gridCm, W, H, toSVG])

  /* ── coordenadas SVG do painel ── */
  const [ox,  oy]  = toSVG(0, 0)
  const [ox2, oy2] = toSVG(W, H)

  /* ── coordenadas SVG da área interna (recesso) ── */
  const [ix,  iy]  = toSVG(moldW,        moldW)
  const [ix2, iy2] = toSVG(moldW + iW,   moldW + iH)

  /* ── polígono chanfrado do recesso (Italiano) ── */
  const chPx = chamfer * effScale
  const innerPts = isItaliano && chPx > 2
    ? [
        [ix + chPx, iy],
        [ix2 - chPx, iy],
        [ix2, iy + chPx],
        [ix2, iy2 - chPx],
        [ix2 - chPx, iy2],
        [ix + chPx, iy2],
        [ix, iy2 - chPx],
        [ix, iy + chPx],
      ].map(([x,y]) => `${x},${y}`).join(' ')
    : `${ix},${iy} ${ix2},${iy} ${ix2},${iy2} ${ix},${iy2}`

  /* ── handles de canto ── */
  const CORNERS: { id: CornerHandle; cmPt: [number,number]; cur: string }[] = [
    { id:'tl', cmPt:[0, 0], cur:'nwse-resize' },
    { id:'tr', cmPt:[W, 0], cur:'nesw-resize' },
    { id:'bl', cmPt:[0, H], cur:'nesw-resize' },
    { id:'br', cmPt:[W, H], cur:'nwse-resize' },
  ]

  const DIM_OFF = 30
  const TICK    = 6

  const activeCursor = panMode ? (drag ? 'grabbing' : 'grab') : 'default'

  return (
    <div ref={wrapRef} className="flex w-full h-full overflow-hidden bg-[#09090b]" style={{ userSelect:'none' }}>

      {/* ════════ PAINEL ESQUERDO ════════ */}
      <div className="flex-shrink-0 border-r border-outline-variant bg-surface-container flex flex-col"
        style={{ width: PANEL_W }}>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant flex-shrink-0">
          {(['painel','detalhes'] as PanelTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                tab === t ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-on-surface'
              }`}>
              {t === 'painel' ? 'Painel' : 'Detalhes'}
            </button>
          ))}
        </div>

        {/* Tab PAINEL */}
        {tab === 'painel' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">

            {/* Indicador de estilo */}
            <div className={`p-2.5 rounded-xl border ${isItaliano ? 'border-primary/40 bg-primary-container/10' : 'border-outline-variant'}`}>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isItaliano ? 'text-primary' : 'text-secondary'}`}>
                {isItaliano ? 'Rebaixo Italiano' : 'Rebaixo Americano'}
              </p>
              <p className="text-[10px] text-secondary leading-relaxed">
                {isItaliano ? 'Chanfro 45° nas arestas internas' : 'Arestas retas 90°'}
              </p>
            </div>

            {/* Largura da Moldura */}
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Moldura (cm)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCountertop({ frontaoHeight: Math.max(4, moldW - 1) })}
                  className="w-6 h-6 rounded bg-surface-container border border-outline-variant text-secondary hover:text-on-surface flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px]">remove</span>
                </button>
                <input type="number" min={4} max={40} value={moldW}
                  onChange={e => setCountertop({ frontaoHeight: Number(e.target.value) })}
                  className="flex-1 bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-primary" />
                <button onClick={() => setCountertop({ frontaoHeight: Math.min(40, moldW + 1) })}
                  className="w-6 h-6 rounded bg-surface-container border border-outline-variant text-secondary hover:text-on-surface flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                </button>
              </div>
            </div>

            {/* Resumo de áreas */}
            <div className="p-2.5 rounded-xl bg-surface-container-highest border border-outline-variant">
              <p className="text-[9px] font-bold text-secondary uppercase tracking-wider mb-2">Área</p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-secondary">Total</span>
                  <span className="text-[10px] font-mono text-on-surface">{(W * H / 10000).toFixed(3)} m²</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-secondary">Recesso</span>
                  <span className="text-[10px] font-mono text-on-surface">{(iW * iH / 10000).toFixed(3)} m²</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-secondary">Moldura</span>
                  <span className="text-[10px] font-mono text-on-surface">{((W * H - iW * iH) / 10000).toFixed(3)} m²</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab DETALHES */}
        {tab === 'detalhes' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">

            {/* Profundidade do rebaixo */}
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Prof. Rebaixo (cm)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCountertop({ saiaHeight: Math.max(1, rD - 0.5) })}
                  className="w-6 h-6 rounded bg-surface-container border border-outline-variant text-secondary hover:text-on-surface flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px]">remove</span>
                </button>
                <input type="number" min={1} max={10} step={0.5} value={rD}
                  onChange={e => setCountertop({ saiaHeight: Number(e.target.value) })}
                  className="flex-1 bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-primary" />
                <button onClick={() => setCountertop({ saiaHeight: Math.min(10, rD + 0.5) })}
                  className="w-6 h-6 rounded bg-surface-container border border-outline-variant text-secondary hover:text-on-surface flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                </button>
              </div>
            </div>

            {/* Borda exterior */}
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Borda Exterior</p>
              <div className="grid grid-cols-3 gap-1">
                {(['reto','chanfro','boleado'] as const).map(cs => (
                  <button key={cs} onClick={() => setCountertop({ cornerStyle: cs })}
                    className={`py-1.5 rounded text-[10px] font-medium capitalize border transition-colors ${
                      countertop.cornerStyle === cs
                        ? 'border-primary bg-primary-container/20 text-primary'
                        : 'border-outline-variant text-secondary hover:text-on-surface'
                    }`}>{cs}</button>
                ))}
              </div>
            </div>

            {/* Espessura info */}
            <div className="p-2.5 rounded-xl bg-surface-container-highest border border-outline-variant">
              <p className="text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Espessura do Painel</p>
              <p className="text-sm font-mono text-on-surface">{countertop.thickness} cm</p>
              <p className="text-[9px] text-secondary mt-0.5">Ajuste no painel lateral direito</p>
            </div>

          </div>
        )}

        {/* Dimensões no rodapé do painel */}
        <div className="border-t border-outline-variant px-3 py-3 flex-shrink-0 space-y-2">
          <p className="text-[9px] font-bold text-secondary uppercase tracking-widest">DIMENSÕES (CM)</p>
          {([
            { key: 'width' as const,  label: 'Largura' },
            { key: 'depth' as const,  label: 'Altura'  },
          ]).map(item => (
            <div key={item.key} className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-secondary">{item.label}</span>
              <input type="number" value={countertop[item.key]}
                onChange={e => setCountertop({ [item.key]: Number(e.target.value) })}
                className="w-16 bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-xs font-mono text-right focus:outline-none focus:border-primary" />
            </div>
          ))}
        </div>
      </div>

      {/* ════════ ÁREA DO CANVAS ════════ */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 border-b border-outline-variant bg-surface-container-low"
          style={{ height: TOOLBAR_H }}>
          <button onClick={() => setSnapOn(!snapOn)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${
              snapOn
                ? 'border-primary/50 bg-primary-container/20 text-primary'
                : 'border-outline-variant text-secondary hover:text-on-surface'
            }`}>
            <span className="material-symbols-outlined text-[14px]">grid_4x4</span>
            Snap 5cm
          </button>
          <div className="w-px h-4 bg-outline-variant" />
          <button onClick={() => setZoom(z => Math.max(0.2, z * 0.88))}
            className="p-1 text-secondary hover:text-on-surface rounded">
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <span className="text-[10px] font-mono text-secondary w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(8, z * 1.13))}
            className="p-1 text-secondary hover:text-on-surface rounded">
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
          <button onClick={fitScreen} className="p-1 text-secondary hover:text-on-surface rounded">
            <span className="material-symbols-outlined text-[16px]">fit_screen</span>
          </button>
          <div className="w-px h-4 bg-outline-variant" />
          <span className="text-[10px] text-secondary/60">
            ELEVAÇÃO FRONTAL · Scroll = zoom · Arrastar cantos = redimensionar
          </span>
        </div>

        {/* SVG Canvas */}
        <div className="flex-1 relative overflow-hidden" style={{ cursor: activeCursor }}>
          <svg ref={svgRef} className="w-full h-full"
            onMouseDown={e => {
              if (panMode || e.button === 1) {
                setDrag({ kind:'canvas', startMX:e.clientX, startMY:e.clientY, startOffX:pan.x, startOffY:pan.y })
              }
            }}
          >
            {/* Grade */}
            {gridLines.map((l, i) => (
              <g key={i}>
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke={l.major ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.025)'}
                  strokeWidth={l.major ? 1 : 0.5} />
                {l.label && (
                  <text x={l.isV ? l.x1 : toSVG(0,0)[0] - 8}
                    y={l.isV ? toSVG(0,0)[1] - 8 : l.y1}
                    textAnchor="middle" dominantBaseline="auto"
                    fontSize={9} fill="rgba(255,255,255,0.2)" fontFamily="monospace">
                    {l.label}
                  </text>
                )}
              </g>
            ))}

            {/* Preenchimento da moldura (frame) */}
            <rect x={ox} y={oy} width={ox2 - ox} height={oy2 - oy}
              fill="rgba(167,139,250,0.07)" stroke="none" />

            {/* Contorno externo do painel */}
            <rect x={ox} y={oy} width={ox2 - ox} height={oy2 - oy}
              fill="none" stroke={ACCENT} strokeWidth={2} />

            {/* Área de recesso (chanfrada para Italiano, retângulo para Americano) */}
            <polygon points={innerPts}
              fill="rgba(6,6,12,0.82)"
              stroke={ACCENT} strokeWidth={1.5} strokeOpacity={0.6}
            />

            {/* Linhas de chanfro indicativas (apenas Italiano) */}
            {isItaliano && chPx > 3 && (() => {
              const cLines: [number,number,number,number][] = [
                [ix,       iy + chPx,  ix + chPx, iy      ],  // topo-esquerdo
                [ix2 - chPx, iy,       ix2,       iy + chPx], // topo-direito
                [ix2,       iy2 - chPx, ix2 - chPx, iy2  ],  // baixo-direito
                [ix + chPx, iy2,       ix,        iy2 - chPx], // baixo-esquerdo
              ]
              return (
                <g>
                  {cLines.map(([x1,y1,x2,y2], i) => (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={ACCENT} strokeWidth={1.2} opacity={0.35} strokeDasharray="3 2" />
                  ))}
                </g>
              )
            })()}

            {/* Linha de profundidade do rebaixo (traço) */}
            <rect x={ix - 4} y={iy - 4} width={ix2 - ix + 8} height={iy2 - iy + 8}
              fill="none" stroke={ACCENT} strokeWidth={0.5} strokeOpacity={0.25}
              strokeDasharray="4 3" />

            {/* Label central: área do recesso */}
            <text x={(ix + ix2) / 2} y={(iy + iy2) / 2}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={13} fill="rgba(167,139,250,0.22)" fontFamily="monospace" fontWeight="700">
              {(iW * iH / 10000).toFixed(2)} m²
            </text>

            {/* Tag de estilo — centro topo interno */}
            <text x={(ix + ix2) / 2} y={iy - 9}
              textAnchor="middle" dominantBaseline="auto"
              fontSize={9} fill="rgba(167,139,250,0.4)" fontFamily="monospace" fontWeight="700"
              letterSpacing="1.5">
              {isItaliano ? 'REBAIXO ITALIANO' : 'REBAIXO AMERICANO'}
            </text>

            {/* ── Cotas ── */}

            {/* Largura (acima) */}
            {(() => {
              const y  = oy - DIM_OFF
              const mx = (ox + ox2) / 2
              return (
                <g>
                  <line x1={ox} y1={y} x2={ox2} y2={y} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <line x1={ox}  y1={y - TICK/2} x2={ox}  y2={y + TICK/2} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <line x1={ox2} y1={y - TICK/2} x2={ox2} y2={y + TICK/2} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <rect x={mx - 30} y={y - 11} width={60} height={16} rx={4}
                    fill="#09090b" stroke={ACCENT} strokeWidth={0.5} opacity={0.9} />
                  <text x={mx} y={y} textAnchor="middle" dominantBaseline="middle"
                    fontSize={11} fontWeight="700" fill={ACCENT} fontFamily="monospace">
                    {W}.0 cm
                  </text>
                </g>
              )
            })()}

            {/* Altura (lado direito) */}
            {(() => {
              const x  = ox2 + DIM_OFF
              const my = (oy + oy2) / 2
              return (
                <g>
                  <line x1={x} y1={oy} x2={x} y2={oy2} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <line x1={x - TICK/2} y1={oy}  x2={x + TICK/2} y2={oy}  stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <line x1={x - TICK/2} y1={oy2} x2={x + TICK/2} y2={oy2} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <rect x={x + 6} y={my - 9} width={54} height={16} rx={4}
                    fill="#09090b" stroke={ACCENT} strokeWidth={0.5} opacity={0.9} />
                  <text x={x + 33} y={my} textAnchor="middle" dominantBaseline="middle"
                    fontSize={11} fontWeight="700" fill={ACCENT} fontFamily="monospace">
                    {H}.0 cm
                  </text>
                </g>
              )
            })()}

            {/* Largura da moldura (lado esquerdo, traço) */}
            {(() => {
              const x   = ox - DIM_OFF * 0.65
              const y0  = oy
              const y1  = oy + moldW * effScale
              const my  = (y0 + y1) / 2
              return (
                <g>
                  <line x1={x} y1={y0} x2={x} y2={y1}
                    stroke="rgba(167,139,250,0.5)" strokeWidth={1.2} strokeDasharray="3 2" />
                  <line x1={x - TICK/2} y1={y0} x2={x + TICK/2} y2={y0}
                    stroke="rgba(167,139,250,0.5)" strokeWidth={1.2} />
                  <line x1={x - TICK/2} y1={y1} x2={x + TICK/2} y2={y1}
                    stroke="rgba(167,139,250,0.5)" strokeWidth={1.2} />
                  <text x={x - 4} y={my} textAnchor="end" dominantBaseline="middle"
                    fontSize={9} fill="rgba(167,139,250,0.55)" fontFamily="monospace">
                    {moldW}cm
                  </text>
                </g>
              )
            })()}

            {/* Handles de canto */}
            {CORNERS.map(h => {
              const [hx, hy] = toSVG(...h.cmPt)
              return (
                <g key={h.id} style={{ cursor: h.cur }}
                  onMouseDown={e => {
                    e.stopPropagation()
                    setDrag({ kind:'corner', cornerId:h.id, startMX:e.clientX, startMY:e.clientY, startW:W, startH:H })
                  }}>
                  <circle cx={hx} cy={hy} r={12} fill="transparent" />
                  <circle cx={hx} cy={hy} r={6} fill="#0c0c0f" stroke={ACCENT} strokeWidth={2} />
                </g>
              )
            })}

            {/* Barra de info inferior */}
            {(() => {
              const [bx, by] = toSVG(W / 2, H)
              return (
                <text x={bx} y={by + 16} textAnchor="middle" dominantBaseline="hanging"
                  fontSize={9} fill="rgba(255,255,255,0.2)" fontFamily="monospace">
                  {W} × {H} cm · moldura {moldW} cm · rebaixo {rD} cm · esp. {countertop.thickness} cm
                  {isItaliano ? ' · chanfro 45°' : ''}
                </text>
              )
            })()}

          </svg>
        </div>
      </div>
    </div>
  )
}
