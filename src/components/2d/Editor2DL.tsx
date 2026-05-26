import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useConfiguratorStore } from '../../store/configuratorStore'
import type { CountertopConfig, ProjectType } from '../../types'

/* ───────────── element catalog (igual Editor2D) ───────────── */
interface ElemDef {
  id: string; label: string; icon: string
  isActive: (c: CountertopConfig) => boolean
  toggle:   (c: CountertopConfig) => Partial<CountertopConfig>
}
const ELEMS: ElemDef[] = [
  {
    id:'cuba_simples', label:'Cuba Simples', icon:'water_drop',
    isActive: c => c.hasSink && c.sinkType !== 'inox_sobrepor' && c.sinkWidth < 80,
    toggle:   c => c.hasSink && c.sinkType !== 'inox_sobrepor' && c.sinkWidth < 80
      ? { hasSink: false }
      : { hasSink: true, sinkType:'inox_embutir', sinkWidth:50, sinkDepth:40, sinkX:0 },
  },
  {
    id:'cuba_dupla', label:'Cuba Dupla', icon:'water_drop',
    isActive: c => c.hasSink && c.sinkWidth >= 80,
    toggle:   c => c.hasSink && c.sinkWidth >= 80
      ? { hasSink: false }
      : { hasSink: true, sinkType:'inox_embutir', sinkWidth:85, sinkDepth:40, sinkX:0 },
  },
  {
    id:'cooktop', label:'Cooktop', icon:'local_fire_department',
    isActive: c => c.hasCooktop,
    toggle:   c => ({ hasCooktop: !c.hasCooktop }),
  },
]

type CornerHandle = 'tl' | 'tr' | 'bl' | 'br'
type PanelTab     = 'elementos' | 'acabamentos'
type SelElem      = 'sink' | 'cooktop' | null

interface DragState {
  kind:      'corner' | 'canvas'
  cornerId?: CornerHandle
  startMX:   number; startMY: number
  startW?:   number; startD?: number
  startOffX?: number; startOffY?: number
}

/* ───────────── edge menu ───────────── */
type EdgeHandle = 'tc' | 'bc' | 'ml' | 'mr_main' | 'mr_arm' | 'inner'

interface EdgeMenuDef {
  id: EdgeHandle; label: string
  cx: (c: CountertopConfig, sl: number) => number
  cy: (c: CountertopConfig, sl: number) => number
  yDir: -1 | 0 | 1; xDir: 0 | -1 | 1
}

const EDGE_MENUS: EdgeMenuDef[] = [
  { id:'tc',      label:'ARESTA TRASEIRA',  cx:(c)      => c.depth / 2,        cy:(_,sl)  => 0,                    yDir:-1, xDir: 0 },
  { id:'bc',      label:'ARESTA FRONTAL',   cx:(c)      => c.width / 2,        cy:(c,sl)  => sl + c.depth,         yDir: 1, xDir: 0 },
  { id:'ml',      label:'ARESTA ESQUERDA',  cx:()       => 0,                  cy:(c,sl)  => sl + c.depth / 2,     yDir: 0, xDir:-1 },
  { id:'mr_main', label:'ARESTA DIR. PRINCIPAL', cx:(c) => c.width,            cy:(c,sl)  => sl + c.depth / 2,     yDir: 0, xDir: 1 },
  { id:'mr_arm',  label:'ARESTA DIR. BRAÇO', cx:(c)     => c.depth,            cy:(_,sl)  => sl / 2,               yDir: 0, xDir: 1 },
  { id:'inner',   label:'ARESTA INTERNA',   cx:(c)      => c.depth,            cy:(c,sl)  => sl + c.depth * 0.1,  yDir: 0, xDir: 1 },
]

/* ───────────── constants ───────────── */
const ACCENT    = '#a78bfa'
const TERTIARY  = '#34d399'
const PANEL_W   = 160
const TOOLBAR_H = 34

/* ─────────────────────────────────────────────────────── */
interface Props { projectType?: ProjectType }

export default function Editor2DL({ projectType = 'bancada_l' }: Props) {
  const svgRef    = useRef<SVGSVGElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  const [size,     setSize]     = useState({ w: 880, h: 480 })
  const [zoom,     setZoom]     = useState(1.0)
  const [pan,      setPan]      = useState({ x: 0, y: 0 })
  const [centered, setCentered] = useState(false)
  const [snapOn,   setSnapOn]   = useState(true)
  const [panMode,  setPanMode]  = useState(false)
  const [drag,     setDrag]     = useState<DragState | null>(null)
  const [tab,      setTab]      = useState<PanelTab>('elementos')
  const [selElem,  setSelElem]  = useState<SelElem>(null)
  const [edgeMenu, setEdgeMenu] = useState<EdgeHandle | null>(null)

  const { countertop, setCountertop } = useConfiguratorStore()

  /* ── SL = comprimento do braço lateral (auto) ── */
  const SL = Math.round(countertop.width * 0.65)

  /* observe container */
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

  /* base scale — cabe L na tela */
  const baseScale = useMemo(() => {
    const totalW = countertop.width  || 1
    const totalH = SL + (countertop.depth || 1)
    const sx = (cvW - PAD * 2) / totalW
    const sy = (cvH - PAD * 2) / totalH
    return Math.min(sx, sy, 5)
  }, [cvW, cvH, countertop.width, countertop.depth, SL])

  const effScale = baseScale * zoom

  /* auto-center */
  useEffect(() => {
    if (centered) return
    const bwPx = countertop.width * baseScale
    const bhPx = (SL + countertop.depth) * baseScale
    setPan({ x: (cvW - bwPx) / 2, y: (cvH - bhPx) / 2 })
    setZoom(1)
    setCentered(true)
  }, [centered, cvW, cvH, baseScale, countertop.width, countertop.depth, SL])

  /* coordinate transforms */
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
      let w = drag.startW!, d = drag.startD!
      switch (drag.cornerId) {
        case 'tl': w = snap(Math.max(60, w - dxCm)); d = snap(Math.max(30, d - dyCm)); break
        case 'tr': w = snap(Math.max(60, w + dxCm)); d = snap(Math.max(30, d - dyCm)); break
        case 'bl': w = snap(Math.max(60, w - dxCm)); d = snap(Math.max(30, d + dyCm)); break
        case 'br': w = snap(Math.max(60, w + dxCm)); d = snap(Math.max(30, d + dyCm)); break
      }
      setCountertop({ width: w, depth: d })
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

  /* keyboard */
  useEffect(() => {
    const kd  = (e: KeyboardEvent) => { if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); setPanMode(true) } }
    const ku  = (e: KeyboardEvent) => { if (e.code === 'Space') setPanMode(false) }
    const esc = (e: KeyboardEvent) => { if (e.code === 'Escape') { setSelElem(null); setEdgeMenu(null) } }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('keydown', esc) }
  }, [])

  function fitScreen() { setCentered(false) }

  /* ── L-shape SVG coords ── */
  // Shape: sub arm at top-left (0→D, 0→SL) + main arm (0→W, SL→SL+D)
  const W  = countertop.width
  const D  = countertop.depth

  // 6 corners of L in cm (origin = top-left of sub arm)
  const corners = {
    tl_arm:  [0, 0]     as [number,number],
    tr_arm:  [D, 0]     as [number,number],
    inner:   [D, SL]    as [number,number],
    tr_main: [W, SL]    as [number,number],
    br_main: [W, SL+D]  as [number,number],
    bl_main: [0, SL+D]  as [number,number],
  }

  function c2s([cx,cy]: [number,number]) { return toSVG(cx, cy) }

  // L polygon points
  const pts = Object.values(corners).map(p => c2s(p as [number,number])).map(([x,y]) => `${x},${y}`).join(' ')

  /* ── grid ── */
  const gridCm = useMemo(() => {
    const thresholds = [1,2,5,10,20,50,100]
    for (const s of thresholds) if (s * effScale >= 48) return s
    return 100
  }, [effScale])

  const gridLines = useMemo(() => {
    const lines: { x1:number;y1:number;x2:number;y2:number;major:boolean;label?:string;isV:boolean }[] = []
    const majorStep = gridCm * 5
    const totalH    = SL + D
    let cm = 0
    while (cm <= W + gridCm) {
      const [x] = toSVG(cm, 0)
      const major = cm % majorStep === 0
      lines.push({ x1:x,y1:toSVG(0,0)[1]-5, x2:x, y2:toSVG(0,totalH)[1]+5, major, label: major ? String(cm):undefined, isV:true })
      cm += gridCm
    }
    cm = 0
    while (cm <= totalH + gridCm) {
      const [,y] = toSVG(0, cm)
      const major = cm % majorStep === 0
      lines.push({ x1:toSVG(0,0)[0]-5, y1:y, x2:toSVG(W,0)[0]+5, y2:y, major, label: major ? String(cm):undefined, isV:false })
      cm += gridCm
    }
    return lines
  }, [gridCm, W, D, SL, toSVG])

  /* ── 4 outer corner handles (like Editor2D) ── */
  // Mapeados para os 4 extremos do bounding box do L
  const CORNERS: { id: CornerHandle; pt: [number,number]; cur: string }[] = [
    { id:'tl', pt:[0, 0],       cur:'nwse-resize' },  // top-left of arm
    { id:'tr', pt:[W, SL],      cur:'nesw-resize' },  // top-right of main arm
    { id:'bl', pt:[0, SL+D],    cur:'nesw-resize' },  // bottom-left
    { id:'br', pt:[W, SL+D],    cur:'nwse-resize' },  // bottom-right
  ]

  const DIM_OFF = 30
  const TICK    = 6

  /* ── sink position (on main arm) ── */
  const MARGIN     = 0.15 * W
  const sinkMaxOff = Math.max(0, W / 2 - countertop.sinkWidth / 2 - MARGIN)
  const sinkOffCm  = (countertop.sinkX / 100) * sinkMaxOff
  const sinkCX     = W / 2 + sinkOffCm
  const sinkCY     = SL + D * 0.36
  const sinkL      = sinkCX - countertop.sinkWidth  / 2
  const sinkT      = sinkCY - countertop.sinkDepth  / 2
  const [skX, skY] = toSVG(sinkL, sinkT)
  const skW        = countertop.sinkWidth  * effScale
  const skH        = countertop.sinkDepth  * effScale

  /* ── cooktop position (on main arm) ── */
  const ctMaxOff  = Math.max(0, W / 2 - countertop.cooktopWidth / 2 - MARGIN)
  const ctOffCm   = (countertop.cooktopX / 100) * ctMaxOff
  const ctCX      = W / 2 + ctOffCm
  const ctCY      = SL + D * 0.62
  const ctL       = ctCX - countertop.cooktopWidth / 2
  const ctT       = ctCY - countertop.cooktopDepth / 2
  const [ctX, ctY] = toSVG(ctL, ctT)
  const ctW       = countertop.cooktopWidth  * effScale
  const ctH       = countertop.cooktopDepth  * effScale

  /* ── Edge popup ── */
  function EdgeMenuPopup({ id }: { id: EdgeHandle }) {
    const def = EDGE_MENUS.find(m => m.id === id)!
    const [hxSvg, hySvg] = toSVG(def.cx(countertop, SL), def.cy(countertop, SL))
    const POPUP_W = 200; const POPUP_H = 240; const HO = 20
    let left = hxSvg - POPUP_W / 2; let top = hySvg + HO
    if (def.yDir === -1) top = hySvg - POPUP_H - HO
    if (def.xDir === -1) { left = hxSvg - POPUP_W - HO; top = hySvg - POPUP_H / 2 }
    if (def.xDir ===  1) { left = hxSvg + HO;           top = hySvg - POPUP_H / 2 }
    const safeL = Math.max(4, Math.min(cvW - POPUP_W - 4, left))
    const safeT = Math.max(TOOLBAR_H + 4, Math.min(cvH - POPUP_H + TOOLBAR_H - 4, top + TOOLBAR_H))

    interface PopOpt { id:string;label:string;icon:string;isActive:boolean;hasValue?:boolean;value?:number;unit?:string;min?:number;max?:number;onToggle:()=>void;onValueChange?:(v:number)=>void }
    const options: PopOpt[] = [
      { id:'frontao', label:'FRONTÃO', icon:'view_agenda', isActive: countertop.frontaoHeight > 0,
        hasValue:true, value:countertop.frontaoHeight, unit:'cm', min:0, max:30,
        onToggle: () => setCountertop({ frontaoHeight: countertop.frontaoHeight > 0 ? 0 : 8 }),
        onValueChange: v => setCountertop({ frontaoHeight: v }) },
      { id:'saia', label:'SAIA', icon:'border_bottom', isActive: countertop.saiaHeight > 0,
        hasValue:true, value:countertop.saiaHeight, unit:'cm', min:0, max:20,
        onToggle: () => setCountertop({ saiaHeight: countertop.saiaHeight > 0 ? 0 : 8 }),
        onValueChange: v => setCountertop({ saiaHeight: v }) },
      { id:'lateral_esq', label:'LATERAL ESQ.', icon:'border_left', isActive: countertop.frontaoLeft,
        onToggle: () => setCountertop({ frontaoLeft: !countertop.frontaoLeft }) },
      { id:'lateral_dir', label:'LATERAL DIR.', icon:'border_right', isActive: countertop.frontaoRight,
        onToggle: () => setCountertop({ frontaoRight: !countertop.frontaoRight }) },
      { id:'borda', label:'BORDA', icon:'rounded_corner', isActive: countertop.cornerStyle !== 'reto',
        onToggle: () => setCountertop({ cornerStyle: 'chanfro' }) },
    ]
    const visibleMap: Record<EdgeHandle, string[]> = {
      tc:       ['frontao','lateral_esq','borda'],
      bc:       ['saia','borda'],
      ml:       ['lateral_esq','saia','borda'],
      mr_main:  ['lateral_dir','frontao','saia','borda'],
      mr_arm:   ['lateral_dir','frontao','borda'],
      inner:    ['frontao','saia','borda'],
    }
    const shown = options.filter(o => visibleMap[id].includes(o.id))
    return (
      <div className="absolute z-30 bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl overflow-hidden"
        style={{ left: safeL, top: safeT, width: POPUP_W }} onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <span className="text-[10px] font-bold text-secondary tracking-[0.15em] uppercase">{def.label}</span>
          <button onClick={() => setEdgeMenu(null)} className="text-secondary hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
        <div className="p-2 space-y-1">
          {shown.map(opt => (
            <div key={opt.id} className={`rounded-xl border transition-all ${opt.isActive ? 'border-primary/40 bg-primary-container/10' : 'border-transparent hover:border-outline-variant hover:bg-surface-container'}`}>
              <button onClick={opt.onToggle} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[16px] ${opt.isActive ? 'text-primary' : 'text-secondary'}`}
                    style={opt.isActive ? { fontVariationSettings:"'FILL' 1" } : {}}>{opt.icon}</span>
                  <span className={`text-xs font-bold tracking-wider ${opt.isActive ? 'text-primary' : 'text-secondary'}`}>{opt.label}</span>
                </div>
                {opt.isActive
                  ? <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-on-primary text-[12px]" style={{ fontVariationSettings:"'FILL' 1" }}>check</span></span>
                  : <span className="w-5 h-5 rounded-full border border-outline flex items-center justify-center flex-shrink-0 text-secondary"><span className="material-symbols-outlined text-[14px]">add</span></span>
                }
              </button>
              {opt.isActive && opt.hasValue && opt.onValueChange && (
                <div className="px-3 pb-2.5 flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
                  <button onClick={() => opt.onValueChange!(Math.max(opt.min!, (opt.value ?? 0) - 1))}
                    className="w-6 h-6 rounded bg-surface-container border border-outline-variant text-secondary hover:text-on-surface flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px]">remove</span>
                  </button>
                  <input type="number" value={opt.value} min={opt.min} max={opt.max}
                    onChange={e => opt.onValueChange!(Number(e.target.value))}
                    className="flex-1 bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-primary text-on-surface" />
                  <button onClick={() => opt.onValueChange!(Math.min(opt.max!, (opt.value ?? 0) + 1))}
                    className="w-6 h-6 rounded bg-surface-container border border-outline-variant text-secondary hover:text-on-surface flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                  </button>
                  <span className="text-[10px] text-secondary">{opt.unit}</span>
                </div>
              )}
              {opt.isActive && opt.id === 'borda' && (
                <div className="px-3 pb-2.5 grid grid-cols-3 gap-1" onMouseDown={e => e.stopPropagation()}>
                  {(['reto','chanfro','boleado'] as const).map(cs => (
                    <button key={cs} onClick={() => setCountertop({ cornerStyle: cs })}
                      className={`py-1 rounded text-[9px] font-bold capitalize border transition-colors ${countertop.cornerStyle === cs ? 'border-primary bg-primary-container/20 text-primary' : 'border-outline-variant text-secondary hover:text-on-surface'}`}>{cs}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const activeCursor = panMode ? (drag ? 'grabbing' : 'grab') : 'default'

  /* edge handle positions (midpoints of each edge of L) */
  const EDGE_HANDLES: { id: EdgeHandle; cm: [number,number] }[] = [
    { id:'tc',      cm:[D / 2,           0          ] },
    { id:'bc',      cm:[W / 2,           SL + D     ] },
    { id:'ml',      cm:[0,               SL + D / 2 ] },
    { id:'mr_main', cm:[W,               SL + D / 2 ] },
    { id:'mr_arm',  cm:[D,               SL / 2     ] },
    { id:'inner',   cm:[D,               SL         ] },
  ]

  return (
    <div ref={wrapRef} className="flex w-full h-full overflow-hidden bg-[#09090b]" style={{ userSelect:'none' }}>

      {/* ════════ LEFT PANEL ════════ */}
      <div className="flex-shrink-0 border-r border-outline-variant bg-surface-container flex flex-col" style={{ width: PANEL_W }}>
        <div className="flex border-b border-outline-variant flex-shrink-0">
          {(['elementos','acabamentos'] as PanelTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-on-surface'}`}>
              {t === 'elementos' ? 'Elementos' : 'Acabamento'}
            </button>
          ))}
        </div>

        {tab === 'elementos' && (
          <div className="flex-1 overflow-y-auto py-1">
            {ELEMS.map(el => {
              const active = el.isActive(countertop)
              return (
                <button key={el.id} onClick={() => setCountertop(el.toggle(countertop))}
                  className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors flex items-center gap-2 border-l-2 ${active ? 'bg-primary-container/20 text-primary border-primary' : 'text-secondary hover:text-on-surface hover:bg-surface-container-high border-transparent'}`}>
                  <span className="material-symbols-outlined text-[14px] flex-shrink-0"
                    style={active ? { fontVariationSettings:"'FILL' 1" } : {}}>{el.icon}</span>
                  <span className="truncate">{el.label}</span>
                </button>
              )
            })}
            {/* Braço info */}
            <div className="mx-3 mt-4 mb-1 p-2 rounded-lg bg-surface-container-highest border border-outline-variant">
              <p className="text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Braço Lateral</p>
              <p className="text-[11px] font-mono text-on-surface">{D} × {SL} cm</p>
              <p className="text-[9px] text-secondary mt-0.5">automático (65% da largura)</p>
            </div>
          </div>
        )}

        {tab === 'acabamentos' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Frontão</p>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={30} value={countertop.frontaoHeight}
                  onChange={e => setCountertop({ frontaoHeight: Number(e.target.value) })}
                  className="w-16 bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-xs font-mono text-right focus:outline-none focus:border-primary" />
                <span className="text-[10px] text-secondary">cm</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Saia</p>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={20} value={countertop.saiaHeight}
                  onChange={e => setCountertop({ saiaHeight: Number(e.target.value) })}
                  className="w-16 bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-xs font-mono text-right focus:outline-none focus:border-primary" />
                <span className="text-[10px] text-secondary">cm</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Laterais</p>
              {([{key:'frontaoLeft',label:'Esquerda'},{key:'frontaoRight',label:'Direita'}] as const).map(item => (
                <button key={item.key} onClick={() => setCountertop({ [item.key]: !countertop[item.key] })}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs border transition-colors mb-1 ${countertop[item.key] ? 'border-primary/30 bg-primary-container/10 text-primary' : 'border-outline-variant text-secondary hover:bg-surface-container-high'}`}>
                  <span>{item.label}</span>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: countertop[item.key] ? "'FILL' 1":"'FILL' 0" }}>
                    {countertop[item.key] ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                </button>
              ))}
            </div>
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Borda</p>
              <div className="grid grid-cols-3 gap-1">
                {(['reto','chanfro','boleado'] as const).map(cs => (
                  <button key={cs} onClick={() => setCountertop({ cornerStyle: cs })}
                    className={`py-1.5 rounded text-[10px] font-medium capitalize border transition-colors ${countertop.cornerStyle === cs ? 'border-primary bg-primary-container/20 text-primary' : 'border-outline-variant text-secondary hover:text-on-surface'}`}>{cs}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dimensões bottom */}
        <div className="border-t border-outline-variant px-3 py-3 flex-shrink-0 space-y-2">
          <p className="text-[9px] font-bold text-secondary uppercase tracking-widest">DIMENSÕES (CM)</p>
          {([{key:'width',label:'Largura'},{key:'depth',label:'Prof.'}] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-secondary">{item.label}</span>
              <input type="number" value={countertop[item.key]}
                onChange={e => setCountertop({ [item.key]: Number(e.target.value) })}
                className="w-16 bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-xs font-mono text-right focus:outline-none focus:border-primary" />
            </div>
          ))}
        </div>
      </div>

      {/* ════════ MAIN CANVAS AREA ════════ */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 border-b border-outline-variant bg-surface-container-low"
          style={{ height: TOOLBAR_H }}>
          <button onClick={() => setSnapOn(!snapOn)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${snapOn ? 'border-primary/50 bg-primary-container/20 text-primary' : 'border-outline-variant text-secondary hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-[14px]">grid_4x4</span>
            Snap 5cm
          </button>
          <div className="w-px h-4 bg-outline-variant" />
          <button onClick={() => setZoom(z => Math.max(0.2, z * 0.88))} className="p-1 text-secondary hover:text-on-surface rounded"><span className="material-symbols-outlined text-[16px]">remove</span></button>
          <span className="text-[10px] font-mono text-secondary w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(8, z * 1.13))} className="p-1 text-secondary hover:text-on-surface rounded"><span className="material-symbols-outlined text-[16px]">add</span></button>
          <button onClick={fitScreen} className="p-1 text-secondary hover:text-on-surface rounded"><span className="material-symbols-outlined text-[16px]">fit_screen</span></button>
          <div className="w-px h-4 bg-outline-variant" />
          <span className="text-[10px] text-secondary/60">
            Scroll = zoom · ⊕ nas arestas → acabamentos · clique elemento = seleção
          </span>
        </div>

        {/* SVG canvas */}
        <div className="flex-1 relative overflow-hidden" style={{ cursor: activeCursor }}>
          <svg ref={svgRef} className="w-full h-full"
            onMouseDown={e => {
              if (panMode || e.button === 1) {
                setDrag({ kind:'canvas', startMX:e.clientX, startMY:e.clientY, startOffX:pan.x, startOffY:pan.y })
              } else {
                setEdgeMenu(null)
              }
            }}
          >
            {/* Grid */}
            {gridLines.map((l, i) => (
              <g key={i}>
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke={l.major ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.025)'}
                  strokeWidth={l.major ? 1 : 0.5} />
                {l.label && (
                  <text x={l.isV ? l.x1 : toSVG(0,0)[0]-8} y={l.isV ? toSVG(0,0)[1]-8 : l.y1}
                    textAnchor="middle" dominantBaseline="auto"
                    fontSize={9} fill="rgba(255,255,255,0.2)" fontFamily="monospace">{l.label}</text>
                )}
              </g>
            ))}

            {/* L-shape */}
            <polygon points={pts}
              fill="rgba(30,27,40,0.85)"
              stroke={ACCENT} strokeWidth={2} strokeLinejoin="miter"
            />

            {/* Sink */}
            {countertop.hasSink && (
              <g style={{ cursor:'pointer' }} onClick={() => setSelElem(s => s === 'sink' ? null : 'sink')}>
                <rect x={skX} y={skY} width={skW} height={skH} rx={3}
                  fill={selElem === 'sink' ? 'rgba(167,139,250,0.12)' : 'rgba(0,0,0,0.4)'}
                  stroke={selElem === 'sink' ? ACCENT : 'rgba(255,255,255,0.3)'} strokeWidth={selElem === 'sink' ? 1.5 : 1}
                  strokeDasharray={selElem === 'sink' ? undefined : '4 2'} />
                <circle cx={skX + skW/2} cy={skY + skH/2} r={Math.min(skW,skH)*0.18}
                  fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
              </g>
            )}

            {/* Cooktop */}
            {countertop.hasCooktop && (
              <g style={{ cursor:'pointer' }} onClick={() => setSelElem(s => s === 'cooktop' ? null : 'cooktop')}>
                <rect x={ctX} y={ctY} width={ctW} height={ctH} rx={2}
                  fill={selElem === 'cooktop' ? 'rgba(167,139,250,0.12)' : 'rgba(10,10,20,0.8)'}
                  stroke={selElem === 'cooktop' ? ACCENT : 'rgba(255,255,255,0.25)'} strokeWidth={selElem === 'cooktop' ? 1.5 : 1}
                  strokeDasharray={selElem === 'cooktop' ? undefined : '4 2'} />
                {[[-0.27,-0.25],[0.27,-0.25],[0,-0.05],[0, 0.3]].map(([ox,oy],i) => (
                  <circle key={i} cx={ctX+ctW/2+ctW*ox} cy={ctY+ctH/2+ctH*oy}
                    r={Math.min(ctW,ctH)*0.12} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
                ))}
              </g>
            )}

            {/* ── Dimension lines ── */}
            {/* Main arm width: W across top of main arm */}
            {(() => {
              const [x0] = toSVG(0, SL); const [x1] = toSVG(W, SL)
              const y = toSVG(0, SL)[1] - DIM_OFF
              const mx = (x0+x1)/2
              return (
                <g>
                  <line x1={x0} y1={y} x2={x1} y2={y} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <line x1={x0} y1={y-TICK/2} x2={x0} y2={y+TICK/2} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <line x1={x1} y1={y-TICK/2} x2={x1} y2={y+TICK/2} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <rect x={mx-28} y={y-11} width={56} height={16} rx={4} fill="#09090b" stroke={ACCENT} strokeWidth={0.5} opacity={0.85} />
                  <text x={mx} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="700" fill={ACCENT} fontFamily="monospace">{W}.0 cm</text>
                </g>
              )
            })()}

            {/* Main arm depth: D on right side */}
            {(() => {
              const [x] = toSVG(W, 0); const rx = x + DIM_OFF
              const y0 = toSVG(0, SL)[1]; const y1 = toSVG(0, SL+D)[1]
              const my = (y0+y1)/2
              return (
                <g>
                  <line x1={rx} y1={y0} x2={rx} y2={y1} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <line x1={rx-TICK/2} y1={y0} x2={rx+TICK/2} y2={y0} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <line x1={rx-TICK/2} y1={y1} x2={rx+TICK/2} y2={y1} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                  <rect x={rx+6} y={my-9} width={52} height={16} rx={4} fill="#09090b" stroke={ACCENT} strokeWidth={0.5} opacity={0.85} />
                  <text x={rx+32} y={my} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="700" fill={ACCENT} fontFamily="monospace">{D}.0 cm</text>
                </g>
              )
            })()}

            {/* Arm length SL: left side */}
            {(() => {
              const [x] = toSVG(0, 0); const lx = x - DIM_OFF
              const y0 = toSVG(0, 0)[1]; const y1 = toSVG(0, SL)[1]
              const my = (y0+y1)/2
              return (
                <g>
                  <line x1={lx} y1={y0} x2={lx} y2={y1} stroke="rgba(167,139,250,0.5)" strokeWidth={1.5} strokeDasharray="4 2" />
                  <line x1={lx-TICK/2} y1={y0} x2={lx+TICK/2} y2={y0} stroke="rgba(167,139,250,0.5)" strokeWidth={1.5} />
                  <line x1={lx-TICK/2} y1={y1} x2={lx+TICK/2} y2={y1} stroke="rgba(167,139,250,0.5)" strokeWidth={1.5} />
                  <rect x={lx-50} y={my-9} width={42} height={16} rx={4} fill="#09090b" stroke="rgba(167,139,250,0.4)" strokeWidth={0.5} opacity={0.85} />
                  <text x={lx-29} y={my} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight="700" fill="rgba(167,139,250,0.65)" fontFamily="monospace">{SL} cm</text>
                </g>
              )
            })()}

            {/* Area label */}
            {(() => {
              const totalM2 = ((W * D) / 10000).toFixed(2)
              const [mx, my] = toSVG(W/2, SL + D/2)
              return (
                <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle"
                  fontSize={14} fill="rgba(167,139,250,0.25)" fontFamily="monospace" fontWeight="700">
                  {totalM2} m²
                </text>
              )
            })()}

            {/* Corner handles */}
            {CORNERS.map(h => {
              const [hx, hy] = toSVG(...h.pt)
              return (
                <g key={h.id} style={{ cursor: h.cur }}
                  onMouseDown={e => { e.stopPropagation()
                    setDrag({ kind:'corner', cornerId:h.id, startMX:e.clientX, startMY:e.clientY, startW:W, startD:D }) }}>
                  <circle cx={hx} cy={hy} r={12} fill="transparent" />
                  <circle cx={hx} cy={hy} r={6} fill="#0c0c0f" stroke={ACCENT} strokeWidth={2} />
                </g>
              )
            })}

            {/* Edge handles (+) */}
            {EDGE_HANDLES.map(h => {
              const [hx, hy] = toSVG(...h.cm)
              const active = edgeMenu === h.id
              return (
                <g key={h.id} style={{ cursor:'pointer' }}
                  onClick={e => { e.stopPropagation(); setEdgeMenu(edgeMenu === h.id ? null : h.id) }}>
                  <circle cx={hx} cy={hy} r={12} fill="transparent" />
                  <rect x={hx-8} y={hy-8} width={16} height={16} rx={4}
                    fill={active ? ACCENT : '#1a1a2e'} stroke={active ? ACCENT : 'rgba(167,139,250,0.6)'} strokeWidth={1.5} />
                  <line x1={hx-4} y1={hy} x2={hx+4} y2={hy} stroke={active ? '#000':'rgba(167,139,250,0.9)'} strokeWidth={1.5} />
                  <line x1={hx} y1={hy-4} x2={hx} y2={hy+4} stroke={active ? '#000':'rgba(167,139,250,0.9)'} strokeWidth={1.5} />
                </g>
              )
            })}

            {/* L label tag */}
            {(() => {
              const [ax, ay] = toSVG(D/2, SL/2)
              return (
                <text x={ax} y={ay} textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fill="rgba(167,139,250,0.3)" fontFamily="monospace" fontWeight="700">
                  BRAÇO
                </text>
              )
            })()}

            {/* Bottom info bar */}
            {(() => {
              const [bx, by] = toSVG(W/2, SL+D)
              return (
                <text x={bx} y={by+16} textAnchor="middle" dominantBaseline="hanging"
                  fontSize={9} fill="rgba(255,255,255,0.2)" fontFamily="monospace">
                  {W} × {D} cm · braço {D} × {SL} cm · esp. {countertop.thickness} cm
                </text>
              )
            })()}
          </svg>

          {/* Edge menu popup */}
          {edgeMenu && <EdgeMenuPopup id={edgeMenu} />}
        </div>
      </div>
    </div>
  )
}
