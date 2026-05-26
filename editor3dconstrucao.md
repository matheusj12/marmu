# Padrão de Construção — Editor 3D Marmu

> Documento de referência para implementar novos tipos de projeto no Editor 3D.
> Baseado no tipo **Bancada Cozinha / Banheiro** (`pia`) — referência validada e funcionando.

---

## 1. Visão Geral da Arquitetura

```
ConfiguratorPage
│
├── TopAppBar           ← nome do tipo + tabs (Dimensões / Visualização) + ações
│
├── Viewport (esquerda, flex-1)
│   ├── [Tab Dimensões, baseModel=pia]
│   │   ├── Vista 2D   (flex-1, 60% aprox)  ← Editor2D (pia) ou DimensionSchematic (demais)
│   │   └── Mini 3D    (h-56, 40% aprox)    ← ThreeView (auto-posicionado, position:absolute inset-0)
│   │
│   ├── [Tab Dimensões, baseModel=escada]
│   │   └── ThreeView (full, flex-1 relative min-h-0)
│   │
│   └── [Tab Visualização — qualquer tipo]
│       └── ThreeView (full, flex-1 relative min-h-0)
│
└── Painel Direito (w-96, fixed)
    ├── Nome do Projeto (input)
    ├── Tipo de Pedra   (select → STONE_MATERIALS)
    ├── Dimensões       (inputs numéricos por baseModel)
    ├── PricePanel      (breakdown em tempo real)
    └── Btn "Finalizar Orçamento" → QuoteFinalizationModal
```

---

## 2. Layout CSS — Regras Invioláveis

### ThreeView
```tsx
// ThreeView root = position:absolute inset-0 — SEMPRE se auto-posiciona
// O PAI deve ter position:relative + dimensões concretas

// ✅ Mini preview (pia — tab Dimensões)
<div className="h-56 flex-shrink-0 relative">
  <ThreeView ... />
</div>

// ✅ Full 3D (tab Visualização ou tipos sem 2D editor)
<div className="flex-1 relative min-h-0">
  <ThreeView ... />
</div>

// ❌ NUNCA: div sem altura explícita
<div className="flex-1">  ← SEM min-h-0 e SEM relative → canvas branco
  <ThreeView ... />
</div>
```

### Viewport Container
```tsx
// Viewport externo (pai do ThreeView full):
className="flex-1 flex flex-col overflow-hidden relative"

// Viewport interno full-3D:
className="flex-1 relative min-h-0"
```

---

## 3. Fluxo de Dados

```
useConfiguratorStore (Zustand)
│
├── projectType    → determina qual modelo 3D e qual config de dimensões
├── selectedMaterial → StoneMaterial (pricePerM2, roughness, metalness, etc.)
├── countertop     → CountertopConfig (width, depth, thickness, sink, cooktop…)
├── staircase      → StaircaseConfig  (stepsCount, stepWidth, stepDepth…)
└── autoRotate     → boolean

ConfiguratorPage
├── baseModel = getBaseModel(projectType)  → 'pia' | 'escada'
├── model3D   = get3DModel(projectType)    → 'bancada' | 'bancada_l' | 'bancada_u' | …
├── breakdown = calcPrice({ projectType: baseModel, countertop, staircase, material })
└── renders → ThreeView + painel + PricePanel
```

---

## 4. Mapeamento de Tipos

### getBaseModel() — define CONFIG de dimensões e calcPrice routing
| Retorno    | Tipos incluídos                                              |
|------------|--------------------------------------------------------------|
| `'pia'`    | **todos** os tipos exceto os 3 abaixo → usa CountertopConfig |
| `'escada'` | `escada`, `degrau_avulso`, `espelho_escada` → StaircaseConfig |

> **Regra:** só adicionar em `escadaTypes` se o tipo realmente usa `StaircaseConfig`.

### get3DModel() — define qual componente 3D renderizar
| Model3DType   | ProjectTypes mapeados                                             | Componente            |
|---------------|-------------------------------------------------------------------|-----------------------|
| `bancada`     | pia, lavanderia, tampo_cuba, ilha, tampo                          | BancadaModel          |
| `bancada_l`   | bancada_l, churrasqueira_gourmet                                  | BancadaLModel         |
| `bancada_u`   | bancada_u                                                         | BancadaUModel         |
| `escada`      | escada, degrau_avulso, espelho_escada                             | EscadaModel           |
| `slab`        | soleira, peitoril, rodape, friso, guarda, soleira_portao…         | SlabModel             |
| `wall`        | revestimento_parede, rebaixo_italiano, rebaixo_americano, fachada | WallPanelModel        |
| `floor`       | piso, calcada, piso_box                                           | FloorModel            |
| `bathroom`    | cuba_esculpida, nicho, prateleira, banco_box                      | BathroomModel         |
| `commercial`  | balcao, piscina, churrasqueira_ext                                | CommercialModel       |
| `service`     | polimento, cristalizacao, impermeabilizacao, gravacao_jato, mosaico | ServiceModel        |

---

## 5. Padrão da Vista 2D (Tab Dimensões)

### Regra por tipo
```
projectType === 'pia'         → Editor2D (interativo, com cuba/cooktop draggável)
baseModel === 'pia' (outros)  → DimensionSchematic (SVG top-down, somente leitura)
baseModel === 'escada'        → sem 2D — só ThreeView full na tab Dimensões
```

### Editor2D (somente pia)
- Canvas SVG interativo em `src/components/2d/Editor2D.tsx`
- Barra lateral: lista de elementos (Cuba Simples, Cuba Dupla, Cuba Oval, Sobrepor, Cooktop, Torneira)
- Toolbar: Snap 5cm, zoom −/+/fit, fullscreen
- Handles: 4 cantos (resize W×D), 4 arestas centrais (click → popup de aresta)
- Popup de aresta: FRONTÃO / SAIA / LATERAL DIR. / BORDA com campos de altura em cm
- Labels flutuantes: dimensão total em cm no topo/direita, área m² no centro
- Teclas: Scroll=zoom, Ctrl+0=fit, Delete=remover seleção
- Sync bidirecional: arrastar handles ↔ `setCountertop()` no store

### DimensionSchematic (tipos não-pia com baseModel=pia)
- SVG estático em `src/components/2d/DimensionSchematic.tsx`
- Vista superior (top-down) da forma: retângulo, L, U
- Cotas: largura, profundidade, comprimento do braço (L/U)
- Área m² no centro da forma
- Atualiza reativamente: re-renderiza quando `countertop` muda no store
- Fundo: `#08090d` com grade `rgba(255,255,255,0.03)`
- Cor: primário `#a78bfa`

---

## 6. BancadaModel — Estrutura 3D (Referência `pia`)

```
group (position Y = thickness/2)
│
├── 1. TAMPO (laje principal)
│   ├── Sólido simples (sem cuba/cooktop)
│   └── Particionado em strips (com cuba/cooktop — sem CSG)
│       ├── Strip esquerda, direita, traseira, frontal
│       └── (com ambos: + strip central entre cuba e cooktop)
│
├── 2. FRONTÃO TRASEIRO (backsplash)
│   └── box [W, frontaoHeight, thickness] position: [0, fh/2+t/2, -D/2+t/2]
│
├── 3. FRONTÕES LATERAIS (opcional: frontaoLeft / frontaoRight)
│   └── box [thickness, fh, D-t]
│
├── 4. SAIA FRONTAL (apron front)
│   └── box [W, saiaHeight, thickness] position Y negativo
│
├── 5. SAIAS LATERAIS (apron sides)
│   └── 2× box [thickness, sh, D-t]
│
├── 6. CUBA (sink)
│   ├── Inox: bowl metálico + lip ring + torneira
│   └── Esculpida: rampa + laje escura
│
└── 7. COOKTOP
    └── base vidro preto + rings de indução + controles touch
```

### Conversão de unidades
```typescript
const w  = config.width     / 100  // cm → metros
const d  = config.depth     / 100
const t  = config.thickness / 100
const sh = config.saiaHeight   / 100
const fh = config.frontaoHeight / 100
```

---

## 7. ThreeView — Canvas 3D

```tsx
<Canvas
  shadows={{ type: PCFShadowMap }}          // PCFSoftShadowMap está deprecated no three 0.184
  camera={{ position: [2.5, 2.5, 2.5], fov: 45 }}
  gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' }}
>
  <color attach="background" args={['#08090d']} />
  <Environment preset="city" />
  <ambientLight intensity={0.5} />
  <directionalLight position={[5, 12, 4]} intensity={1.2} castShadow />
  <pointLight position={[-10, 5, -10]} intensity={0.6} />

  <group position={[0, objectPositionY, 0]}>
    {/* modelo 3D baseado em get3DModel(type) */}
    <Grid infiniteGrid ... />
  </group>

  <ContactShadows position={[0, -0.8, 0]} opacity={0.65} scale={8} blur={1.8} />
  <OrbitControls autoRotate={autoRotate} minDistance={1.2} maxDistance={8.0} />
</Canvas>
```

### objectPositionY por modelo
| model3D      | objectPositionY |
|--------------|----------------|
| `escada`     | -0.2            |
| `wall`       | -0.35           |
| `commercial` | -0.55           |
| `bathroom`   | -0.1            |
| demais       | 0.2             |

---

## 8. Textura Procedural de Pedra

```typescript
// Em qualquer *Model.tsx — SEMPRE dentro de useMemo
const texture = useMemo(() => {
  const canvas = generateStoneTexture(material)  // src/utils/textureGenerator.ts
  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.repeat.set(1.5, 1.5)   // ajustar conforme tamanho do objeto
  tex.needsUpdate = true
  return tex
}, [material])

const stoneMat = { map: texture, roughness: material.roughness, metalness: material.metalness }
// Usar como: <meshStandardMaterial {...stoneMat} />
```

**Nunca fora de useMemo** — cria textura nova por frame → trava render.

---

## 9. Painel Direito (Configuração de Peça)

```
┌─ header ─────────────────────────────────────────────┐
│ "Configuração de Peça" / "Defina materiais e acabamentos"  │
├───────────────────────────────────────────────────────┤
│ input: Nome do Projeto                                │
│ select: Tipo de Pedra → STONE_MATERIALS               │
├── separator ──────────────────────────────────────────┤
│ [baseModel=pia]  inputs: Largura / Profund. / Espessura │
│ [baseModel=escada] inputs: Degraus / Largura / Pisada  │
├── separator ──────────────────────────────────────────┤
│ <PricePanel breakdown={breakdown} />                  │
│   Pedra (m²) · Saia (ml) · Frontão (ml) · Mão de obra │
│   Subtotal + Desconto + Frete = TOTAL                 │
├─ footer ──────────────────────────────────────────────┤
│ [btn] Finalizar Orçamento → QuoteFinalizationModal    │
└───────────────────────────────────────────────────────┘
```

---

## 10. calcPrice() — Cálculo de Preço

### Para baseModel = 'pia'
```
baseAreaM2 = (width/100) × (depth/100)
mlFrontao  = width/100  [+ depth/100 se frontaoLeft] [+ depth/100 se frontaoRight]
mlSaia     = width/100 + 2 × depth/100

stoneCost        = baseAreaM2 × material.pricePerM2
frontaoCost      = mlFrontao  × material.pricePerML_Frontao
saiaCost         = mlSaia     × material.pricePerML_Saia
fabricationCost  += 150 (cuba inox) | 450 (esculpida) | 120 (cooktop)

subtotal = stoneCost + frontaoCost + saiaCost + fabricationCost
```

### Para baseModel = 'escada'
```
baseAreaM2 = stepsCount × (stepWidth/100 × stepDepth/100)
             + [se não flutuante] stepsCount × (stepWidth/100 × (stepHeight/100 - 0.02))
mlFrontao  = [se hasSkirting] stepsCount × (stepDepth/100 + stepHeight/100)
fabricationCost = stepsCount × 40
```

> **TODO:** implementar cálculo específico para os outros baseModel=pia types (bancada_l, bancada_u, ilha, etc.) em vez de reusar o cálculo de pia.

---

## 11. CountertopConfig — Valores Padrão

```typescript
const defaultCountertop: CountertopConfig = {
  width:          180,
  depth:           60,
  thickness:        2,
  saiaHeight:       4,
  frontaoHeight:   10,
  frontaoLeft:   true,
  frontaoRight: false,
  cornerStyle:  'reto',
  hasSink:       true,
  sinkType: 'inox_embutir',
  sinkWidth:       50,
  sinkDepth:       40,
  sinkX:            0,
  hasCooktop:   false,
  cooktopWidth:    70,
  cooktopDepth:    50,
  cooktopX:        40,
}
```

---

## 12. Checklist para Implementar um Novo Tipo

```
[ ] Adicionar ProjectType em src/types.ts
[ ] Mapear em get3DModel() para o Model3DType correto
[ ] Se usa StaircaseConfig: adicionar em escadaTypes de getBaseModel()
[ ] Criar ou reaproveitar componente em src/components/3d/NomeModel.tsx
    → copiar _TemplateModel.tsx como ponto de partida
[ ] Importar NomeModel em ThreeView.tsx e adicionar ao switch de renderização
[ ] Ajustar objectPositionY em ThreeView se necessário
[ ] Adicionar label em PROJECT_LABELS em ConfiguratorPage.tsx
[ ] Adicionar label em DimensionSchematic se for bancada (isL / isU detection)
[ ] Implementar calcPrice() para o tipo se tiver lógica diferente
[ ] Testar: Tab Dimensões mostra 2D + mini 3D (baseModel=pia) ou full 3D (escada)
[ ] Testar: Tab Visualização mostra full 3D
[ ] Testar: PricePanel exibe valores corretos ao mudar dimensões
```

---

## 13. Armadilhas Conhecidas (ver docs/KNOWN-BUGS.md)

| Bug | Causa | Fix |
|-----|-------|-----|
| Canvas em branco | StrictMode monta 2× WebGL contexts | Removido StrictMode de main.tsx |
| Canvas sem altura | `h-full` sem cadeia explícita de altura | ThreeView usa `absolute inset-0`; pai usa `flex-1 relative min-h-0` |
| getBaseModel() errado | soleira/peitoril/guarda erroneamente em escadaTypes | Removidos — só escada/degrau_avulso/espelho_escada |
| Editor2D em tipos errados | condição `baseModel === 'pia'` em vez de `projectType === 'pia'` | Corrigido para `projectType === 'pia'` |
| Textura nova por frame | generateStoneTexture() fora de useMemo | Sempre dentro de useMemo |
| THREE.Clock warning | drei 10.x + three 0.184 incompatibilidade | Suprimido via src/lib/threePatch.ts |
| PCFSoftShadowMap warning | three 0.184 deprecou o tipo | Canvas usa `shadows={{ type: PCFShadowMap }}` |

---

## 14. Arquivos-Chave

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/types.ts` | ProjectType, Model3DType, getBaseModel(), get3DModel(), interfaces |
| `src/store/configuratorStore.ts` | Estado global: projectType, countertop, staircase, material |
| `src/lib/priceCalc.ts` | calcPrice(), PriceBreakdown, fmtBRL() |
| `src/utils/textureGenerator.ts` | generateStoneTexture(material) → HTMLCanvasElement |
| `src/materials.ts` | STONE_MATERIALS[] — catálogo de pedras |
| `src/components/3d/ThreeView.tsx` | Canvas R3F principal + switch de modelos |
| `src/components/3d/BancadaModel.tsx` | Modelo 3D referência (pia) — padrão a seguir |
| `src/components/3d/_TemplateModel.tsx` | Template para novos modelos |
| `src/components/2d/Editor2D.tsx` | Editor interativo 2D (somente pia) |
| `src/components/2d/DimensionSchematic.tsx` | Vista top-down SVG (bancadas não-pia) |
| `src/components/ui/PricePanel.tsx` | Painel de preço em tempo real |
| `src/app/dashboard/ConfiguratorPage.tsx` | Página principal do configurador |
| `src/lib/threePatch.ts` | Suprime warnings de deprecação do three.js 0.184 |
| `docs/KNOWN-BUGS.md` | Registro de bugs e soluções aplicadas |
| `docs/3D-MODEL-GUIDE.md` | Guia detalhado para criar novos modelos 3D |
