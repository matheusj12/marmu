# Guia de Modelos 3D — Marmu SaaS

Referência para criar, registrar e testar novos modelos 3D no configurador.

---

## Arquitetura

```
src/
├── types.ts                     # Model3DType, get3DModel(), getBaseModel()
├── lib/
│   └── stoneTexture.ts          # generateStoneTexture() — textura procedural
├── components/3d/
│   ├── ThreeView.tsx            # Canvas principal + switch de modelos
│   ├── _TemplateModel.tsx       # Template de ponto de partida
│   ├── BancadaModel.tsx         # pia, lavanderia, tampo_cuba, ilha, tampo
│   ├── BancadaLModel.tsx        # bancada_l, churrasqueira_gourmet
│   ├── BancadaUModel.tsx        # bancada_u
│   ├── EscadaModel.tsx          # escada, degrau_avulso, espelho_escada
│   ├── SlabModel.tsx            # soleira, peitoril, rodape, friso, guarda...
│   ├── WallPanelModel.tsx       # revestimento_parede, rebaixo_*, fachada
│   ├── FloorModel.tsx           # piso, calcada, piso_box
│   ├── BathroomModel.tsx        # cuba_esculpida, nicho, prateleira, banco_box
│   ├── CommercialModel.tsx      # balcao, piscina, churrasqueira_ext
│   └── ServiceModel.tsx         # polimento, cristalizacao, gravacao_jato, mosaico...
```

---

## Passos para Criar um Novo Modelo

### 1. Criar o componente

Copie `_TemplateModel.tsx` e implemente a geometria:

```bash
cp src/components/3d/_TemplateModel.tsx src/components/3d/MeuModel.tsx
```

**Interface mínima:**
```tsx
interface MeuModelProps {
  config: CountertopConfig   // ou StaircaseConfig
  material: StoneMaterial
  type?: ProjectType         // passar se o componente suportar múltiplos tipos
}
```

### 2. Registrar em `src/types.ts`

**a) Se precisar de um novo `Model3DType`:**
```typescript
export type Model3DType =
  | 'bancada' | 'bancada_l' | 'bancada_u' | 'escada'
  | 'slab' | 'wall' | 'floor' | 'bathroom' | 'commercial' | 'service'
  | 'meu_tipo'  // ← adicione aqui
```

**b) Mapear ProjectTypes ao novo modelo em `get3DModel()`:**
```typescript
export function get3DModel(type: ProjectType): Model3DType {
  switch (type) {
    // ...
    case 'meu_project_type': return 'meu_tipo'
```

**c) Se o novo tipo usar `StaircaseConfig`, adicionar a `escadaTypes` em `getBaseModel()`:**
```typescript
const escadaTypes: ProjectType[] = ['escada', 'degrau_avulso', 'espelho_escada', 'meu_type']
```

### 3. Importar e renderizar em `ThreeView.tsx`

```tsx
// 1. Adicionar import
import MeuModel from './MeuModel'

// 2. Adicionar ao switch de renderização
{model3D === 'meu_tipo' && <MeuModel type={type} config={countertop} material={material} />}

// 3. Se necessário, ajustar objectPositionY para o novo modelo
const objectPositionY =
  model3D === 'meu_tipo' ? 0.0
  // ... outros casos
```

---

## Escala e Convenções

| Unidade | Conversão |
|---------|-----------|
| Dimensões de config | cm |
| Three.js | metros |
| Conversão | `const W = config.width / 100` |

**Orientação padrão:**
- X = largura (esquerda-direita)
- Y = altura (baixo-cima)
- Z = profundidade (frente-trás)
- A câmera padrão está em `[2.5, 2.5, 2.5]` com `fov: 45`

**Tamanho visual ideal:** objetos entre 0.5m–2.0m na dimensão principal ficam bem na câmera padrão.

---

## Textura Procedural

Use sempre `generateStoneTexture()` para consistência visual:

```tsx
import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'
import { generateStoneTexture } from '../../utils/textureGenerator'

const texture = useMemo(() => {
  const canvas = generateStoneTexture(material)
  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.repeat.set(W * 2, D * 2)  // ajuste a repetição conforme tamanho
  return tex
}, [material, W, D])
```

**Nunca crie textura fora de `useMemo`** — causará recriação por frame e travar a renderização.

---

## Regras de CSS para ThreeView

O `ThreeView` usa `position: absolute; inset: 0` internamente. Portanto:

**Pai obrigatório:**
```tsx
// ✅ Correto — flex item com min-h-0 e position relative
<div className="flex-1 relative min-h-0">
  <ThreeView />
</div>

// ✅ Correto — altura fixa
<div className="h-56 relative">
  <ThreeView />
</div>

// ❌ Errado — sem position relative
<div className="flex-1">
  <ThreeView />
</div>

// ❌ Errado — h-full sem cadeia de altura
<div className="w-full h-full">
  <ThreeView />
</div>
```

---

## Materiais Disponíveis

Listados em `src/materials.ts`. Cada `StoneMaterial` tem:
- `color`, `secondaryColor` — cores base para textura procedural
- `textureType`: `'solid' | 'marble' | 'granite' | 'composite'`
- `roughness`, `metalness` — propriedades PBR
- `pricePerM2`, `pricePerML_Saia`, `pricePerML_Frontao` — para cálculo de preço

---

## Debugging

**Canvas branco:** Ver [KNOWN-BUGS.md](./KNOWN-BUGS.md#bug-001).

**Modelo invisível:** Verificar se a geometria está centrada na origem `[0, 0, 0]` e dentro de ±2 unidades.

**Textura preta:** `generateStoneTexture()` usa `document.createElement('canvas')` — funciona apenas no browser, nunca em SSR.

**Flickering:** Verificar se `useMemo` está sendo usado para textura e material. Sem `useMemo`, novos objetos são criados por render.
