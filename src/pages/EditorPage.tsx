import { useState, useMemo } from 'react';
import {
  Layers,
  Wrench,
  Ruler,
  Flame,
  Droplet,
  Cpu,
  Receipt,
  Check,
  Sliders,
  ArrowRight,
  Printer,
  RefreshCw,
  Eye,
  Settings,
  HelpCircle,
  TrendingUp,
  MapPin,
  Phone,
  User,
  Info,
  Link2
} from 'lucide-react';

import { STONE_MATERIALS } from '../materials';
import { ProjectType, CountertopConfig, StaircaseConfig, ClientQuote, StoneMaterial, ProposalSnapshot } from '../types';
import ThreeView from '../components/ThreeView';
import Editor2D from '../components/Editor2D';
import BudgetInvoice from '../components/BudgetInvoice';
import { saveProposal } from '../hooks/useProposal';

export default function EditorPage() {
  // --- STATE SYSTEM (Single Source of Truth) ---
  const [projectType, setProjectType] = useState<ProjectType>('pia');
  const [selectedMaterial, setSelectedMaterial] = useState<StoneMaterial>(STONE_MATERIALS[0]);
  const [materialFilter, setMaterialFilter] = useState<string>('todos');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showInvoice, setShowInvoice] = useState<boolean>(false);

  // --- LINK PÚBLICO STATE ---
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // --- CONFIG COUNTERTOP (Pia/Bancada) ---
  const [countertop, setCountertop] = useState<CountertopConfig>({
    width: 180,
    depth: 60,
    thickness: 2,
    saiaHeight: 4,
    frontaoHeight: 10,
    frontaoLeft: true,
    frontaoRight: false,
    cornerStyle: 'reto',
    hasSink: true,
    sinkType: 'inox_embutir',
    sinkWidth: 50,
    sinkDepth: 40,
    sinkX: 0,
    hasCooktop: false,
    cooktopWidth: 70,
    cooktopDepth: 50,
    cooktopX: 40
  });

  // --- CONFIG STAIRCASE (Escada) ---
  const [staircase, setStaircase] = useState<StaircaseConfig>({
    style: 'cascata',
    stepsCount: 5,
    stepWidth: 110,
    stepDepth: 30,
    stepHeight: 18,
    thickness: 2,
    hasSkirting: true,
    skirtingStyle: 'reto'
  });

  // --- CONFIG QUOTE CLIENT BILLING ---
  const [quote, setQuote] = useState<ClientQuote>({
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    discount: 5,
    tax: 350,
    observations: ''
  });

  // --- FILTERED MATERIALS ---
  const filteredMaterials = useMemo(() => {
    if (materialFilter === 'todos') return STONE_MATERIALS;
    return STONE_MATERIALS.filter(m => m.category === materialFilter);
  }, [materialFilter]);

  // --- CALCULATING COMPACT BUDGETS ---
  const budgets = useMemo(() => {
    let baseAreaM2 = 0;
    let mlSaia = 0;
    let mlFrontao = 0;
    let fabricationCost = 0;

    if (projectType === 'pia') {
      const wM = countertop.width / 100;
      const dM = countertop.depth / 100;

      baseAreaM2 = wM * dM;
      mlFrontao = wM;
      if (countertop.frontaoLeft) mlFrontao += dM;
      if (countertop.frontaoRight) mlFrontao += dM;

      mlSaia = wM + (2 * dM);

      if (countertop.hasSink) {
        fabricationCost += countertop.sinkType === 'esculpida' ? 450 : 150;
      }
      if (countertop.hasCooktop) {
        fabricationCost += 120;
      }
    } else {
      const swM = staircase.stepWidth / 100;
      const sdM = staircase.stepDepth / 100;
      const shM = staircase.stepHeight / 100;
      const steps = staircase.stepsCount;

      baseAreaM2 = steps * (swM * sdM);
      if (staircase.style !== 'flutuante') {
        baseAreaM2 += steps * (swM * (shM - 0.02));
      }
      if (staircase.hasSkirting) {
        mlFrontao = steps * (sdM + shM);
      }
      fabricationCost = steps * 40;
    }

    const stoneCost = baseAreaM2 * selectedMaterial.pricePerM2;
    const frontaoCost = mlFrontao * selectedMaterial.pricePerML_Frontao;
    const saiaCost = mlSaia * selectedMaterial.pricePerML_Saia;

    const subtotal = stoneCost + frontaoCost + saiaCost + fabricationCost;
    const discountAmount = subtotal * (quote.discount / 100);
    const total = subtotal - discountAmount + Number(quote.tax || 0);

    return {
      subtotal,
      discountAmount,
      total,
      baseAreaM2,
      mlFrontao,
      mlSaia,
      fabricationCost
    };
  }, [projectType, countertop, staircase, selectedMaterial, quote.discount, quote.tax]);

  const handleReset = () => {
    if (projectType === 'pia') {
      setCountertop({
        width: 180,
        depth: 60,
        thickness: 2,
        saiaHeight: 4,
        frontaoHeight: 10,
        frontaoLeft: true,
        frontaoRight: false,
        cornerStyle: 'reto',
        hasSink: true,
        sinkType: 'inox_embutir',
        sinkWidth: 50,
        sinkDepth: 40,
        sinkX: 0,
        hasCooktop: false,
        cooktopWidth: 70,
        cooktopDepth: 50,
        cooktopX: 40
      });
    } else {
      setStaircase({
        style: 'cascata',
        stepsCount: 5,
        stepWidth: 110,
        stepDepth: 30,
        stepHeight: 18,
        thickness: 2,
        hasSkirting: true,
        skirtingStyle: 'reto'
      });
    }
    setGeneratedUrl(null);
  };

  // --- GERAR LINK PÚBLICO ---
  const handleGenerateLink = () => {
    const snapshot: ProposalSnapshot = {
      projectType,
      countertop,
      staircase,
      selectedMaterialId: selectedMaterial.id,
      quote,
      createdAt: new Date().toISOString()
    };
    const uuid = saveProposal(snapshot);
    const url = `${window.location.origin}/proposta/${uuid}`;
    setGeneratedUrl(url);
    setCopied(false);
  };

  const handleCopyLink = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- DYNAMIC PHYSICS CALCULATIONS ---
  const perimetro = useMemo(() => {
    if (projectType === 'pia') {
      return 2 * ((countertop.width + countertop.depth) / 100);
    } else {
      return staircase.stepsCount * (staircase.stepWidth / 100);
    }
  }, [projectType, countertop.width, countertop.depth, staircase.stepsCount, staircase.stepWidth]);

  const pesoEst = useMemo(() => {
    const volM3 = budgets.baseAreaM2 * ((projectType === 'pia' ? countertop.thickness : staircase.thickness) / 100);
    return Math.round(volM3 * 2700);
  }, [projectType, budgets.baseAreaM2, countertop.thickness, staircase.thickness]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white select-none">

      {/* --- TOP HIGH END HEADER --- */}
      <header className="border-b border-white/10 bg-[#121214]/90 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 shadow-xl">

        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-base text-white font-display">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white font-display uppercase">
                MARMU <span className="text-blue-500">PRO</span>
              </h1>
              <span className="text-[9px] bg-blue-500/10 text-blue-400 font-mono font-bold px-2 py-0.5 rounded-full uppercase border border-blue-500/20">
                CAD Engine
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium">Modelador de Pias, Bancadas e Escadarias Técnicas</p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-305 text-zinc-350 hover:text-white rounded-xl text-xs font-semibold font-mono transition-all active:scale-95 cursor-pointer border border-white/5"
            title="Redefinir medidas para o padrão"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            onClick={() => setShowInvoice(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 uppercase tracking-wider font-display"
          >
            <Receipt className="w-4 h-4" />
            Visualizar Proposta Comercial
          </button>
        </div>

      </header>

      {/* --- MAIN SPLIT INTERFACE WORKSPACE --- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">

        {/* LEFT COLUMN: CONTROL AND PARAMS DASHBOARD PANEL (5Cols on Desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">

          {/* A. WORKPIECE TYPE TABS */}
          <div className="bg-black/40 border border-white/5 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => {
                setProjectType('pia');
                setAutoRotate(false);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                projectType === 'pia'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              BANCADAS & PIAS
            </button>
            <button
              onClick={() => {
                setProjectType('escada');
                setAutoRotate(false);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                projectType === 'escada'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              ESCADAS TÉCNICAS
            </button>
          </div>

          {/* B. DETAILED CONFIGURATOR SLIDERS & OPTIONS CARD */}
          <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl flex flex-col gap-6 shadow-2xl">

            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Sliders className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-display">
                Dimensões Ajustáveis ({projectType === 'pia' ? 'Bancada' : 'Escada'})
              </h3>
            </div>

            {projectType === 'pia' ? (
              // --- COUNTERTOP PARAMS ---
              <div className="space-y-6">

                <h3 className="text-[10px] font-bold text-zinc-520 text-zinc-500 uppercase tracking-[0.2em]">Dimensões Técnicas</h3>

                {/* 1. Largura & Profundidade sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-zinc-400">Largura Total</label>
                      <span className="text-xs bg-zinc-900 border border-white/5 px-2.5 py-0.5 rounded font-mono text-blue-400">{countertop.width}cm</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={300}
                      step={5}
                      value={countertop.width}
                      onChange={e => setCountertop({ ...countertop, width: Number(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-805 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-zinc-400">Profundidade</label>
                      <span className="text-xs bg-zinc-900 border border-white/5 px-2.5 py-0.5 rounded font-mono text-blue-400">{countertop.depth}cm</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={120}
                      step={5}
                      value={countertop.depth}
                      onChange={e => setCountertop({ ...countertop, depth: Number(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-805 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>

                {/* 2. Frontão & Saia adjustments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-zinc-400">Frontão (Espelho)</label>
                      <span className="text-xs bg-zinc-900 border border-white/5 px-2.5 py-0.5 rounded font-mono text-blue-400">{countertop.frontaoHeight}cm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={countertop.frontaoHeight}
                      onChange={e => setCountertop({ ...countertop, frontaoHeight: Number(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-805 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-zinc-400">Saia (Avental)</label>
                      <span className="text-xs bg-zinc-900 border border-white/5 px-2.5 py-0.5 rounded font-mono text-blue-400">{countertop.saiaHeight}cm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={15}
                      step={1}
                      value={countertop.saiaHeight}
                      onChange={e => setCountertop({ ...countertop, saiaHeight: Number(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-805 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>

                {/* Frontão laterally configs */}
                {countertop.frontaoHeight > 0 && (
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex justify-between items-center text-xs text-zinc-300">
                    <span className="font-medium text-zinc-400">Adicionar Abas Laterais:</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={countertop.frontaoLeft}
                          onChange={e => setCountertop({ ...countertop, frontaoLeft: e.target.checked })}
                          className="accent-blue-600 rounded bg-zinc-900 border-white/10 w-4 h-4"
                        />
                        Esq.
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={countertop.frontaoRight}
                          onChange={e => setCountertop({ ...countertop, frontaoRight: e.target.checked })}
                          className="accent-blue-600 rounded bg-zinc-900 border-white/10 w-4 h-4"
                        />
                        Dir.
                      </label>
                    </div>
                  </div>
                )}

                {/* 3. Slab thickness selection */}
                <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                  <span className="text-xs font-medium text-zinc-400">Espessura Nominal:</span>
                  <div className="flex bg-zinc-950 rounded-lg p-1 border border-white/15">
                    {[2, 3].map(t => (
                      <button
                        key={t}
                        onClick={() => setCountertop({ ...countertop, thickness: t })}
                        className={`px-3 py-1 rounded text-xs transition-all font-mono font-bold cursor-pointer ${
                          countertop.thickness === t ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {t} cm
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. SINK (Cuba) & COOKTOP Toggle controls */}
                <div className="border-t border-white/10 pt-4 space-y-4">

                  <h3 className="text-[10px] font-bold text-zinc-520 text-zinc-500 uppercase tracking-[0.2em]">Cortes & Recortes</h3>

                  {/* SINK toggle */}
                  <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-zinc-300 font-display">Hollow Cutout: Cuba</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={countertop.hasSink}
                        onChange={e => setCountertop({ ...countertop, hasSink: e.target.checked })}
                        className="accent-blue-600 w-4 h-4 cursor-pointer"
                      />
                    </div>

                    {countertop.hasSink && (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Modelo:</label>
                            <select
                              value={countertop.sinkType}
                              onChange={e => setCountertop({ ...countertop, sinkType: e.target.value as any })}
                              className="w-full bg-[#1e1e24] border border-white/10 text-zinc-200 text-xs rounded-lg p-2 mt-1 focus:outline-none focus:border-blue-500"
                            >
                              <option value="inox_embutir">Inox de Embutir</option>
                              <option value="inox_sobrepor">Inox de Sobrepor</option>
                              <option value="esculpida">Rampa Esculpida</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                              <span>Largura Cuba</span>
                              <span className="text-blue-400 font-mono">{countertop.sinkWidth}cm</span>
                            </div>
                            <input
                              type="range"
                              min={35}
                              max={80}
                              value={countertop.sinkWidth}
                              onChange={e => setCountertop({ ...countertop, sinkWidth: Number(e.target.value) })}
                              className="w-full h-1 mt-3 accent-blue-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            <span>Sintonia do Centro (Alinhamento X)</span>
                            <span className="text-emerald-400 font-mono">{countertop.sinkX > 0 ? `+${countertop.sinkX}` : countertop.sinkX}%</span>
                          </div>
                          <input
                            type="range"
                            min={-80}
                            max={80}
                            value={countertop.sinkX}
                            onChange={e => setCountertop({ ...countertop, sinkX: Number(e.target.value) })}
                            className="w-full h-1 accent-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* COOKTOP toggle */}
                  <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-zinc-300 font-display">Recorte p/ Cooktop</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={countertop.hasCooktop}
                        onChange={e => setCountertop({ ...countertop, hasCooktop: e.target.checked })}
                        className="accent-blue-600 w-4 h-4 cursor-pointer"
                      />
                    </div>

                    {countertop.hasCooktop && (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                              <span>Largura Cooktop</span>
                              <span className="text-blue-400 font-mono">{countertop.cooktopWidth}cm</span>
                            </div>
                            <input
                              type="range"
                              min={50}
                              max={90}
                              value={countertop.cooktopWidth}
                              onChange={e => setCountertop({ ...countertop, cooktopWidth: Number(e.target.value) })}
                              className="w-full h-1 mt-2.5 accent-blue-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                              <span>Profundidade</span>
                              <span className="text-blue-400 font-mono">{countertop.cooktopDepth}cm</span>
                            </div>
                            <input
                              type="range"
                              min={35}
                              max={60}
                              value={countertop.cooktopDepth}
                              onChange={e => setCountertop({ ...countertop, cooktopDepth: Number(e.target.value) })}
                              className="w-full h-1 mt-2.5 accent-blue-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            <span>Sintonia do Centro (Alinhamento X)</span>
                            <span className="text-emerald-400 font-mono">{countertop.cooktopX > 0 ? `+${countertop.cooktopX}` : countertop.cooktopX}%</span>
                          </div>
                          <input
                            type="range"
                            min={-80}
                            max={80}
                            value={countertop.cooktopX}
                            onChange={e => setCountertop({ ...countertop, cooktopX: Number(e.target.value) })}
                            className="w-full h-1 accent-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              // --- STAIRCASE PARAMS ---
              <div className="space-y-6">

                <h3 className="text-[10px] font-bold text-zinc-520 text-zinc-500 uppercase tracking-[0.2em]">Dimensões Técnicas</h3>

                {/* Style selector */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-zinc-400">Modelo Estrutural:</span>
                  <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1 rounded-xl border border-white/10">
                    {[
                      { id: 'cascata', label: 'Cascada' },
                      { id: 'flutuante', label: 'Flutuante' },
                      { id: 'plisada', label: 'Plisada' }
                    ].map(styleOpt => (
                      <button
                        key={styleOpt.id}
                        onClick={() => setStaircase({ ...staircase, style: styleOpt.id as any })}
                        className={`py-2 rounded px-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          staircase.style === styleOpt.id
                            ? 'bg-blue-600 text-white shadow shadow-blue-500/10'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {styleOpt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Steps and dimensions */}
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-zinc-400">Quantidade de Degraus</label>
                      <span className="text-xs bg-zinc-900 border border-white/5 px-2.5 py-0.5 rounded font-mono text-blue-400">{staircase.stepsCount} espelhos</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      step={1}
                      value={staircase.stepsCount}
                      onChange={e => setStaircase({ ...staircase, stepsCount: Number(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-805 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-zinc-400">Largura do Lance (Vão)</label>
                      <span className="text-xs bg-zinc-900 border border-white/5 px-2.5 py-0.5 rounded font-mono text-blue-400">{staircase.stepWidth}cm</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={225}
                      step={5}
                      value={staircase.stepWidth}
                      onChange={e => setStaircase({ ...staircase, stepWidth: Number(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-805 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-zinc-400">Pisada (Tread)</label>
                        <span className="text-xs bg-zinc-900 border border-white/5 px-2.5 py-0.5 rounded font-mono text-blue-400">{staircase.stepDepth}cm</span>
                      </div>
                      <input
                        type="range"
                        min={25}
                        max={45}
                        step={1}
                        value={staircase.stepDepth}
                        onChange={e => setStaircase({ ...staircase, stepDepth: Number(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-805 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-zinc-400">Espelho (Height)</label>
                        <span className="text-xs bg-zinc-900 border border-white/5 px-2.5 py-0.5 rounded font-mono text-blue-400">{staircase.stepHeight}cm</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={20}
                        step={0.5}
                        value={staircase.stepHeight}
                        onChange={e => setStaircase({ ...staircase, stepHeight: Number(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-805 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Edge skirting configs */}
                <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-300 font-display">Rodapé Clipped Jacaré</span>
                    <input
                      type="checkbox"
                      checked={staircase.hasSkirting}
                      onChange={e => setStaircase({ ...staircase, hasSkirting: e.target.checked })}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  {staircase.hasSkirting && (
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Acrescenta rodapés em ambas as extremidades do degrau para acabamento rente à parede.
                    </p>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* C. DIVERSE CATALOGUE OF STONE MATERIALS */}
          <div className="bg-[#121214] border border-white/10 p-5 rounded-2xl flex flex-col gap-4 shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-display">
                    Material & Acabamento
                  </h3>
                  <p className="text-[10px] text-zinc-500">Selecione para calibrar e projetar a textura do mineral no layout 3D</p>
                </div>
              </div>

              <div className="flex bg-zinc-950 p-1 rounded-lg border border-white/10 gap-1 flex-wrap">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'granito', label: 'Granito' },
                  { id: 'marmore', label: 'Mármores' },
                  { id: 'quartzo', label: 'Quartzos' },
                  { id: 'ultra', label: 'Compactos' }
                ].map(filterOpt => (
                  <button
                    key={filterOpt.id}
                    onClick={() => setMaterialFilter(filterOpt.id)}
                    className={`py-1 px-2.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      materialFilter === filterOpt.id ? 'bg-blue-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {filterOpt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredMaterials.map(mat => {
                const isSelected = selectedMaterial.id === mat.id;
                return (
                  <button
                    key={mat.id}
                    onClick={() => setSelectedMaterial(mat)}
                    className={`group bg-zinc-900 border text-left p-3.5 rounded-xl transition-all cursor-pointer flex flex-col justify-between h-24 ${
                      isSelected
                        ? 'border-2 border-blue-600 bg-blue-600/10 shadow-lg shadow-blue-500/10'
                        : 'border-white/10 hover:border-zinc-700 hover:bg-[#1e1e24]/40'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full gap-2">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 select-none group-hover:text-blue-500 font-mono tracking-wide">{mat.category}</span>
                      <div
                        className="w-5 h-5 rounded-md border border-white/20 select-none relative flex items-center justify-center cursor-pointer shadow-inner shrink-0"
                        style={{ backgroundColor: mat.color }}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-200 line-clamp-1 leading-normal group-hover:text-white">
                        {mat.name}
                      </h4>
                      <span className="text-[10px] text-blue-400 font-mono font-bold block mt-0.5">
                        R$ {mat.pricePerM2}/m²
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-zinc-500 italic mt-1 bg-black/20 p-2.5 rounded-lg border border-white/5 font-mono text-center">
              {selectedMaterial.name} — {selectedMaterial.category.toUpperCase()} · R$ {selectedMaterial.pricePerM2}/m²
            </p>
          </div>

          {/* D. CLIENT INVOICE METADATA INPUT CARD */}
          <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl flex flex-col gap-4 shadow-2xl">

            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-display">
                Informações da Proposta (Opcional)
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-450 text-zinc-400">Nome do Cliente:</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Ex: Matheus Julio"
                      value={quote.clientName}
                      onChange={e => setQuote({ ...quote, clientName: e.target.value })}
                      className="w-full bg-[#1e1e24] border border-white/10 rounded-xl p-2 pl-8 text-zinc-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-450 text-zinc-400 font-medium">Contatos Cliente:</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Ex: (41) 99888-7711"
                      value={quote.clientPhone}
                      onChange={e => setQuote({ ...quote, clientPhone: e.target.value })}
                      className="w-full bg-[#1e1e24] border border-white/10 rounded-xl p-2 pl-8 text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-450 text-zinc-400">Frete & Instalação (R$):</label>
                  <input
                    type="number"
                    value={quote.tax}
                    onChange={e => setQuote({ ...quote, tax: Number(e.target.value) })}
                    className="w-full bg-[#1e1e24] border border-white/10 rounded-xl p-2 focus:outline-none focus:border-blue-500 text-zinc-250 font-mono text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-zinc-450 text-zinc-400">Margem Desconto:</label>
                    <span className="text-emerald-400 font-bold font-mono">{quote.discount}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={quote.discount}
                    onChange={e => setQuote({ ...quote, discount: Number(e.target.value) })}
                    className="w-full h-1 mt-3.5 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-450 text-zinc-400">Observações de Produção:</label>
                <textarea
                  placeholder="Ex: Obra prioritária. Medidas confirmadas pela equipe de campo."
                  value={quote.observations}
                  onChange={e => setQuote({ ...quote, observations: e.target.value })}
                  className="w-full bg-[#1e1e24] border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 text-zinc-200 text-xs h-16 resize-none"
                />
              </div>

            </div>
          </div>

          {/* D. BUDGET SUMMARY CARD */}
          <div className="mt-2 p-5 bg-gradient-to-br from-blue-600/15 via-blue-600/5 to-transparent rounded-2xl border border-blue-500/20 shadow-xl shadow-blue-900/10">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Orçamento Estimado</p>
            <div className="text-3xl font-bold flex items-baseline gap-1 font-display">
              <span className="text-sm font-medium text-blue-400 mr-0.5">R$</span>
              <span className="text-white tracking-tight">{budgets.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => setShowInvoice(true)}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-xs text-white transition-all shadow-xl shadow-blue-600/25 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
              >
                <Receipt className="w-3.5 h-3.5" />
                Gerar PDF Técnico
              </button>

              {/* GERAR LINK PÚBLICO */}
              <button
                onClick={handleGenerateLink}
                className="w-full bg-emerald-700 hover:bg-emerald-600 py-3 rounded-xl font-bold text-xs text-white transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 border border-emerald-500/30"
              >
                <Link2 className="w-3.5 h-3.5" />
                Gerar Link Público para Cliente
              </button>

              {generatedUrl && (
                <div className="mt-1 bg-black/40 border border-emerald-500/20 rounded-xl p-3 flex flex-col gap-2">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Link gerado:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedUrl}
                      className="flex-1 bg-[#1e1e24] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-mono text-zinc-300 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-zinc-300'
                      }`}
                    >
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold text-xs text-zinc-300 transition-all border border-white/5 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Limpar Configuração
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 3D VIEWPORT, MATERIALS SELECTION & 2D BLUEPRINT VIEW */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* 1. INTERACTIVE 3D STAGE */}
          <div className="h-[430px] sm:h-[480px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <ThreeView
              type={projectType}
              countertop={countertop}
              staircase={staircase}
              material={selectedMaterial}
              autoRotate={autoRotate}
            />

            <div className="absolute top-6 left-6 flex gap-2 pointer-events-none select-none z-10">
              <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[9px] font-bold text-zinc-400 uppercase tracking-wider font-display">
                Visualização 3D
              </div>
              <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[9px] font-bold text-blue-450 text-blue-400 uppercase tracking-wider font-mono">
                Snap: 1.0cm
              </div>
            </div>

            <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all backdrop-blur-md cursor-pointer border border-white/10 ${
                  autoRotate
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-black/40 text-zinc-400 hover:text-white'
                }`}
                title={autoRotate ? 'Parar Giro Automático' : 'Iniciar Giro Automático'}
              >
                <RefreshCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] bg-black/75 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3.5 z-10 shadow-2xl">
               <div className="flex justify-around sm:justify-start gap-6 sm:gap-10 w-full sm:w-auto">
                 <div className="flex flex-col">
                   <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">Área Útil</span>
                   <span className="text-sm font-bold font-mono text-zinc-200">{budgets.baseAreaM2.toFixed(2)} m²</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[9px] text-zinc-550 text-zinc-500 uppercase font-black tracking-widest mb-0.5">Perímetro</span>
                   <span className="text-sm font-bold font-mono text-zinc-200">{perimetro.toFixed(2)} m</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[9px] text-zinc-550 text-zinc-500 uppercase font-black tracking-widest mb-0.5">Peso Est.</span>
                   <span className="text-sm font-bold font-mono text-zinc-200">~{pesoEst} kg</span>
                 </div>
               </div>

               <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-white/5 sm:border-t-0 pt-3.5 sm:pt-0 shrink-0">
                 <div className="text-left sm:text-right">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Pronto para Corte</p>
                    <p className="text-xs text-green-400 font-bold flex items-center gap-1">✓ Geometria Validada</p>
                 </div>
                 <div className="w-9 h-9 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
                   <Check className="w-5 h-5" />
                 </div>
               </div>
            </div>

          </div>

          {/* 2. PRECISION 2D CAD SCHEMATICS */}
          <Editor2D
            type={projectType}
            countertop={countertop}
            staircase={staircase}
            material={selectedMaterial}
          />

        </div>

      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-[#121214] border-t border-white/10 p-6 flex flex-col md:flex-row justify-between items-center gap-4 mt-auto">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="space-y-0.5">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Material Selecionado</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-white/25 shadow-sm shrink-0" style={{ backgroundColor: selectedMaterial.color }} />
              <p className="text-sm font-bold text-white font-display">{selectedMaterial.name}</p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          <div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Modulador de Geometria</span>
            <p className="text-xs text-zinc-300 font-mono">
              {projectType === 'pia'
                ? `Bancada: ${countertop.width}x${countertop.depth}cm (${(countertop.width * countertop.depth / 10000).toFixed(2)}m²) x Espessura ${countertop.thickness}cm`
                : `Escada: ${staircase.stepsCount} espelhos de ${staircase.stepWidth}cm van (P: ${staircase.stepDepth}cm / E: ${staircase.stepHeight}cm)`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">Orçamento Total</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">
              R$ {budgets.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setShowInvoice(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/10 cursor-pointer text-center"
          >
            <Receipt className="w-4 h-4" />
            Exportar Orçamento
          </button>
        </div>
      </footer>

      {/* --- INVOICE MODAL --- */}
      {showInvoice && (
        <BudgetInvoice
          type={projectType}
          countertop={countertop}
          staircase={staircase}
          material={selectedMaterial}
          quote={quote}
          onClose={() => setShowInvoice(false)}
        />
      )}

    </div>
  );
}
