import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useConfiguratorStore } from '../../store/configuratorStore'
import type { CountertopConfig } from '../../types'

/* ───────────────────────── element catalog ───────────────────────── */
interface ElemDef {
  id: string; label: string; icon: string
  isActive: (c: CountertopConfig) => boolean
  toggle:   (c: CountertopConfig) => Partial<CountertopConfig>
}

const ELEMS: ElemDef[] = [
  {
    id: 'cuba_simples', label: 'Cuba Simples', icon: 'water_drop',
    isActive: c => c.hasSink && c.sinkType !== 'inox_sobrepor' && c.sinkWidth < 80,
    toggle:   c => c.hasSink && c.sinkType !== 'inox_sobrepor' && c.sinkWidth < 80
      ? { hasSink: false }
      : { hasSink: true, sinkType: 'inox_embutir', sinkWidth: 50, sinkDepth: 40, sinkX: 0 },
  },
  {
    id: 'cuba_dupla', label: 'Cuba Dupla', icon: 'water_drop',
    isActive: c => c.hasSink && c.sinkWidth >= 80,
    toggle:   c => c.hasSink && c.sinkWidth >= 80
      ? { hasSink: false }
      : { hasSink: true, sinkType: 'inox_embutir', sinkWidth: 85, sinkDepth: 40, sinkX: 0 },
  },
  {
    id: 'cuba_oval', label: 'Cuba Oval', icon: 'opacity',
    isActive: c => c.hasSink && c.sinkType === 'esculpida',
    toggle:   c => c.hasSink && c.sinkType === 'esculpida'
      ? { hasSink: false }
      : { hasSink: true, sinkType: 'esculpida', sinkWidth: 48, sinkDepth: 36, sinkX: 0 },
  },
  {
    id: 'cuba_sobrepor', label: 'Cuba Sobrepor', icon: 'circle',
    isActive: c => c.hasSink && c.sinkType === 'inox_sobrepor',
    toggle:   c => c.hasSink && c.sinkType === 'inox_sobrepor'
      ? { hasSink: false }
      : { hasSink: true, sinkType: 'inox_sobrepor', sinkWidth: 40, sinkDepth: 40, sinkX: 0 },
  },
  {
    id: 'cooktop', label: 'Cooktop', icon: 'local_fire_department',
    isActive: c => c.hasCooktop,
    toggle:   c => ({ hasCooktop: !c.hasCooktop }),
  },
  {
    id: 'torneira', label: 'Torneira Bancada', icon: 'plumbing',
    isActive: () => false,
    toggle:   () => ({}),
  },
]

/* ───────────────────────── types ───────────────────────── */
type CornerHandle = 'tl' | 'tr' | 'bl' | 'br'
type EdgeHandle   = 'tc' | 'bc' | 'ml' | 'mr'
type ElemEdge     = 'en' | 'es' | 'ew' | 'ee'
type PanelTab     = 'elementos' | 'acabamentos'
type SelElem      = 'sink' | 'cooktop' | null

interface DragState {
  kind:        'corner' | 'elem-move' | 'elem-resize' | 'canvas'
  cornerId?:   CornerHandle
  elemEdge?:   ElemEdge
  elemKind?:   SelElem
  startMX:     number; startMY: number
  startW?:     number; startD?: number
  startOffX?:  number; startOffY?: number
  startElemX?: number
  startEW?:    number; startED?: number
}

/* ───────────────────────── constants ───────────────────────── */
const ACCENT    = '#a78bfa'
const TERTIARY  = '#34d399'
const PANEL_W   = 160
const TOOLBAR_H = 34

/* ───────────────────────── Edge menu definition ───────────────────────── */
interface EdgeMenuDef {
  id:    EdgeHandle
  label: string
  cx:    (c: CountertopConfig) => number
  cy:    (c: CountertopConfig) => number
  /* popup Y offset: -1 = above handle, +1 = below */
  yDir:  -1 | 0 | 1
  xDir:  0 | -1 | 1
}

const EDGE_MENUS: EdgeMenuDef[] = [
  { id:'tc', label:'ARESTA TRASEIRA',  cx: c => c.width/2,  cy: () => 0,         yDir:-1, xDir:0  },
  { id:'bc', label:'ARESTA FRONTAL',   cx: c => c.width/2,  cy: c => c.depth,    yDir: 1, xDir:0  },
  { id:'ml', label:'ARESTA ESQUERDA',  cx: () => 0,         cy: c => c.depth/2,  yDir: 0, xDir:-1 },
  { id:'mr', label:'ARESTA DIREITA',   cx: c => c.width,    cy: c => c.depth/2,  yDir: 0, xDir: 1 },
]

/* ───────────────────────── component ───────────────────────── */
export default function Editor2D() {
  const svgRef     = useRef<SVGSVGElement>(null)
  const wrapRef    = useRef<HTMLDivElement>(null)
  const canvasRef  = useRef<HTMLDivElement>(null)

  const [size,     setSize]     = useState({ w: 880, h: 480 })
  const [zoom,     setZoom]     = useState(1.0)
  const [pan,      setPan]      = useState({ x: 0, y: 0 })
  const [centered, setCentered] = useState(false)
  const [snapOn,   setSnapOn]   = useState(true)
  const [panMode,  setPanMode]  = useState(false)
  const [drag,     setDrag]     = useState<DragState | null>(null)
  const [cursor,   setCursor]   = useState<{ x: number; y: number } | null>(null)
  const [tab,      setTab]      = useState<PanelTab>('elementos')
  const [selElem,  setSelElem]  = useState<SelElem>(null)
  const [edgeMenu, setEdgeMenu] = useState<EdgeHandle | null>(null)

  const { countertop, setCountertop, selectedMaterial } = useConfiguratorStore()

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

  /* canvas area */
  const cvW = size.w - PANEL_W
  const cvH = size.h - TOOLBAR_H
  const PAD = 72

  /* base scale */
  const baseScale = useMemo(() => {
    const sx = (cvW - PAD * 2) / (countertop.width  || 1)
    const sy = (cvH - PAD * 2) / (countertop.depth  || 1)
    return Math.min(sx, sy, 5)
  }, [cvW, cvH, countertop.width, countertop.depth])

  const effScale = baseScale * zoom

  /* auto-center */
  useEffect(() => {
    if (centered) return
    const bwPx = countertop.width * baseScale
    const bdPx = countertop.depth * baseScale
    setPan({ x: (cvW - bwPx) / 2, y: (cvH - bdPx) / 2 })
    setZoom(1)
    setCentered(true)
  }, [centered, cvW, cvH, baseScale, countertop.width, countertop.depth])

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

  /* element positions */
  const MARGIN     = 0.15 * countertop.width
  const sinkMaxOff = Math.max(0, countertop.width / 2 - countertop.sinkWidth  / 2 - MARGIN)
  const ctMaxOff   = Math.max(0, countertop.width / 2 - countertop.cooktopWidth / 2 - MARGIN)
  const sinkOffCm  = (countertop.sinkX  / 100) * sinkMaxOff
  const ctOffCm    = (countertop.cooktopX / 100) * ctMaxOff
  const sinkCX     = countertop.width / 2 + sinkOffCm
  const sinkCY     = countertop.depth * 0.36
  const ctCX       = countertop.width / 2 + ctOffCm
  const ctCY       = countertop.depth * 0.62

  /* mouse handlers */
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.startMX
    const dy = e.clientY - drag.startMY

    if (drag.kind === 'canvas') {
      setPan({ x: drag.startOffX! + dx, y: drag.startOffY! + dy }); return
    }
    if (drag.kind === 'elem-move' && drag.elemKind) {
      const dxCm = dx / effScale
      if (drag.elemKind === 'sink') {
        const newCX  = (countertop.width / 2 + drag.startElemX!) + dxCm
        const newOff = Math.max(-sinkMaxOff, Math.min(sinkMaxOff, newCX - countertop.width / 2))
        setCountertop({ sinkX: sinkMaxOff > 0 ? Math.round((newOff / sinkMaxOff) * 100) : 0 })
      } else {
        const newCX  = (countertop.width / 2 + drag.startElemX!) + dxCm
        const newOff = Math.max(-ctMaxOff, Math.min(ctMaxOff, newCX - countertop.width / 2))
        setCountertop({ cooktopX: ctMaxOff > 0 ? Math.round((newOff / ctMaxOff) * 100) : 0 })
      }
      return
    }
    if (drag.kind === 'elem-resize' && drag.elemKind) {
      const dxCm = dx / effScale; const dyCm = dy / effScale
      const edge = drag.elemEdge!; const ek = drag.elemKind
      const minW = 20, minD = 15
      if (ek === 'sink') {
        let w = drag.startEW!, d = drag.startED!
        if (edge === 'ew') w = snap(Math.max(minW, w - dxCm))
        if (edge === 'ee') w = snap(Math.max(minW, w + dxCm))
        if (edge === 'en') d = snap(Math.max(minD, d - dyCm))
        if (edge === 'es') d = snap(Math.max(minD, d + dyCm))
        setCountertop({ sinkWidth: w, sinkDepth: d })
      } else {
        let w = drag.startEW!, d = drag.startED!
        if (edge === 'ew') w = snap(Math.max(minW, w - dxCm))
        if (edge === 'ee') w = snap(Math.max(minW, w + dxCm))
        if (edge === 'en') d = snap(Math.max(minD, d - dyCm))
        if (edge === 'es') d = snap(Math.max(minD, d + dyCm))
        setCountertop({ cooktopWidth: w, cooktopDepth: d })
      }
      return
    }
    if (drag.kind === 'corner') {
      const dxCm = dx / effScale; const dyCm = dy / effScale
      let w = drag.startW!, d = drag.startD!
      switch (drag.cornerId) {
        case 'tl': w = snap(Math.max(40, w - dxCm)); d = snap(Math.max(20, d - dyCm)); break
        case 'tr': w = snap(Math.max(40, w + dxCm)); d = snap(Math.max(20, d - dyCm)); break
        case 'bl': w = snap(Math.max(40, w - dxCm)); d = snap(Math.max(20, d + dyCm)); break
        case 'br': w = snap(Math.max(40, w + dxCm)); d = snap(Math.max(20, d + dyCm)); break
      }
      setCountertop({ width: w, depth: d })
    }
  }, [drag, effScale, snap, countertop, sinkMaxOff, ctMaxOff, setCountertop])

  const onMouseUp = useCallback(() => setDrag(null), [])

  useEffect(() => {
    if (!drag) return
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
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
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); setPanMode(true) }
    }
    const ku  = (e: KeyboardEvent) => { if (e.code === 'Space') setPanMode(false) }
    const esc = (e: KeyboardEvent) => { if (e.code === 'Escape') { setSelElem(null); setEdgeMenu(null) } }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup',   ku)
    window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('keydown', esc) }
  }, [])

  function fitScreen() { setCentered(false) }

  /* derived SVG positions */
  const [bx0, by0] = toSVG(0, 0)
  const bwPx = countertop.width  * effScale
  const bdPx = countertop.depth  * effScale

  const sinkL = sinkCX - countertop.sinkWidth  / 2
  const sinkT = sinkCY - countertop.sinkDepth  / 2
  const [skX, skY] = toSVG(sinkL, sinkT)
  const skW = countertop.sinkWidth  * effScale
  const skH = countertop.sinkDepth  * effScale

  const ctL = ctCX - countertop.cooktopWidth  / 2
  const ctT = ctCY - countertop.cooktopDepth  / 2
  const [ctX, ctY] = toSVG(ctL, ctT)
  const ctW = countertop.cooktopWidth  * effScale
  const ctH = countertop.cooktopDepth  * effScale

  /* grid */
  const gridCm = useMemo(() => {
    const thresholds = [1, 2, 5, 10, 20, 50, 100]
    for (const s of thresholds) if (s * effScale >= 48) return s
    return 100
  }, [effScale])

  const gridLines = useMemo(() => {
    const lines: { x1:number; y1:number; x2:number; y2:number; major:boolean; label?:string; isV:boolean }[] = []
    const majorStep = gridCm * 5
    let cm = 0
    while (cm <= countertop.width + gridCm) {
      const [x] = toSVG(cm, 0)
      const major = cm % majorStep === 0
      lines.push({ x1:x, y1:by0-5, x2:x, y2:by0+bdPx+5, major, label: major ? String(cm) : undefined, isV:true })
      cm += gridCm
    }
    cm = 0
    while (cm <= countertop.depth + gridCm) {
      const [, y] = toSVG(0, cm)
      const major = cm % majorStep === 0
      lines.push({ x1:bx0-5, y1:y, x2:bx0+bwPx+5, y2:y, major, label: major ? String(cm) : undefined, isV:false })
      cm += gridCm
    }
    return lines
  }, [gridCm, countertop.width, countertop.depth, toSVG, bx0, by0, bwPx, bdPx])

  /* corner handles only for resize */
  const CORNERS: { id: CornerHandle; cx: number; cy: number; cur: string }[] = [
    { id:'tl', cx: 0,                 cy: 0,                  cur:'nwse-resize' },
    { id:'tr', cx: countertop.width,  cy: 0,                  cur:'nesw-resize' },
    { id:'bl', cx: 0,                 cy: countertop.depth,   cur:'nesw-resize' },
    { id:'br', cx: countertop.width,  cy: countertop.depth,   cur:'nwse-resize' },
  ]

  /* dimension constants */
  const DIM_OFF = 30
  const TICK    = 6

  /* element resize handles */
  function elemResizeHandles(ex: number, ey: number, ew: number, eh: number, ek: SelElem) {
    return (
      [
        { edge:'en' as ElemEdge, cx: ex+ew/2, cy: ey,     cur:'ns-resize' },
        { edge:'es' as ElemEdge, cx: ex+ew/2, cy: ey+eh,  cur:'ns-resize' },
        { edge:'ew' as ElemEdge, cx: ex,      cy: ey+eh/2, cur:'ew-resize' },
        { edge:'ee' as ElemEdge, cx: ex+ew,   cy: ey+eh/2, cur:'ew-resize' },
      ].map(h => (
        <g key={h.edge}>
          <rect x={h.cx-9} y={h.cy-9} width={18} height={18} fill="transparent" style={{ cursor: h.cur }}
            onMouseDown={e => { e.stopPropagation()
              const ew0 = ek === 'sink' ? countertop.sinkWidth  : countertop.cooktopWidth
              const ed0 = ek === 'sink' ? countertop.sinkDepth  : countertop.cooktopDepth
              setDrag({ kind:'elem-resize', elemEdge:h.edge, elemKind:ek,
                startMX:e.clientX, startMY:e.clientY, startEW:ew0, startED:ed0 })
            }} />
          <rect x={h.cx-5} y={h.cy-5} width={10} height={10} rx={2}
            fill="#0c0c0f" stroke={ACCENT} strokeWidth={1.5} style={{ pointerEvents:'none' }} />
        </g>
      ))
    )
  }

  /* distance callouts */
  function distanceCallouts(el: number, et: number, ew: number, ed: number) {
    const er = el + ew
    const bW = countertop.width
    const [svgEL] = toSVG(el, 0)
    const [svgER] = toSVG(er, 0)
    const svgEVY  = toSVG(0, et + ed * 0.5)[1]
    const dLeft   = Math.round(el)
    const dRight  = Math.round(bW - er)
    const [bSvgX0] = toSVG(0, 0)
    const [bSvgX1] = toSVG(bW, 0)
    const OFF = 22
    return (
      <g opacity={0.85}>
        {dLeft > 0 && (
          <g>
            <line x1={bSvgX0} y1={svgEVY+OFF} x2={svgEL} y2={svgEVY+OFF}
              stroke={TERTIARY} strokeWidth={1} strokeDasharray="3 2" />
            <polygon points={`${bSvgX0+7},${svgEVY+OFF-3} ${bSvgX0+7},${svgEVY+OFF+3} ${bSvgX0},${svgEVY+OFF}`} fill={TERTIARY} opacity={0.7} />
            <polygon points={`${svgEL-7},${svgEVY+OFF-3} ${svgEL-7},${svgEVY+OFF+3} ${svgEL},${svgEVY+OFF}`} fill={TERTIARY} opacity={0.7} />
            <rect x={(bSvgX0+svgEL)/2-20} y={svgEVY+OFF-9} width={40} height={14} rx={3}
              fill="#0c0c0f" stroke={TERTIARY} strokeWidth={0.5} opacity={0.9} />
            <text x={(bSvgX0+svgEL)/2} y={svgEVY+OFF+1}
              textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight="700"
              fill={TERTIARY} fontFamily="monospace">{dLeft} cm</text>
          </g>
        )}
        {dRight > 0 && (
          <g>
            <line x1={svgER} y1={svgEVY-OFF} x2={bSvgX1} y2={svgEVY-OFF}
              stroke={TERTIARY} strokeWidth={1} strokeDasharray="3 2" />
            <polygon points={`${svgER+7},${svgEVY-OFF-3} ${svgER+7},${svgEVY-OFF+3} ${svgER},${svgEVY-OFF}`} fill={TERTIARY} opacity={0.7} />
            <polygon points={`${bSvgX1-7},${svgEVY-OFF-3} ${bSvgX1-7},${svgEVY-OFF+3} ${bSvgX1},${svgEVY-OFF}`} fill={TERTIARY} opacity={0.7} />
            <rect x={(svgER+bSvgX1)/2-20} y={svgEVY-OFF-9} width={40} height={14} rx={3}
              fill="#0c0c0f" stroke={TERTIARY} strokeWidth={0.5} opacity={0.9} />
            <text x={(svgER+bSvgX1)/2} y={svgEVY-OFF+1}
              textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight="700"
              fill={TERTIARY} fontFamily="monospace">{dRight} cm</text>
          </g>
        )}
      </g>
    )
  }

  /* ─── Edge menu popup ─── */
  function EdgeMenuPopup({ id }: { id: EdgeHandle }) {
    const def = EDGE_MENUS.find(m => m.id === id)!
    const [hxSvg, hySvg] = toSVG(def.cx(countertop), def.cy(countertop))

    const POPUP_W = 200
    const POPUP_H = 240
    const HANDLE_OFFSET = 20

    let left = hxSvg - POPUP_W / 2
    let top  = hySvg + HANDLE_OFFSET

    if (def.yDir === -1) top = hySvg - POPUP_H - HANDLE_OFFSET
    if (def.xDir === -1) { left = hxSvg - POPUP_W - HANDLE_OFFSET; top = hySvg - POPUP_H / 2 }
    if (def.xDir ===  1) { left = hxSvg + HANDLE_OFFSET;           top = hySvg - POPUP_H / 2 }

    /* clamp inside canvas column */
    const safeLeft = Math.max(4, Math.min(cvW - POPUP_W - 4, left))
    const safeTop  = Math.max(TOOLBAR_H + 4, Math.min(cvH - POPUP_H + TOOLBAR_H - 4, top + TOOLBAR_H))

    /* options config */
    interface PopupOption {
      id: string; label: string; desc: string; icon: string
      isActive: boolean; hasValue?: boolean
      value?: number; unit?: string; min?: number; max?: number
      onToggle: () => void
      onValueChange?: (v: number) => void
    }

    const options: PopupOption[] = [
      {
        id:'frontao', label:'FRONTÃO', desc:'Painel traseiro',
        icon:'view_agenda',
        isActive: countertop.frontaoHeight > 0,
        hasValue: true, value: countertop.frontaoHeight, unit:'cm', min:0, max:30,
        onToggle: () => setCountertop({ frontaoHeight: countertop.frontaoHeight > 0 ? 0 : 8 }),
        onValueChange: v => setCountertop({ frontaoHeight: v }),
      },
      {
        id:'saia', label:'SAIA', desc:'Saia frontal vertical',
        icon:'border_bottom',
        isActive: countertop.saiaHeight > 0,
        hasValue: true, value: countertop.saiaHeight, unit:'cm', min:0, max:20,
        onToggle: () => setCountertop({ saiaHeight: countertop.saiaHeight > 0 ? 0 : 8 }),
        onValueChange: v => setCountertop({ saiaHeight: v }),
      },
      {
        id:'lateral_esq', label:'LATERAL ESQ.', desc:'Painel lateral esquerdo',
        icon:'border_left',
        isActive: countertop.frontaoLeft,
        onToggle: () => setCountertop({ frontaoLeft: !countertop.frontaoLeft }),
      },
      {
        id:'lateral_dir', label:'LATERAL DIR.', desc:'Painel lateral direito',
        icon:'border_right',
        isActive: countertop.frontaoRight,
        onToggle: () => setCountertop({ frontaoRight: !countertop.frontaoRight }),
      },
      {
        id:'borda', label:'BORDA', desc:'Perfil da aresta',
        icon:'rounded_corner',
        isActive: countertop.cornerStyle !== 'reto',
        onToggle: () => setCountertop({ cornerStyle: 'chanfro' }),
      },
    ]

    /* for edge 'tc' show frontão + laterals + borda; 'bc' show saia + borda; 'ml'/'mr' show lateral + borda */
    const visible: string[] = {
      tc: ['frontao', 'lateral_esq', 'lateral_dir', 'borda'],
      bc: ['saia', 'lateral_esq', 'lateral_dir', 'borda'],
      ml: ['lateral_esq', 'frontao', 'saia', 'borda'],
      mr: ['lateral_dir', 'frontao', 'saia', 'borda'],
    }[id]

    const shownOptions = options.filter(o => visible.includes(o.id))

    return (
      <div
        className="absolute z-30 bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl overflow-hidden"
        style={{ left: safeLeft, top: safeTop, width: POPUP_W }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <span className="text-[10px] font-bold text-secondary tracking-[0.15em] uppercase">{def.label}</span>
          <button onClick={() => setEdgeMenu(null)}
            className="text-secondary hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* options */}
        <div className="p-2 space-y-1">
          {shownOptions.map(opt => (
            <div key={opt.id} className={`rounded-xl border transition-all ${
              opt.isActive
                ? 'border-primary/40 bg-primary-container/10'
                : 'border-transparent hover:border-outline-variant hover:bg-surface-container'
            }`}>
              <button
                onClick={opt.onToggle}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[16px] ${opt.isActive ? 'text-primary' : 'text-secondary'}`}
                    style={opt.isActive ? { fontVariationSettings:"'FILL' 1" } : {}}>
                    {opt.icon}
                  </span>
                  <span className={`text-xs font-bold tracking-wider ${opt.isActive ? 'text-primary' : 'text-secondary'}`}>
                    {opt.label}
                  </span>
                </div>
                {opt.isActive ? (
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-primary text-[12px]" style={{ fontVariationSettings:"'FILL' 1" }}>check</span>
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border border-outline flex items-center justify-center flex-shrink-0 text-secondary">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                  </span>
                )}
              </button>

              {/* inline value editor */}
              {opt.isActive && opt.hasValue && opt.onValueChange && (
                <div className="px-3 pb-2.5 flex items-center gap-2"
                  onMouseDown={e => e.stopPropagation()}>
                  <button onClick={() => opt.onValueChange!(Math.max(opt.min!, (opt.value ?? 0) - 1))}
                    className="w-6 h-6 rounded bg-surface-container border border-outline-variant text-secondary hover:text-on-surface flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-[14px]">remove</span>
                  </button>
                  <input type="number" value={opt.value} min={opt.min} max={opt.max}
                    onChange={e => opt.onValueChange!(Number(e.target.value))}
                    className="flex-1 bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-primary text-on-surface" />
                  <button onClick={() => opt.onValueChange!(Math.min(opt.max!, (opt.value ?? 0) + 1))}
                    className="w-6 h-6 rounded bg-surface-container border border-outline-variant text-secondary hover:text-on-surface flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                  </button>
                  <span className="text-[10px] text-secondary">{opt.unit}</span>
                </div>
              )}

              {/* borda style picker inline */}
              {opt.isActive && opt.id === 'borda' && (
                <div className="px-3 pb-2.5 grid grid-cols-3 gap-1"
                  onMouseDown={e => e.stopPropagation()}>
                  {(['reto','chanfro','boleado'] as const).map(cs => (
                    <button key={cs} onClick={() => setCountertop({ cornerStyle: cs })}
                      className={`py-1 rounded text-[9px] font-bold capitalize transition-colors border ${
                        countertop.cornerStyle === cs
                          ? 'border-primary bg-primary-container/20 text-primary'
                          : 'border-outline-variant text-secondary hover:text-on-surface'
                      }`}>{cs}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* cursor style */
  const activeCursor = panMode
    ? (drag ? 'grabbing' : 'grab')
    : (drag?.kind === 'elem-move' || drag?.kind === 'elem-resize') ? 'grabbing'
    : 'default'

  const selInfo = selElem === 'sink'
    ? { label:'Cuba', w: countertop.sinkWidth, d: countertop.sinkDepth }
    : selElem === 'cooktop'
    ? { label:'Cooktop', w: countertop.cooktopWidth, d: countertop.cooktopDepth }
    : null

  return (
    <div ref={wrapRef} className="flex w-full h-full overflow-hidden bg-[#09090b]" style={{ userSelect:'none' }}>

      {/* ════════ LEFT PANEL ════════ */}
      <div className="flex-shrink-0 border-r border-outline-variant bg-surface-container flex flex-col" style={{ width: PANEL_W }}>

        <div className="flex border-b border-outline-variant flex-shrink-0">
          {(['elementos','acabamentos'] as PanelTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                tab === t ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-on-surface'
              }`}>
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
                  className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors flex items-center gap-2 border-l-2 ${
                    active
                      ? 'bg-primary-container/20 text-primary border-primary'
                      : 'text-secondary hover:text-on-surface hover:bg-surface-container-high border-transparent'
                  }`}>
                  <span className="material-symbols-outlined text-[14px] flex-shrink-0"
                    style={active ? { fontVariationSettings:"'FILL' 1" } : {}}>{el.icon}</span>
                  <span className="truncate">{el.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {tab === 'acabamentos' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Frontão Traseiro</p>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={30} value={countertop.frontaoHeight}
                  onChange={e => setCountertop({ frontaoHeight: Number(e.target.value) })}
                  className="w-16 bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-xs font-mono text-right focus:outline-none focus:border-primary" />
                <span className="text-[10px] text-secondary">cm</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Saia Frontal</p>
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
                <button key={item.key}
                  onClick={() => setCountertop({ [item.key]: !countertop[item.key] })}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs border transition-colors mb-1 ${
                    countertop[item.key]
                      ? 'border-primary/30 bg-primary-container/10 text-primary'
                      : 'border-outline-variant text-secondary hover:bg-surface-container-high'
                  }`}>
                  <span>{item.label}</span>
                  <span className="material-symbols-outlined text-[14px]"
                    style={{ fontVariationSettings: countertop[item.key] ? "'FILL' 1":"'FILL' 0" }}>
                    {countertop[item.key] ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                </button>
              ))}
            </div>
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Canto / Borda</p>
              <div className="grid grid-cols-3 gap-1">
                {(['reto','chanfro','boleado'] as const).map(cs => (
                  <button key={cs} onClick={() => setCountertop({ cornerStyle: cs })}
                    className={`py-1.5 rounded text-[10px] font-medium capitalize transition-colors border ${
                      countertop.cornerStyle === cs
                        ? 'border-primary bg-primary-container/10 text-primary'
                        : 'border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-container-high'
                    }`}>{cs}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-2">Espessura</p>
              <div className="grid grid-cols-3 gap-1">
                {[2,3,4].map(t => (
                  <button key={t} onClick={() => setCountertop({ thickness: t })}
                    className={`py-1.5 rounded text-[10px] font-medium transition-colors border ${
                      countertop.thickness === t
                        ? 'border-primary bg-primary-container/10 text-primary'
                        : 'border-outline-variant text-secondary hover:text-on-surface'
                    }`}>{t}cm</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* selected element inspector */}
        {selInfo && (
          <div className="border-t border-primary/30 bg-primary-container/5 p-3 flex-shrink-0">
            <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-2">{selInfo.label}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {([{label:'L', key: selElem === 'sink' ? 'sinkWidth' : 'cooktopWidth', val: selInfo.w },
                 {label:'P', key: selElem === 'sink' ? 'sinkDepth' : 'cooktopDepth', val: selInfo.d }
              ] as { label:string; key:keyof CountertopConfig; val:number }[]).map(f => (
                <div key={f.key}>
                  <span className="text-[9px] text-secondary block mb-0.5">{f.label} (cm)</span>
                  <input type="number" min={10} value={f.val}
                    onChange={e => setCountertop({ [f.key]: Number(e.target.value) })}
                    className="w-full bg-surface-container-highest border border-primary/30 rounded px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-primary text-primary" />
                </div>
              ))}
            </div>
            <button onClick={() => {
              if (selElem === 'sink')    setCountertop({ hasSink: false })
              if (selElem === 'cooktop') setCountertop({ hasCooktop: false })
              setSelElem(null)
            }} className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] text-error/70 hover:text-error transition-colors py-1 border border-transparent hover:border-error/30 rounded">
              <span className="material-symbols-outlined text-[12px]">delete</span> Remover
            </button>
          </div>
        )}

        <div className="border-t border-outline-variant p-3 space-y-2 flex-shrink-0">
          <p className="text-[9px] font-bold text-secondary uppercase tracking-widest">Dimensões (cm)</p>
          {([{key:'width',label:'Largura'},{key:'depth',label:'Prof.'}] as const).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-[10px] text-secondary">{label}</span>
              <input type="number" value={countertop[key]}
                onChange={e => setCountertop({ [key]: Number(e.target.value) })}
                className="w-16 bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-xs text-right font-mono focus:outline-none focus:border-primary" />
            </div>
          ))}
        </div>
      </div>

      {/* ════════ CANVAS COLUMN ════════ */}
      <div ref={canvasRef} className="flex-1 flex flex-col overflow-hidden relative">

        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 border-b border-outline-variant bg-surface-container-low"
          style={{ height: TOOLBAR_H }}>
          <button onClick={() => setSnapOn(s => !s)}
            className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-colors ${
              snapOn ? 'bg-primary-container/20 text-primary' : 'text-secondary hover:text-on-surface hover:bg-surface-container-highest'
            }`}>
            <span className="material-symbols-outlined text-[13px]">grid_4x4</span>
            Snap {snapOn ? '5cm' : 'OFF'}
          </button>
          <div className="w-px h-3 bg-outline-variant mx-0.5" />
          <button onClick={() => setZoom(z => Math.max(0.2, +(z - 0.25).toFixed(2)))}
            className="p-1 text-secondary hover:text-on-surface hover:bg-surface-container-highest rounded transition-colors">
            <span className="material-symbols-outlined text-[15px]">remove</span>
          </button>
          <span className="text-[10px] font-mono text-secondary w-9 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(8, +(z + 0.25).toFixed(2)))}
            className="p-1 text-secondary hover:text-on-surface hover:bg-surface-container-highest rounded transition-colors">
            <span className="material-symbols-outlined text-[15px]">add</span>
          </button>
          <button onClick={fitScreen} title="Encaixar na tela"
            className="p-1 text-secondary hover:text-on-surface hover:bg-surface-container-highest rounded transition-colors">
            <span className="material-symbols-outlined text-[15px]">fit_screen</span>
          </button>
          <div className="w-px h-3 bg-outline-variant mx-0.5" />
          {selElem ? (
            <span className="text-[10px] text-primary font-medium">
              <span className="material-symbols-outlined text-[12px] align-middle mr-0.5"
                style={{ fontVariationSettings:"'FILL' 1" }}>
                {selElem === 'sink' ? 'water_drop' : 'local_fire_department'}
              </span>
              {selElem === 'sink' ? 'Cuba' : 'Cooktop'} selecionado · Esc para deselecionar
            </span>
          ) : (
            <span className="text-[10px] text-secondary/40 hidden sm:inline">
              {panMode ? '🖐 pan ativo' : 'Scroll = zoom · ⊕ nas arestas = acabamentos · clique elemento = seleção'}
            </span>
          )}
          {cursor && (
            <span className="ml-auto text-[10px] font-mono text-secondary/50 tabular-nums">
              X:{cursor.x} · Y:{cursor.y} cm
            </span>
          )}
        </div>

        {/* SVG */}
        <svg ref={svgRef} className="flex-1 w-full block"
          style={{ cursor: activeCursor }}
          onMouseMove={e => {
            const r = svgRef.current!.getBoundingClientRect()
            const [cx, cy] = toCM(e.clientX - r.left, e.clientY - r.top)
            setCursor(cx >= 0 && cx <= countertop.width && cy >= 0 && cy <= countertop.depth
              ? { x: Math.round(cx), y: Math.round(cy) } : null)
          }}
          onMouseDown={e => {
            setEdgeMenu(null)
            if (panMode || e.button === 1) {
              e.preventDefault()
              setDrag({ kind:'canvas', startMX: e.clientX, startMY: e.clientY, startOffX: pan.x, startOffY: pan.y })
              return
            }
            setSelElem(null)
          }}
          onContextMenu={e => e.preventDefault()}
        >
          <defs>
            <filter id="grain" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9 0.5" numOctaves="4" seed="8" result="noise"/>
              <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
              <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blend"/>
              <feComposite in="blend" in2="SourceGraphic" operator="in"/>
            </filter>
            <linearGradient id="stoneSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.06"/>
              <stop offset="50%"  stopColor="white" stopOpacity="0"/>
              <stop offset="100%" stopColor="black" stopOpacity="0.08"/>
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill="#09090b" />

          {gridLines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={l.major ? '#222226' : '#141417'} strokeWidth={l.major ? 0.8 : 0.5} />
          ))}
          {gridLines.filter(l => l.label).map((l, i) => (
            l.isV
              ? <text key={`lv${i}`} x={(l.x1+l.x2)/2} y={by0-10}
                  textAnchor="middle" fontSize={8} fill="#3f3f46" fontFamily="monospace">{l.label}</text>
              : <text key={`lh${i}`} x={bx0-8} y={(l.y1+l.y2)/2}
                  textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#3f3f46" fontFamily="monospace">{l.label}</text>
          ))}

          {/* center guide */}
          {(() => {
            const [cx] = toSVG(countertop.width / 2, 0)
            return <line x1={cx} y1={by0} x2={cx} y2={by0+bdPx}
              stroke="#27272a" strokeWidth={0.75} strokeDasharray="4 4" />
          })()}

          {/* shadow */}
          <rect x={bx0+6} y={by0+6} width={bwPx} height={bdPx}
            rx={countertop.cornerStyle === 'boleado' ? 14 : 4} fill="rgba(0,0,0,0.6)" />

          {/* stone slab */}
          <rect x={bx0} y={by0} width={bwPx} height={bdPx}
            rx={countertop.cornerStyle === 'boleado' ? 14 : 4}
            fill={selectedMaterial.color} fillOpacity={0.80} stroke={ACCENT} strokeWidth={1.5} />
          <rect x={bx0} y={by0} width={bwPx} height={bdPx}
            rx={countertop.cornerStyle === 'boleado' ? 14 : 4}
            fill={selectedMaterial.color} fillOpacity={0.15} filter="url(#grain)" style={{ pointerEvents:'none' }} />
          <rect x={bx0} y={by0} width={bwPx} height={bdPx}
            rx={countertop.cornerStyle === 'boleado' ? 14 : 4}
            fill="url(#stoneSheen)" style={{ pointerEvents:'none' }} />

          {/* chanfro corners */}
          {countertop.cornerStyle === 'chanfro' && [
            [bx0, by0, bx0+14, by0, bx0, by0+14],
            [bx0+bwPx, by0, bx0+bwPx-14, by0, bx0+bwPx, by0+14],
            [bx0, by0+bdPx, bx0+14, by0+bdPx, bx0, by0+bdPx-14],
            [bx0+bwPx, by0+bdPx, bx0+bwPx-14, by0+bdPx, bx0+bwPx, by0+bdPx-14],
          ].map((pts, i) => (
            <polygon key={i} points={`${pts[0]},${pts[1]} ${pts[2]},${pts[3]} ${pts[4]},${pts[5]}`} fill="#09090b" />
          ))}

          {/* frontão traseiro */}
          {countertop.frontaoHeight > 0 && (() => {
            const fH = Math.max(4, countertop.frontaoHeight * effScale * 0.12)
            return (
              <>
                <rect x={bx0} y={by0} width={bwPx} height={fH}
                  fill={ACCENT} fillOpacity={0.30}
                  rx={countertop.cornerStyle === 'boleado' ? 14 : 4} />
                {fH > 12 && <text x={bx0+bwPx/2} y={by0+fH/2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.min(8, fH*0.6)} fill={ACCENT} fillOpacity={0.8} fontFamily="monospace" fontWeight="bold">
                  FRONTÃO
                </text>}
              </>
            )
          })()}

          {/* laterais */}
          {countertop.frontaoLeft && (
            <rect x={bx0} y={by0}
              width={Math.max(3, countertop.frontaoHeight * effScale * 0.10)} height={bdPx}
              fill={ACCENT} fillOpacity={0.13} />
          )}
          {countertop.frontaoRight && (
            <rect x={bx0+bwPx - Math.max(3, countertop.frontaoHeight * effScale * 0.10)} y={by0}
              width={Math.max(3, countertop.frontaoHeight * effScale * 0.10)} height={bdPx}
              fill={ACCENT} fillOpacity={0.13} />
          )}

          {/* saia */}
          {countertop.saiaHeight > 0 && (
            <rect x={bx0} y={by0+bdPx - Math.max(3, countertop.saiaHeight * effScale * 0.12)}
              width={bwPx} height={Math.max(3, countertop.saiaHeight * effScale * 0.12)}
              fill={ACCENT} fillOpacity={0.10} />
          )}

          {/* Cuba */}
          {countertop.hasSink && skW > 3 && skH > 3 && (
            <g style={{ cursor: selElem === 'sink' ? 'move' : 'pointer' }}
              onClick={e => { e.stopPropagation(); setSelElem(s => s === 'sink' ? null : 'sink') }}
              onMouseDown={e => {
                if (selElem !== 'sink') return
                e.stopPropagation()
                setDrag({ kind:'elem-move', elemKind:'sink',
                  startMX:e.clientX, startMY:e.clientY, startElemX:sinkOffCm })
              }}>
              {selElem === 'sink' && (
                <rect x={skX-4} y={skY-4} width={skW+8} height={skH+8}
                  rx={6} fill="none" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />
              )}
              {countertop.sinkType === 'inox_sobrepor'
                ? <ellipse cx={skX+skW/2} cy={skY+skH/2} rx={skW/2} ry={skH/2}
                    fill="rgba(0,0,0,0.55)" stroke={selElem === 'sink' ? ACCENT : '#6b7280'} strokeWidth={selElem === 'sink' ? 2 : 1.5} />
                : <rect x={skX} y={skY} width={skW} height={skH}
                    rx={countertop.sinkType === 'esculpida' ? skW*0.15 : 4}
                    fill="rgba(0,0,0,0.55)" stroke={selElem === 'sink' ? ACCENT : '#6b7280'} strokeWidth={selElem === 'sink' ? 2 : 1.5} />
              }
              <circle cx={skX+skW/2} cy={skY+skH/2}
                r={Math.max(3, Math.min(skW,skH)*0.09)} fill="none" stroke="#4b5563" strokeWidth={1} />
              {countertop.sinkWidth >= 80 && (
                <line x1={skX+skW/2} y1={skY+4} x2={skX+skW/2} y2={skY+skH-4} stroke="#4b5563" strokeWidth={1} />
              )}
              <text x={skX+skW/2} y={skY-7} textAnchor="middle" fontSize={9} fontWeight="600"
                fill={selElem === 'sink' ? ACCENT : '#9ca3af'} fontFamily="monospace">
                {countertop.sinkWidth}×{countertop.sinkDepth}
              </text>
            </g>
          )}

          {/* Cooktop */}
          {countertop.hasCooktop && ctW > 3 && ctH > 3 && (
            <g style={{ cursor: selElem === 'cooktop' ? 'move' : 'pointer' }}
              onClick={e => { e.stopPropagation(); setSelElem(s => s === 'cooktop' ? null : 'cooktop') }}
              onMouseDown={e => {
                if (selElem !== 'cooktop') return
                e.stopPropagation()
                setDrag({ kind:'elem-move', elemKind:'cooktop',
                  startMX:e.clientX, startMY:e.clientY, startElemX:ctOffCm })
              }}>
              {selElem === 'cooktop' && (
                <rect x={ctX-4} y={ctY-4} width={ctW+8} height={ctH+8}
                  rx={6} fill="none" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />
              )}
              <rect x={ctX} y={ctY} width={ctW} height={ctH} rx={3}
                fill="rgba(20,0,40,0.70)" stroke={selElem === 'cooktop' ? ACCENT : '#7c3aed'} strokeWidth={selElem === 'cooktop' ? 2 : 1.5} />
              {[0.26,0.74].flatMap(bx => [0.28,0.72].map(by => (
                <circle key={`${bx}${by}`} cx={ctX+ctW*bx} cy={ctY+ctH*by}
                  r={Math.max(3, Math.min(ctW*0.09, ctH*0.13))}
                  fill="none" stroke={selElem === 'cooktop' ? ACCENT : '#7c3aed'} strokeWidth={1} />
              )))}
              <text x={ctX+ctW/2} y={ctY-7} textAnchor="middle" fontSize={9} fontWeight="600"
                fill={selElem === 'cooktop' ? ACCENT : '#7c3aed'} fontFamily="monospace">
                {countertop.cooktopWidth}×{countertop.cooktopDepth}
              </text>
            </g>
          )}

          {/* distance callouts */}
          {selElem === 'sink' && countertop.hasSink &&
            distanceCallouts(sinkL, sinkT, countertop.sinkWidth, countertop.sinkDepth)}
          {selElem === 'cooktop' && countertop.hasCooktop &&
            distanceCallouts(ctL, ctT, countertop.cooktopWidth, countertop.cooktopDepth)}

          {/* element resize handles */}
          {selElem === 'sink'    && countertop.hasSink    && skW > 3 && skH > 3 && elemResizeHandles(skX, skY, skW, skH, 'sink')}
          {selElem === 'cooktop' && countertop.hasCooktop && ctW > 3 && ctH > 3 && elemResizeHandles(ctX, ctY, ctW, ctH, 'cooktop')}

          {/* area label */}
          <text x={bx0+bwPx/2} y={by0+bdPx/2}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(9, Math.min(15, bwPx/12))}
            fill={ACCENT} fillOpacity={0.18} fontFamily="monospace" fontWeight="700">
            {((countertop.width * countertop.depth) / 10000).toFixed(2)} m²
          </text>

          {/* FRENTE label */}
          <text x={bx0+bwPx/2} y={by0+bdPx+14}
            textAnchor="middle" fontSize={9} letterSpacing="4"
            fill="#3f3f46" fontFamily="monospace" fontWeight="700">FRENTE</text>

          {/* width dimension (top) */}
          <g>
            <line x1={bx0}      y1={by0-8}       x2={bx0}      y2={by0-DIM_OFF+TICK} stroke="#3f3f46" strokeWidth={1} />
            <line x1={bx0+bwPx} y1={by0-8}       x2={bx0+bwPx} y2={by0-DIM_OFF+TICK} stroke="#3f3f46" strokeWidth={1} />
            <line x1={bx0}      y1={by0-DIM_OFF}  x2={bx0+bwPx} y2={by0-DIM_OFF}      stroke="#52525b" strokeWidth={1} />
            <polygon points={`${bx0},${by0-DIM_OFF} ${bx0+7},${by0-DIM_OFF-3} ${bx0+7},${by0-DIM_OFF+3}`} fill="#52525b" />
            <polygon points={`${bx0+bwPx},${by0-DIM_OFF} ${bx0+bwPx-7},${by0-DIM_OFF-3} ${bx0+bwPx-7},${by0-DIM_OFF+3}`} fill="#52525b" />
            <rect x={bx0+bwPx/2-34} y={by0-DIM_OFF-11} width={68} height={17} rx={3}
              fill="#0c0c0f" stroke="#27272a" strokeWidth={1} />
            <text x={bx0+bwPx/2} y={by0-DIM_OFF-2}
              textAnchor="middle" fontSize={10} fontWeight="700" fill="#e4e4e7" fontFamily="monospace">
              {countertop.width.toFixed(1)} cm
            </text>
          </g>

          {/* depth dimension (right) */}
          <g>
            <line x1={bx0+bwPx+8}      y1={by0}      x2={bx0+bwPx+DIM_OFF-TICK} y2={by0}      stroke="#3f3f46" strokeWidth={1} />
            <line x1={bx0+bwPx+8}      y1={by0+bdPx} x2={bx0+bwPx+DIM_OFF-TICK} y2={by0+bdPx} stroke="#3f3f46" strokeWidth={1} />
            <line x1={bx0+bwPx+DIM_OFF} y1={by0}     x2={bx0+bwPx+DIM_OFF}      y2={by0+bdPx} stroke="#52525b" strokeWidth={1} />
            <polygon points={`${bx0+bwPx+DIM_OFF},${by0} ${bx0+bwPx+DIM_OFF-3},${by0+7} ${bx0+bwPx+DIM_OFF+3},${by0+7}`} fill="#52525b" />
            <polygon points={`${bx0+bwPx+DIM_OFF},${by0+bdPx} ${bx0+bwPx+DIM_OFF-3},${by0+bdPx-7} ${bx0+bwPx+DIM_OFF+3},${by0+bdPx-7}`} fill="#52525b" />
            <rect x={bx0+bwPx+DIM_OFF+4} y={by0+bdPx/2-9} width={56} height={17} rx={3}
              fill="#0c0c0f" stroke="#27272a" strokeWidth={1} />
            <text x={bx0+bwPx+DIM_OFF+32} y={by0+bdPx/2}
              textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight="700" fill="#e4e4e7" fontFamily="monospace">
              {countertop.depth.toFixed(1)} cm
            </text>
          </g>

          {/* WxD summary */}
          <text x={bx0+bwPx/2} y={by0+bdPx+30}
            textAnchor="middle" fontSize={8} fill="#27272a" fontFamily="monospace">
            {countertop.width} × {countertop.depth} cm · {countertop.thickness}cm esp.
          </text>

          {/* ── 4 corner resize handles ── */}
          {CORNERS.map(h => {
            const [hx, hy] = toSVG(h.cx, h.cy)
            return (
              <g key={h.id}>
                <rect x={hx-10} y={hy-10} width={20} height={20} fill="transparent"
                  style={{ cursor: h.cur }}
                  onMouseDown={e => { e.stopPropagation(); setDrag({
                    kind:'corner', cornerId: h.id,
                    startMX: e.clientX, startMY: e.clientY,
                    startW: countertop.width, startD: countertop.depth,
                  })}} />
                <circle cx={hx} cy={hy} r={7}  fill="#0e0e12" stroke={ACCENT} strokeWidth={1.5} style={{ pointerEvents:'none' }} />
                <circle cx={hx} cy={hy} r={3}  fill={ACCENT}                                     style={{ pointerEvents:'none' }} />
              </g>
            )
          })}

          {/* ── 4 edge "+" buttons ── */}
          {EDGE_MENUS.map(em => {
            const [hx, hy] = toSVG(em.cx(countertop), em.cy(countertop))
            const isOpen   = edgeMenu === em.id

            /* check if this edge has any active finishing */
            const hasActive = (
              (em.id === 'tc' && countertop.frontaoHeight > 0) ||
              (em.id === 'bc' && countertop.saiaHeight > 0) ||
              (em.id === 'ml' && countertop.frontaoLeft) ||
              (em.id === 'mr' && countertop.frontaoRight)
            )

            return (
              <g key={em.id} style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); setEdgeMenu(isOpen ? null : em.id) }}>
                {/* hit area */}
                <rect x={hx-12} y={hy-12} width={24} height={24} fill="transparent" />
                {/* badge */}
                <rect x={hx-10} y={hy-10} width={20} height={20} rx={4}
                  fill={isOpen ? ACCENT : hasActive ? '#1a0840' : '#0f0f12'}
                  stroke={isOpen ? ACCENT : hasActive ? ACCENT : '#3f3f46'}
                  strokeWidth={isOpen ? 0 : 1.2}
                  style={{ pointerEvents:'none' }} />
                {hasActive && !isOpen && (
                  <rect x={hx-10} y={hy-10} width={20} height={20} rx={4}
                    fill={ACCENT} fillOpacity={0.12} style={{ pointerEvents:'none' }} />
                )}
                <text x={hx} y={hy} textAnchor="middle" dominantBaseline="middle"
                  fontSize={14} fontWeight="700"
                  fill={isOpen ? '#0a0012' : hasActive ? ACCENT : '#71717a'}
                  fontFamily="monospace" style={{ pointerEvents:'none' }}>
                  {isOpen ? '×' : '+'}
                </text>
              </g>
            )
          })}
        </svg>

        {/* click-outside backdrop + edge popup */}
        {edgeMenu && (
          <>
            <div className="absolute inset-0 z-20" onClick={() => setEdgeMenu(null)} />
            <EdgeMenuPopup id={edgeMenu} />
          </>
        )}
      </div>

      {/* global drag cursor */}
      {drag && drag.kind !== 'corner' && (
        <div className="fixed inset-0 z-50" style={{ cursor: 'grabbing' }} />
      )}
    </div>
  )
}
