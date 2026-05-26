# Known Bugs — Marmu SaaS

Registro de bugs encontrados, causas-raiz e soluções aplicadas.
Consulte antes de criar novos componentes que usem Canvas/3D ou configurações de tipo.

---

## BUG-001 — Canvas 3D em branco (altura zero)

**Status:** RESOLVIDO (2026-05-25)  
**Severidade:** Crítico (feature completamente invisível)

### Sintoma
Viewport do Three.js exibia área branca/vazia. Apenas uma barra escura estreita aparecia no canto superior esquerdo. Ocorria tanto na aba "Dimensões" quanto na aba "Visualização".

### Causa-raiz
O componente `ThreeView.tsx` usava `className="w-full h-full"` no div raiz. O `h-full` (height: 100%) **não resolve** quando o elemento pai é um flex item — o CSS precisa de uma cadeia ininterrupta de alturas explícitas do elemento raiz até o Canvas. Sem altura concreta no ancestral, o Canvas recebe `height: 0px` e renderiza invisível.

O padrão `flex-1 flex items-center justify-center` no wrapper anterior agravava o problema: o `items-center` dimensiona o filho pelo conteúdo, resultando em height: 0 para o Canvas.

### Solução
1. **ThreeView.tsx**: trocar `className="w-full h-full relative"` por `className="absolute inset-0"` — o componente passa a se auto-posicionar e preencher qualquer pai com `position: relative` e dimensões concretas.
2. **ConfiguratorPage.tsx**: simplificar o wrapper do viewport full-3D para `flex-1 relative min-h-0` (sem wrapper interno desnecessário).
3. **PublicConfiguratorPage.tsx**: adicionar `min-h-0` ao wrapper do viewport — garante que o flex item não transborde o container pai.

### Regra para uso futuro
> Sempre que usar `<ThreeView>`, o pai imediato DEVE ter `position: relative` (ou `absolute`) com altura explícita. Use `flex-1 relative min-h-0` para parents flex, ou `h-{n} relative` para altura fixa.

---

## BUG-002 — getBaseModel() retornando 'escada' para tipos de bancada

**Status:** RESOLVIDO (2026-05-25)  
**Severidade:** Alto (painel de dimensões e cálculo de preço incorretos)

### Sintoma
Para `projectType = 'soleira'`, `'peitoril'` e `'guarda'`, o painel lateral exibia campos de dimensões de escada ("Degraus", "Largura", "Pisada") em vez de campos de bancada.

### Causa-raiz
A função `getBaseModel()` em `src/types.ts` incluía `'soleira'`, `'peitoril'` e `'guarda'` no array `escadaTypes`, mapeando-os para o modelo base `'escada'`. Porém, `get3DModel()` mapeava esses mesmos tipos para `'slab'` — que usa `CountertopConfig`, não `StaircaseConfig`. Havia inconsistência entre os dois mapeamentos.

### Solução
Remover `'soleira'`, `'peitoril'` e `'guarda'` de `escadaTypes` em `getBaseModel()`. Apenas `'escada'`, `'degrau_avulso'` e `'espelho_escada'` usam `StaircaseConfig`.

```typescript
// ANTES (incorreto):
const escadaTypes = ['escada', 'degrau_avulso', 'espelho_escada', 'soleira', 'peitoril', 'guarda']

// DEPOIS (correto):
const escadaTypes = ['escada', 'degrau_avulso', 'espelho_escada']
```

### Regra para uso futuro
> `getBaseModel()` determina qual config de dimensões usar no painel lateral e em `calcPrice()`. `get3DModel()` determina qual componente 3D renderizar. Esses dois mapeamentos são **independentes** — um tipo pode usar config `'pia'` (CountertopConfig) e ainda assim renderizar um modelo 3D 'slab'.

---

## BUG-003 — Editor2D aparecendo para bancada_l, bancada_u e outros tipos

**Status:** RESOLVIDO (2026-05-25)  
**Severidade:** Médio (UI incorreta para ~20 project types)

### Sintoma
O `Editor2D` (canvas 2D SVG de configuração de bancada retangular) era exibido para `bancada_l`, `bancada_u`, `ilha`, `tampo`, etc. — qualquer tipo cujo `getBaseModel()` retornasse `'pia'`.

### Causa-raiz
A condição em `ConfiguratorPage.tsx` usava `baseModel === 'pia'`:
```tsx
// ANTES (incorreto):
{activeTab === 'dimensoes' && baseModel === 'pia' ? (
  <Editor2D /> // Aparecia para TODOS os tipos não-escada
```

### Solução
Trocar para `projectType === 'pia'` — o Editor2D só aparece para o tipo exato `'pia'`:
```tsx
// DEPOIS (correto):
{activeTab === 'dimensoes' && projectType === 'pia' ? (
  <Editor2D />
```

---

## BUG-004 — quotesService perde dados ao recarregar a página

**Status:** RESOLVIDO (2026-05-25)  
**Severidade:** Médio (dados não persistem em dev local)

### Sintoma
Orçamentos criados em dev local (sem Supabase) eram perdidos ao recarregar a página — o array `_mockQuotes` era reinicializado ao estado hardcoded.

### Causa-raiz
`quotesService.ts` usava um array `let _mockQuotes: QuoteRow[]` em memória como fallback. Arrays em memória são reinicializados a cada reload do módulo.

### Solução
Substituir o array em memória por `src/lib/localStore.ts` — uma camada de CRUD sobre `localStorage` com prefixo versionado `marmu:v1:`. Dados persistem entre reloads. Dados de seed são inseridos apenas se o storage estiver vazio (`seedIfEmpty()`).

---

---

## BUG-005 — WebGL Context Lost (canvas apaga ao montar)

**Status:** RESOLVIDO (2026-05-25)  
**Severidade:** Crítico (canvas em branco após mount)

### Sintoma
`THREE.WebGLRenderer: Context Lost.` aparecia duas vezes no console. O canvas 3D ficava em branco ou desaparecia logo após montar.

### Causa-raiz
`<StrictMode>` do React monta componentes **duas vezes** em desenvolvimento para detectar efeitos colaterais. Cada mount do `<Canvas>` do R3F cria um contexto WebGL. Com 2 contextos simultâneos o browser satura o pool de contextos (limite ~8–16) e perde o primeiro contexto criado — resultando no canvas em branco.

### Solução
Remover `<StrictMode>` de `src/main.tsx`. Em produção, StrictMode já é desativado automaticamente pelo React. Para projetos com Three.js/R3F, StrictMode é incompatível pelo modelo de duplo-mount.

```tsx
// ANTES (quebrado com R3F):
createRoot(...).render(<StrictMode><App /></StrictMode>)

// DEPOIS (correto):
createRoot(...).render(<App />)
```

### Regra para uso futuro
> Nunca use `<StrictMode>` em aplicações que contenham `@react-three/fiber Canvas`. O duplo-mount do StrictMode destrói e recria contextos WebGL, ultrapassando o limite do browser.

---

## BUG-006 — THREE.PCFSoftShadowMap deprecation warning

**Status:** RESOLVIDO (2026-05-25)  
**Severidade:** Baixo (warning no console, não funcional)

### Sintoma
`THREE.WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.`

### Causa-raiz
Three.js 0.184 deprecou `PCFSoftShadowMap`. O R3F/`Canvas` com `shadows` prop usava esse tipo por padrão.

### Solução
Passar o tipo de sombra explicitamente em `ThreeView.tsx`:
```tsx
import { PCFShadowMap } from 'three'
<Canvas shadows={{ type: PCFShadowMap }} ...>
```

---

## BUG-007 — THREE.Clock deprecation warning (drei interno)

**Status:** MITIGADO (2026-05-25) — patch ativo em `src/lib/threePatch.ts`  
**Severidade:** Baixo (warning no console, não funcional)

### Sintoma
`THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`

### Causa-raiz
`@react-three/drei` 10.7.x usa `THREE.Clock` internamente (OrbitControls, useFrame). Three.js 0.184 deprecou `THREE.Clock` em favor de `THREE.Timer`. O drei ainda não foi atualizado para usar a nova API.

### Solução temporária
`src/lib/threePatch.ts` sobrescreve `console.warn` para suprimir esse warning específico. O patch é importado no topo de `src/main.tsx`.

### Solução definitiva (pendente)
Atualizar `@react-three/drei` para uma versão que use `THREE.Timer` nativamente. Monitorar releases do drei para compatibilidade com three 0.184+. Remover o patch quando a atualização for feita.

---

## Checklist Antes de Criar Componentes 3D

- [ ] O parent do `<ThreeView>` tem `position: relative` e altura explícita?
- [ ] O novo `ProjectType` foi adicionado a `get3DModel()` com o modelo correto?
- [ ] Se usa `StaircaseConfig`, o tipo foi adicionado a `escadaTypes` em `getBaseModel()`?
- [ ] O novo componente usa `useMemo` para textura e material (evitar recriação por frame)?
- [ ] O template `_TemplateModel.tsx` foi consultado antes de implementar?
