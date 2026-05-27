import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { loadProposal } from '../hooks/useProposal';
import { STONE_MATERIALS } from '../materials';
import { calcBudgets } from '../utils/calcBudgets';
import ThreeView from '../components/ThreeView';
import BudgetInvoice from '../components/BudgetInvoice';

export default function ProposalPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const snapshot = uuid ? loadProposal(uuid) : null;

  const material = useMemo(() => {
    if (!snapshot) return null;
    return STONE_MATERIALS.find(m => m.id === snapshot.selectedMaterialId) ?? STONE_MATERIALS[0];
  }, [snapshot]);

  const budgets = useMemo(() => {
    if (!snapshot || !material) return null;
    return calcBudgets(
      snapshot.projectType,
      snapshot.countertop,
      snapshot.staircase,
      material,
      snapshot.quote
    );
  }, [snapshot, material]);

  if (!snapshot || !material || !budgets) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">Proposta não encontrada</h1>
          <p className="text-zinc-400 text-sm">Este link pode ter expirado ou é inválido.</p>
        </div>
        <Link
          to="/"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all"
        >
          Voltar ao Editor
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">

      {/* Banner read-only */}
      <div className="bg-amber-900/80 border-b border-amber-700/50 text-amber-200 px-4 py-2.5 text-xs text-center flex items-center justify-center gap-2 font-medium">
        <Eye className="w-3.5 h-3.5" />
        Modo Visualização — Somente Leitura
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-[#121214]/90 backdrop-blur-md px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-base text-white">
          M
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white uppercase">
              MARMU <span className="text-blue-500">PRO</span>
            </h1>
            <span className="text-[9px] bg-amber-500/10 text-amber-400 font-mono font-bold px-2 py-0.5 rounded-full uppercase border border-amber-500/20">
              Proposta do Cliente
            </span>
          </div>
          {snapshot.quote.clientName && (
            <p className="text-[10px] text-zinc-500">
              Para: <span className="text-zinc-300 font-medium">{snapshot.quote.clientName}</span>
              {snapshot.quote.clientPhone && ` — ${snapshot.quote.clientPhone}`}
            </p>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">

        {/* 3D Viewer */}
        <div className="h-[420px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <ThreeView
            type={snapshot.projectType}
            countertop={snapshot.countertop}
            staircase={snapshot.staircase}
            material={material}
            autoRotate={false}
            readOnly={true}
          />

          <div className="absolute top-4 left-4 flex gap-2 pointer-events-none select-none z-10">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
              Visualização 3D
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
              Somente Leitura
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-3 flex gap-8 z-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">Área Útil</span>
              <span className="text-sm font-bold font-mono text-zinc-200">{budgets.baseAreaM2.toFixed(2)} m²</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">Material</span>
              <span className="text-sm font-bold font-mono text-zinc-200">{material.name}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">Total</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                R$ {budgets.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Budget Invoice */}
        <BudgetInvoice
          type={snapshot.projectType}
          countertop={snapshot.countertop}
          staircase={snapshot.staircase}
          material={material}
          quote={snapshot.quote}
          readOnly={true}
        />

      </div>

    </div>
  );
}
