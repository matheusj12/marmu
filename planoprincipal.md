# Plano Principal — Synkra AIOX

## Agentes

| Agente | Persona | Escopo | Ativação |
|--------|---------|--------|----------|
| `@dev` | Dex | Implementação de código | `@dev` ou `/AIOX:agents:dev` |
| `@qa` | Quinn | Testes e qualidade | `@qa` ou `/AIOX:agents:qa` |
| `@architect` | Aria | Arquitetura e design técnico | `@architect` ou `/AIOX:agents:architect` |
| `@pm` | Morgan | Product Management, PRDs, epics | `@pm` ou `/AIOX:agents:pm` |
| `@po` | Pax | Product Owner, validação de stories, backlog | `@po` ou `/AIOX:agents:po` |
| `@sm` | River | Scrum Master, criação de stories | `@sm` ou `/AIOX:agents:sm` |
| `@analyst` | Alex | Pesquisa e análise de mercado | `@analyst` ou `/AIOX:agents:analyst` |
| `@data-engineer` | Dara | Database design, migrations, RLS | `@data-engineer` ou `/AIOX:agents:data-engineer` |
| `@ux-design-expert` | Uma | UX/UI design | `@ux-design-expert` ou `/AIOX:agents:ux-design-expert` |
| `@devops` | Gage | CI/CD, git push (EXCLUSIVO), releases | `@devops` ou `/AIOX:agents:devops` |
| `@aiox-master` | — | Governança do framework, orquestração | `@aiox-master` ou `/AIOX:agents:aiox-master` |

---

## Skills

### AIOX / Desenvolvimento

| Skill | Descrição |
|-------|-----------|
| `architect-first` | Filosofia Architect-First — design antes do código |
| `coderabbit-review` | Code review automatizado via CodeRabbit CLI |
| `checklist-runner` | Executa qualquer checklist `.md` (YOLO ou interativo) |
| `tech-search` | Pesquisa técnica profunda com WebSearch + workers |
| `skill-creator` | Cria ou atualiza skills |
| `mcp-builder` | Cria servidores MCP (Python/Node) |
| `claude-api` | Build/debug com Anthropic SDK e prompt caching |

### SYNAPSE

| Skill | Descrição |
|-------|-----------|
| `synapse` | Context engine — domínios, regras, pipeline de 8 camadas |
| `synapse:manager` | Gerenciador SYNAPSE |
| `synapse:tasks:suggest-domain` | Sugere novo domínio |
| `synapse:tasks:create-domain` | Cria domínio |
| `synapse:tasks:add-rule` | Adiciona regra |
| `synapse:tasks:edit-rule` | Edita regra |
| `synapse:tasks:toggle-domain` | Ativa/desativa domínio |
| `synapse:tasks:create-command` | Cria comando star-command |
| `synapse:tasks:diagnose-synapse` | Diagnóstico completo do SYNAPSE |

### Claude Code / Utilidades

| Skill | Descrição |
|-------|-----------|
| `code-review` | Review do diff atual (low/medium/high/ultra) |
| `simplify` | Review + aplica fixes automaticamente |
| `security-review` | Revisão de segurança do branch atual |
| `verify` | Roda o app e observa comportamento real |
| `run` | Inicia o app do projeto |
| `init` | Inicializa CLAUDE.md com docs do codebase |
| `review` | Revisa um pull request |
| `loop` | Executa comando em intervalos recorrentes |
| `schedule` | Agenda agents remotos em cron |
| `update-config` | Configura settings.json (hooks, permissões, env vars) |
| `keybindings-help` | Customiza atalhos de teclado |
| `fewer-permission-prompts` | Reduz prompts de permissão adicionando allowlist |
| `greet` | Saudação inicial |

---

## Plano de Desenvolvimento — Sistema Marmu para Marmorarias

### Contexto

Sistema web de configuração paramétrica de pedras (bancadas, escadas, pisos) para marmorarias.
Interface com **Dual Viewport** (Editor 2D superior + Visualizador 3D inferior), painel de materiais,
geração de orçamento profissional e **link público** para o cliente visualizar o 3D sem editar.

Stack atual: React + TypeScript + Vite + Three.js/R3F + Tailwind + Lucide Icons

---

### Estado Atual — O que já existe

| Componente | Arquivo | Status |
|------------|---------|--------|
| Editor 2D (bancada retangular, escada) | `src/components/Editor2D.tsx` | ✅ Funcional |
| Visualizador 3D (Three.js) | `src/components/ThreeView.tsx` | ✅ Funcional |
| Modelo 3D bancada (reta, cuba, cooktop) | `src/components/BancadaModel.tsx` | ✅ Funcional |
| Modelo 3D escada | `src/components/EscadaModel.tsx` | ✅ Funcional |
| Orçamento / Invoice | `src/components/BudgetInvoice.tsx` | ✅ Funcional |
| Catálogo de materiais (procedural) | `src/materials.ts` | ✅ Funcional |
| Cálculo de orçamento (área, ML saia/frontão) | `src/App.tsx` | ✅ Funcional |
| Dados do cliente (nome, telefone, endereço) | `src/App.tsx` | ✅ Funcional |

---

### O que ainda precisa ser construído

#### Epic 1 — Tipos de Bancada Avançados
> Expandir o configurador para suportar formatos especiais de pedra

| # | Story | Descrição | Prioridade |
|---|-------|-----------|-----------|
| 1.1 | Bancada em L | Shape em L no Editor2D + `BancadaLModel` no Three.js com `ExtrudeGeometry` composto de 2 retângulos | 🔴 Alta |
| 1.2 | Rebaixo Italiano | Cuba escavada diretamente na pedra (diferente do inox embutir) — novo `sinkType: 'rebaixo_italiano'` com geometria CSG no 3D | 🔴 Alta |
| 1.3 | Bancada em U | Shape em U — 3 segmentos retangulares conectados, configuração de braços | 🟡 Média |
| 1.4 | Bancada Curva / Raio | Editor 2D com ponto de curvatura arrastável, Three.js `CatmullRomCurve3` + ExtrudeGeometry | 🟢 Baixa |

**Arquivos a criar/alterar:**
- `src/types.ts` — adicionar `'bancada_l' | 'bancada_u'` em `ProjectType`, `BancadaLConfig`
- `src/components/BancadaLModel.tsx` — novo componente 3D
- `src/components/Editor2D.tsx` — modo de desenho em L
- `src/App.tsx` — estados e cálculos para Bancada em L

---

#### Epic 2 — Link Público e Modo Read-Only
> Cliente recebe URL única, visualiza 3D e orçamento sem poder editar

| # | Story | Descrição | Prioridade |
|---|-------|-----------|-----------|
| 2.1 | React Router | Instalar `react-router-dom`, criar rota `/` (editor) e `/proposta/:uuid` (cliente) | 🔴 Alta |
| 2.2 | Persistência local | Salvar configuração completa em `localStorage` com UUID gerado por `crypto.randomUUID()` | 🔴 Alta |
| 2.3 | Botão "Gerar Link Público" | Gera UUID, salva snapshot do estado, exibe URL para copiar | 🔴 Alta |
| 2.4 | Página `/proposta/:uuid` | Carrega snapshot pelo UUID, renderiza 3D + orçamento em modo leitura | 🔴 Alta |
| 2.5 | Prop `readOnly` | Sidebar e controles ocultos; OrbitControls ativo; edição de dimensões desabilitada | 🔴 Alta |
| 2.6 | Persistência Supabase | Migrar de localStorage para tabela `proposals` no Supabase (UUID, JSON config, created_at) | 🟡 Média |

**Arquivos a criar/alterar:**
- `src/main.tsx` — wrapper `<BrowserRouter>`
- `src/pages/EditorPage.tsx` — extrai o editor do App.tsx
- `src/pages/ProposalPage.tsx` — rota `/proposta/:uuid`, busca e renderiza snapshot
- `src/hooks/useProposal.ts` — save/load de propostas
- `src/App.tsx` — adicionar botão "Gerar Link" e prop `readOnly`
- `src/components/ThreeView.tsx` — receber `readOnly` e desabilitar eventos
- `src/components/Editor2D.tsx` — receber `readOnly` e desabilitar drag

---

#### Epic 3 — Catálogo Visual de Materiais
> Painel com cards de materiais com foto/textura, filtros e seleção visual

| # | Story | Descrição | Prioridade |
|---|-------|-----------|-----------|
| 3.1 | Cards visuais de material | Cards com preview de textura (canvas 64×64), nome, tipo e preço/m² | 🔴 Alta |
| 3.2 | Filtros por categoria | Botões "Todos / Granito / Mármore / Quartzo / Ultra" com contagem | 🟡 Média |
| 3.3 | Upload de textura custom | Admin pode subir imagem de textura para um material | 🟢 Baixa |

---

#### Epic 4 — Melhorias de UX e 2D
> Aprimorar a edição 2D com cotas visuais e snap de grid

| # | Story | Descrição | Prioridade |
|---|-------|-----------|-----------|
| 4.1 | Linhas de cota no 2D | Desenhar linhas de cota vermelhas/azuis com medidas em cm no Editor2D (SVG overlay) | 🔴 Alta |
| 4.2 | Snap to grid | Redimensionamento com snap para múltiplos de 5cm | 🟡 Média |
| 4.3 | Indicadores de acabamento | Linhas laranja/pontilhadas para saia e frontão no 2D | 🟡 Média |

---

#### Epic 5 — Exportação e Finalização
> Gerar PDF do orçamento e compartilhamento profissional

| # | Story | Descrição | Prioridade |
|---|-------|-----------|-----------|
| 5.1 | Export PDF do orçamento | `react-pdf` ou `html2canvas + jsPDF` para gerar PDF da BudgetInvoice | 🟡 Média |
| 5.2 | Compartilhamento WhatsApp | Botão "Enviar por WhatsApp" com link público pré-formatado | 🟡 Média |
| 5.3 | Múltiplos projetos no mesmo orçamento | Adicionar N itens (bancada + escada + piso) num único orçamento | 🟢 Baixa |

---

### Ordem de Implementação Recomendada

```
Sprint 1 (fundação crítica):
  Epic 2.1 → 2.2 → 2.3 → 2.4 → 2.5   (Link público — diferencial do produto)

Sprint 2 (tipos de bancada):
  Epic 1.1 → 1.2                        (Bancada em L + Rebaixo Italiano)

Sprint 3 (UX):
  Epic 3.1 → 3.2 → 4.1                 (Cards de material + cotas 2D)

Sprint 4 (finalização):
  Epic 5.1 → 5.2 → 1.3                 (PDF + WhatsApp + Bancada U)
```

---

### Decisões de Arquitetura

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Roteamento | `react-router-dom v6` | Padrão React, suporta hash routing no Vercel |
| Persistência inicial | `localStorage` + `crypto.randomUUID()` | Zero backend, funciona offline, rápido de implementar |
| Persistência futura | Supabase (tabela `proposals`) | Já configurado no projeto, RLS simples |
| 3D Bancada em L | `ExtrudeGeometry` com `Shape` composto | Mesmo padrão do BancadaModel atual |
| CSG (Rebaixo) | Three.js manual com geometrias divididas | CSG real requer lib extra; divisão de malha é mais leve |
| PDF | `html2canvas` + `jsPDF` | Sem dependência de servidor, funciona client-side |

---

## Funções Implementadas — Documentação Técnica

### Exportar Orçamento

**Arquivo:** `src/components/BudgetInvoice.tsx`  
**Trigger:** Botão "Exportar Orçamento" no footer do editor → `setShowInvoice(true)` → monta `<BudgetInvoice>` como modal

#### Fluxo completo

```
[Footer EditorPage]
  └─ onClick → setShowInvoice(true)
       └─ <BudgetInvoice type countertop staircase material quote onClose>
            ├─ computations()         ← recalcula preços internamente
            ├─ Renderiza documento
            │    ├─ Cabeçalho: logo, Nº orçamento (6 dígitos aleatórios), data, validade 15 dias
            │    ├─ Dados do cliente (nome, telefone, endereço do `quote`)
            │    ├─ Material selecionado + tipo do projeto
            │    ├─ Croqui 2D: <Editor2D> embutido a 90% de escala
            │    └─ Tabela itemizada de valores
            │         ├─ Área da pedra principal (m² × R$/m²)
            │         ├─ Frontões/espelhos (ml × R$/ml) — se mlFrontao > 0
            │         ├─ Saias de borda 45º (ml × R$/ml) — se mlSaia > 0
            │         └─ Acabamento/recortes (cuba, cooktop, degraus) — se fabricationCost > 0
            ├─ Resumo: subtotal → desconto → frete/instalação → TOTAL
            └─ Botão "Imprimir / Salvar PDF" → window.print()
```

#### Impressão / PDF

- `handlePrint()` chama `window.print()` — sem biblioteca externa (sem jsPDF, sem html2canvas)
- Layout adapta via classes Tailwind `print:*`: fundo branco, texto preto, bordas em cinza
- Browser abre diálogo nativo → usuário salva como PDF
- `ThreeView` usa `gl={{ preserveDrawingBuffer: true }}` (preparado para captura de canvas futura, não usada ainda)

#### Cálculo de preços (interno ao BudgetInvoice)

`computations()` é função local em `BudgetInvoice.tsx` — **mais detalhada** que `calcBudgets.ts`:

| Campo | Fórmula |
|-------|---------|
| `baseAreaM2` | `width × depth` (bancada) ou `steps × stepWidth × stepDepth + risers` (escada) |
| `mlFrontao` | `width + depth×2` se frontões laterais ativos |
| `mlSaia` | `width + depth×2` (frente + 2 lados) |
| `stoneCost` | `baseAreaM2 × material.pricePerM2` |
| `frontaoCost` | `mlFrontao × material.pricePerML_Frontao` |
| `saiaCost` | `mlSaia × material.pricePerML_Saia` |
| `fabricationCost` | Cuba R$150–450 + Cooktop R$120 (bancada) / R$40×degraus (escada) |
| `total` | `subtotal − desconto + frete` |

#### Dois modos de renderização

| Prop | Onde usado | Comportamento |
|------|-----------|---------------|
| `readOnly=false` (default) | EditorPage | Modal `fixed inset-0 z-50`, botão "Fechar" visível |
| `readOnly=true` | ProposalPage | Inline `w-full`, sem overlay, sem botão "Fechar" |

#### Notas para evolução futura

- O `quoteId` é gerado com `Math.floor(Math.random() * 900000)` — não persiste entre reloads. Ao implementar Supabase (Epic futura), usar ID sequencial do banco.
- `computations()` duplica lógica de `calcBudgets.ts`. Ideal unificar em `calcBudgets.ts` com retorno expandido.
- Story 5.1 do plano prevê upgrade para `html2canvas + jsPDF` para PDF com imagem 3D embutida.

---

## Fluxo de Trabalho (Story Development Cycle)

```
@sm *draft → @po *validate → @dev *develop → @qa *qa-gate → @devops *push
```

## Autoridade Exclusiva

| Operação | Agente |
|----------|--------|
| `git push` | `@devops` (EXCLUSIVO) |
| `gh pr create / merge` | `@devops` (EXCLUSIVO) |
| `*execute-epic` | `@pm` (EXCLUSIVO) |
| `*validate-story-draft` | `@po` (EXCLUSIVO) |
| `*draft` / `*create-story` | `@sm` (EXCLUSIVO) |
