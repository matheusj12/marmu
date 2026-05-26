import type { PriceBreakdown } from '../../lib/priceCalc'
import { fmtBRL } from '../../lib/priceCalc'

interface PricePanelProps {
  breakdown: PriceBreakdown
  brandColor?: string     // cor primária do tenant (configurador público)
  compact?: boolean       // modo compacto para painéis estreitos
}

export default function PricePanel({ breakdown: b, brandColor, compact = false }: PricePanelProps) {
  const accent = brandColor ?? 'var(--color-primary, #a78bfa)'

  const rows = [
    { label: `Pedra (${b.baseAreaM2.toFixed(2)} m²)`, value: b.stoneCost,       show: b.stoneCost > 0 },
    { label: `Saia (${b.mlSaia.toFixed(2)} ml)`,       value: b.saiaCost,        show: b.saiaCost > 0  },
    { label: `Frontão (${b.mlFrontao.toFixed(2)} ml)`, value: b.frontaoCost,     show: b.frontaoCost > 0 },
    { label: 'Mão de obra / extras',                   value: b.fabricationCost, show: b.fabricationCost > 0 },
  ]

  return (
    <div className="bg-surface-container-highest rounded-xl border border-outline-variant overflow-hidden">

      {/* Header */}
      {!compact && (
        <div className="px-4 py-2.5 border-b border-outline-variant flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ color: accent, fontVariationSettings: "'FILL' 1" }}
          >
            calculate
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: accent }}>
            Cálculo do Orçamento
          </span>
        </div>
      )}

      {/* Linha a linha */}
      <div className="px-4 py-3 space-y-2">
        {rows.filter((r) => r.show).map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <span className="text-xs text-on-surface-variant">{row.label}</span>
            <span className="text-xs font-mono text-on-surface tabular-nums">
              {fmtBRL(row.value)}
            </span>
          </div>
        ))}

        {/* Subtotal */}
        <div className="pt-2 border-t border-outline-variant flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-on-surface">Subtotal</span>
          <span className="text-xs font-mono font-bold text-on-surface tabular-nums">
            {fmtBRL(b.subtotal)}
          </span>
        </div>

        {/* Desconto */}
        {b.discountPct > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-tertiary">Desconto ({b.discountPct}%)</span>
            <span className="text-xs font-mono text-tertiary tabular-nums">
              - {fmtBRL(b.discountValue)}
            </span>
          </div>
        )}

        {/* Frete/Tax */}
        {b.tax > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-on-surface-variant">Frete / instalação</span>
            <span className="text-xs font-mono text-on-surface-variant tabular-nums">
              + {fmtBRL(b.tax)}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div
        className="px-4 py-3 flex items-center justify-between border-t border-outline-variant"
        style={{ backgroundColor: `${accent}12` }}
      >
        <span className="text-sm font-black text-on-surface">TOTAL</span>
        <span className="text-lg font-black font-mono tabular-nums" style={{ color: accent }}>
          {fmtBRL(b.total)}
        </span>
      </div>
    </div>
  )
}
