import type { ProjectType, CountertopConfig } from '../../types'

interface Props {
  projectType: ProjectType
  countertop: CountertopConfig
}

const COLORS = {
  bg:       '#08090d',
  fill:     'rgba(167,139,250,0.10)',
  stroke:   '#a78bfa',
  dim:      'rgba(167,139,250,0.55)',
  label:    '#c4b5fd',
  sub:      'rgba(167,139,250,0.50)',
  grid:     'rgba(255,255,255,0.03)',
}

const FONT = "'Geist', 'Geist Mono', monospace"
const VW = 700
const VH = 460
const PAD = 70

// Horizontal dimension line with label
function HorizDim({ x1, y, x2, label, above = true }: {
  x1: number; y: number; x2: number; label: string; above?: boolean
}) {
  const lx = (x1 + x2) / 2
  const ly = above ? y - 22 : y + 22
  const ticH = 8
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={COLORS.dim} strokeWidth="1.5" />
      <line x1={x1} y1={y - ticH / 2} x2={x1} y2={y + ticH / 2} stroke={COLORS.dim} strokeWidth="1.5" />
      <line x1={x2} y1={y - ticH / 2} x2={x2} y2={y + ticH / 2} stroke={COLORS.dim} strokeWidth="1.5" />
      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
        fill={COLORS.label} fontSize="13" fontFamily={FONT} fontWeight="700">
        {label}
      </text>
    </g>
  )
}

// Vertical dimension line with label
function VertDim({ x, y1, y2, label, leftSide = true }: {
  x: number; y1: number; y2: number; label: string; leftSide?: boolean
}) {
  const ly = (y1 + y2) / 2
  const lx = leftSide ? x - 24 : x + 24
  const ticW = 8
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={COLORS.dim} strokeWidth="1.5" />
      <line x1={x - ticW / 2} y1={y1} x2={x + ticW / 2} y2={y1} stroke={COLORS.dim} strokeWidth="1.5" />
      <line x1={x - ticW / 2} y1={y2} x2={x + ticW / 2} y2={y2} stroke={COLORS.dim} strokeWidth="1.5" />
      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
        fill={COLORS.label} fontSize="13" fontFamily={FONT} fontWeight="700"
        transform={`rotate(-90, ${lx}, ${ly})`}>
        {label}
      </text>
    </g>
  )
}

export default function DimensionSchematic({ projectType, countertop }: Props) {
  const { width: W, depth: D } = countertop

  const isL = projectType === 'bancada_l' || projectType === 'churrasqueira_gourmet'
  const isU = projectType === 'bancada_u'

  // Arm dimensions mirroring BancadaL/BancadaUModel proportions
  const armW = D                       // arm width (in top-down) = depth of main arm
  const armLenL = Math.round(W * 0.65) // BancadaL arm length
  const armLenU = Math.round(W * 0.55) // BancadaU arm length
  const armLen = isL ? armLenL : armLenU

  // Bounding box in cm
  const bbW = W
  const bbH = isL || isU ? armLen + D : D

  // Scale to fit viewport
  const scaleX = (VW - PAD * 2) / bbW
  const scaleY = (VH - PAD * 2) / bbH
  const scale  = Math.min(scaleX, scaleY) * 0.82

  const sw  = W * scale       // shape width in px
  const sd  = D * scale       // main arm depth in px
  const saw = armW * scale    // arm width in px
  const sal = armLen * scale  // arm length in px

  // Origin: top-left of the bounding box, centered
  const ox = (VW - sw) / 2
  const oy = (VH - (isL || isU ? sal + sd : sd)) / 2

  // Shape paths  ──────────────────────────────────────────────
  let shapePath = ''

  if (isL) {
    // ┌──┐
    // │  │
    // │  ├────────────────────────┐
    // └──┴────────────────────────┘
    shapePath = [
      `M ${ox}        ${oy}`,
      `H ${ox + saw}`,
      `V ${oy + sal}`,
      `H ${ox + sw}`,
      `V ${oy + sal + sd}`,
      `H ${ox}`,
      `Z`,
    ].join(' ')
  } else if (isU) {
    // ┌──┐              ┌──┐
    // │  │              │  │
    // │  ├──────────────┤  │
    // └──┴──────────────┴──┘
    shapePath = [
      `M ${ox}           ${oy}`,
      `H ${ox + saw}`,
      `V ${oy + sal}`,
      `H ${ox + sw - saw}`,
      `V ${oy}`,
      `H ${ox + sw}`,
      `V ${oy + sal + sd}`,
      `H ${ox}`,
      `Z`,
    ].join(' ')
  } else {
    // ┌──────────────────────────┐
    // │                          │
    // └──────────────────────────┘
    shapePath = `M ${ox} ${oy} H ${ox + sw} V ${oy + sd} H ${ox} Z`
  }

  // Reference Y for main arm
  const mainY = isL || isU ? oy + sal : oy

  // Shape name label
  const LABELS: Partial<Record<string, string>> = {
    bancada_l: 'Bancada em L',
    bancada_u: 'Bancada em U',
    ilha: 'Ilha de Cozinha',
    lavanderia: 'Bancada Lavanderia',
    tampo: 'Tampo',
    churrasqueira_gourmet: 'Churrasqueira / Gourmet',
  }
  const shapeLabel = LABELS[projectType] ?? 'Bancada'

  return (
    <div className="w-full h-full" style={{ background: COLORS.bg }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full h-full"
        style={{ display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid pattern */}
        <defs>
          <pattern id="sc-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke={COLORS.grid} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={VW} height={VH} fill="url(#sc-grid)" />

        {/* Shape */}
        <path d={shapePath} fill={COLORS.fill} stroke={COLORS.stroke} strokeWidth="2" strokeLinejoin="miter" />

        {/* ── Dimension lines ── */}

        {/* Width: across the full top of the shape */}
        <HorizDim
          x1={ox} y={isL || isU ? oy - 28 : oy - 28}
          x2={ox + sw}
          label={`${W} cm`}
          above
        />

        {/* Main arm depth: right side */}
        <VertDim
          x={ox + sw + 30} y1={mainY} y2={mainY + sd}
          label={`${D} cm`}
          leftSide={false}
        />

        {/* Arm length for L/U */}
        {(isL || isU) && (
          <VertDim
            x={ox - 30} y1={oy} y2={oy + sal}
            label={`${armLen} cm`}
            leftSide
          />
        )}

        {/* Arm width for L (left side) */}
        {isL && (
          <HorizDim
            x1={ox} y={mainY + sd + 28}
            x2={ox + saw}
            label={`${armW} cm`}
            above={false}
          />
        )}

        {/* Center area info label */}
        <text
          x={isL ? ox + saw + (sw - saw) / 2 : ox + sw / 2}
          y={mainY + sd / 2}
          textAnchor="middle" dominantBaseline="middle"
          fill={COLORS.sub} fontSize="13" fontFamily={FONT}
        >
          {(W * D / 10000).toFixed(2)} m²
        </text>

        {/* Top legend */}
        <text x={VW / 2} y={16} textAnchor="middle" dominantBaseline="hanging"
          fill="rgba(167,139,250,0.35)" fontSize="10" fontFamily={FONT}
          fontWeight="700" letterSpacing="2">
          VISTA SUPERIOR — {shapeLabel.toUpperCase()}
        </text>

        {/* Thickness label (bottom-right) */}
        <text x={VW - 12} y={VH - 12} textAnchor="end" dominantBaseline="auto"
          fill="rgba(167,139,250,0.35)" fontSize="10" fontFamily={FONT}>
          espessura: {countertop.thickness} cm
        </text>
      </svg>
    </div>
  )
}
