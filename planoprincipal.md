# Plano Principal — Marmu SaaS
**Versão:** 1.0 | **Data:** 2026-05-25 | **Status:** ATIVO

---

## 🧭 Visão Geral

Transformar o **Marmu 3D Simulator** (configurador de mármores/granitos com geração de orçamentos) em um **SaaS B2B multi-tenant** — vendido para marmorarias e revendedores de pedras naturais.

**Produto:** Cada empresa contratante recebe acesso a um painel onde configura seus materiais e preços. Seus clientes acessam o configurador 3D personalizado, montam bancadas/escadas e recebem orçamentos automáticos.

**URL de inspiração:** https://www.marmu.com.br/#demo

---

## 🏗️ Estado Atual do Projeto

### ✅ VERSÃO DEMO — PRONTA (pasta `src/`)

**A pasta `src/` contém a versão demo funcional e completa do produto.** Não precisa ser reconstruída — deve ser integrada ao SaaS como a experiência de demonstração pública.

| Arquivo / Componente | Status | O que faz |
|----------------------|--------|-----------|
| `src/App.tsx` | ✅ PRONTO | App monolítico com todo o fluxo demo |
| `src/components/ThreeView.tsx` | ✅ PRONTO | Visualizador 3D com Three.js |
| `src/components/BancadaModel.tsx` | ✅ PRONTO | Modelo 3D de bancada |
| `src/components/EscadaModel.tsx` | ✅ PRONTO | Modelo 3D de escada |
| `src/components/Editor2D.tsx` | ✅ PRONTO | Editor com dimensões 2D |
| `src/components/BudgetInvoice.tsx` | ✅ PRONTO | Geração de orçamento/invoice |
| `src/materials.ts` | ✅ PRONTO | Catálogo de 20+ materiais com preços |
| `src/types.ts` | ✅ PRONTO | Types TypeScript completos |
| `src/utils/textureGenerator.ts` | ✅ PRONTO | Geração procedural de texturas |

**O que a demo faz hoje:**
- Configurador 3D de bancadas (pia, cooktop, frontão, saia, estilo de canto)
- Configurador 3D de escadas (cascata, flutuante, plisada)
- 20+ materiais reais (granito, mármore, quartzo, ultra) com preços
- Geração de orçamento com dados do cliente, desconto, frete
- Impressão/invoice do orçamento

**Plano de uso no SaaS:**
- A demo vira a rota pública `/:tenant-slug` — cada tenant tem sua versão com seus materiais
- O catálogo fixo `materials.ts` migra para a tabela `materials` no Supabase (personalizável por tenant)
- Os componentes 3D são reaproveitados integralmente, apenas recebendo dados do Supabase

---

### Stack atual (confirmado pela análise do código)
| Elemento | Tecnologia |
|----------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| Estilo | TailwindCSS v4 |
| Design System | Obsidian (dark, violet #a78bfa + emerald #34d399, fonte Geist) |
| IA | Gemini API |
| Icons | Lucide React + Material Symbols |
| State | useState local (sem gerenciador global) |
| Auth | NENHUMA |
| Banco | NENHUM |
| Backend | Express básico |

### Telas prontas (FRONT END OBRIGATORIO — HTML precisam virar React)
| Pasta | Tela | Prioridade |
|-------|------|-----------|
| `dashboard_marmu/` | Dashboard principal com sidebar | ALTA |
| `editor_3d_marmu/` | Editor 3D com painel lateral | ALTA |
| `configura_o_de_or_amento/` | Configuração de orçamento | ALTA |
| `finaliza_o_de_or_amento/` | Finalização e impressão | ALTA |

### Problemas a resolver
- App.tsx único com ~1200 linhas (monolítico)
- Sem rotas, sem auth, sem persistência
- Arquivos soltos na raiz (imagens, ZIPs, PDFs, Zone.Identifier)
- `name: "react-example"` no package.json (placeholder)
- Gemini API key exposta sem proxy seguro
- Sem separação frontend/backend adequada

---

## 🎯 Arquitetura SaaS

### Modelo de Negócio Multi-Tenant
```
Master Admin (Marmu)
    └── Tenant 1: Marmoraria Silva
    │       └── Operadores: João, Maria
    │       └── Materiais: Personalizados
    │       └── Clientes: Acessam /marmoraria-silva
    └── Tenant 2: Granitos Norte
    │       └── Operadores: Pedro
    │       └── Materiais: Próprios
    └── Tenant N: ...
```

### Stack Escolhida (mantém o que funciona)
| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | React 19 + TS + Vite | Já existe, não mudar |
| Roteamento | React Router v7 | Padrão React, suporte a layouts |
| Estado Global | Zustand | Leve, sem boilerplate |
| 3D | Three.js + R3F | Já implementado, manter |
| Estilo | TailwindCSS v4 + design Obsidian | Já existe, manter cores |
| Auth | Supabase Auth (email/senha) | Sem Google, sem OAuth externo |
| Banco | Supabase (PostgreSQL + RLS) | Gratuito até escala média |
| Storage | Supabase Storage | Logos dos tenants, imagens |
| Deploy FE | Vercel | CI automático via GitHub |
| Deploy API | Supabase Edge Functions | Serverless, sem VPS |
| IA | Gemini API (via Edge Function proxy) | Chave nunca no frontend |
| Repositório | GitHub (novo repo limpo) | Sem dados sensíveis |

---

## 📁 Nova Estrutura de Pastas

```
marmu-saas/
├── src/
│   ├── app/                        # Layouts e rotas
│   │   ├── (auth)/                 # Páginas de autenticação
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/            # Área logada (tenant admin)
│   │   │   ├── dashboard/          # Página inicial
│   │   │   ├── materials/          # Gestão de materiais
│   │   │   ├── quotes/             # Histórico de orçamentos
│   │   │   ├── settings/           # Configurações da empresa
│   │   │   └── users/              # Gestão de usuários
│   │   ├── (master)/               # Admin master (Marmu)
│   │   │   ├── tenants/
│   │   │   └── plans/
│   │   └── (public)/               # Configurador público
│   │       └── [tenant-slug]/      # /marmoraria-silva
│   │
│   ├── components/
│   │   ├── ui/                     # Componentes base (Button, Input, Card...)
│   │   ├── layout/                 # Sidebar, Header, PageLayout
│   │   ├── 3d/                     # Componentes Three.js
│   │   │   ├── ThreeView.tsx       # migrado de src/components/ThreeView.tsx
│   │   │   ├── BancadaModel.tsx
│   │   │   └── EscadaModel.tsx
│   │   ├── configurator/           # Painéis do configurador
│   │   └── invoice/                # BudgetInvoice
│   │
│   ├── features/
│   │   ├── auth/                   # Login, register, middleware
│   │   ├── configurator/           # Lógica do configurador 3D
│   │   ├── materials/              # CRUD de materiais
│   │   ├── quotes/                 # Geração e listagem de orçamentos
│   │   └── tenants/                # Gestão de empresas (master)
│   │
│   ├── hooks/                      # useAuth, useTenant, useQuote...
│   ├── lib/
│   │   ├── supabase.ts             # Cliente Supabase
│   │   └── utils.ts
│   ├── services/                   # Chamadas à API Supabase
│   ├── store/                      # Zustand stores
│   │   ├── authStore.ts
│   │   ├── configuratorStore.ts    # migra estado atual do App.tsx
│   │   └── tenantStore.ts
│   └── types/
│       ├── database.ts             # Types gerados do Supabase
│       └── index.ts
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── functions/
│   │   ├── generate-quote-pdf/
│   │   └── gemini-proxy/           # Proxy seguro para Gemini API
│   └── seed.sql
│
├── public/
│   └── assets/
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── docs/
│   └── stories/
│
├── .env.example
├── .gitignore
├── package.json                    # name: "marmu-saas"
└── vercel.json
```

---

## 🗄️ Schema do Banco de Dados (Supabase)

```sql
-- Planos disponíveis
plans (
  id uuid PRIMARY KEY,
  name text,                    -- "Free", "Pro", "Enterprise"
  price_monthly numeric,
  max_users int,
  max_quotes_per_month int,
  features jsonb                -- {"custom_branding": true, "ai_suggestions": true}
)

-- Empresas (tenants)
tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,           -- "Marmoraria Silva"
  slug text UNIQUE,             -- "marmoraria-silva" (URL pública)
  logo_url text,
  primary_color text,           -- Personalização de marca
  plan_id uuid REFERENCES plans,
  active boolean DEFAULT true,
  created_at timestamptz
)

-- Perfis de usuários (auth gerenciado pelo Supabase Auth)
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  tenant_id uuid REFERENCES tenants,
  name text,
  role text CHECK (role IN ('master', 'admin', 'operator')),
  created_at timestamptz
)

-- Materiais por tenant
materials (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants,
  name text,
  category text CHECK (category IN ('granito', 'marmore', 'quartzo', 'ultra')),
  color text,
  secondary_color text,
  texture_type text,
  price_per_m2 numeric,
  price_saia_ml numeric,
  price_frontao_ml numeric,
  roughness numeric,
  metalness numeric,
  active boolean DEFAULT true,
  created_at timestamptz
)

-- Orçamentos gerados
quotes (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants,
  created_by uuid REFERENCES profiles,
  client_name text,
  client_phone text,
  client_address text,
  project_type text CHECK (project_type IN ('pia', 'escada')),
  configuration jsonb,          -- Config completa do projeto
  material_id uuid REFERENCES materials,
  subtotal numeric,
  discount numeric,
  tax numeric,
  total numeric,
  status text DEFAULT 'draft',  -- draft | sent | approved | rejected
  observations text,
  created_at timestamptz
)

-- Assinaturas
subscriptions (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants,
  plan_id uuid REFERENCES plans,
  status text,                  -- active | past_due | canceled | trialing
  current_period_start timestamptz,
  current_period_end timestamptz
)
```

### Políticas RLS (Row Level Security)
```sql
-- Cada tenant só vê seus próprios dados
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON materials
  USING (tenant_id = (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Mesma política aplicada a: quotes, profiles
-- Tabela plans: somente leitura para todos os autenticados
```

---

## 🔐 Sistema de Autenticação (Sem Google)

### Fluxo completo
```
/login            email + senha → Supabase Auth → JWT → redirect /dashboard
/register         email + senha + nome + empresa → cria tenant + profile → /dashboard
/forgot-password  email → Supabase envia link reset
/reset-password   nova senha via token do link
```

### Implementação Supabase Auth
```typescript
// Login
supabase.auth.signInWithPassword({ email, password })

// Registro (cria tenant + profile via trigger ou RPC)
supabase.auth.signUp({ email, password, options: { data: { name, company } } })

// Recuperar senha
supabase.auth.resetPasswordForEmail(email)

// Trocar senha
supabase.auth.updateUser({ password: newPassword })
```

### Sem Google OAuth — zero dependência de providers externos

---

## 🚀 Deploy — Pipeline Completo

### 1. GitHub (repo limpo)
```
# Criar novo repo: github.com/seu-usuario/marmu-saas
# .gitignore OBRIGATORIO incluir:
.env
.env.local
*.env.*
dist/
node_modules/
*.Zone.Identifier
*.zip
imagens do sistema/
marmu textos explicacoes tutoriais.pdf
```

### 2. Vercel (frontend)
```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```
- Branch `main` → deploy em produção automático
- Branch `dev` → preview URL automática para testes
- Variáveis de ambiente gerenciadas no painel Vercel

### 3. Supabase
- Projeto criado em app.supabase.com
- Migrations versionadas em `supabase/migrations/`
- `supabase db push` para aplicar
- Edge Function `gemini-proxy` mantém GEMINI_API_KEY segura no servidor

### 4. Variáveis de ambiente
```bash
# .env.example (commitado, sem valores reais)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
# GEMINI_API_KEY fica SOMENTE em Supabase Edge Functions secrets, nunca no frontend
```

---

## 📋 Checklist de Implementação

> **Legenda:** `@agente` = ativar com `@nome` | `/skill` = invocar com `/skill-name` | **OBRIGATÓRIO** = não pular

---

### Fase 0 — Setup (Dia 1)
**Agente obrigatório:** `@devops (Gage)`
**Skills obrigatórias:** `/architect-first` (validar stack antes de configurar)

| # | Tarefa | Agente | Skill |
|---|--------|--------|-------|
| 0.1 | Criar repo GitHub limpo (`marmu-saas`) | `@devops` | — |
| 0.2 | Criar `.gitignore` completo (Zone.Identifier, ZIPs, .env, PDFs) | `@devops` | — |
| 0.3 | Renomear `package.json` name para `marmu-saas` | `@dev` | — |
| 0.4 | Mover imagens/assets para `/public/assets/` | `@dev` | — |
| 0.5 | Instalar: `react-router-dom`, `zustand`, `@supabase/supabase-js` | `@dev` | — |
| 0.6 | Criar projeto no Supabase | `@devops` | — |
| 0.7 | Criar projeto no Vercel e conectar ao GitHub | `@devops` | — |

```
Ativar: @devops
Comando: *task setup-github-repo
```

---

### Fase 1 — Estrutura Base (Dias 2-4)
**Agente obrigatório:** `@architect (Aria)` → valida antes, `@dev (Dex)` → executa
**Skills obrigatórias:** `/architect-first` OBRIGATÓRIO antes de criar qualquer pasta

| # | Tarefa | Agente | Skill |
|---|--------|--------|-------|
| 1.1 | Validar estrutura de pastas proposta | `@architect` | `/architect-first` |
| 1.2 | Criar nova estrutura de pastas conforme arquitetura | `@dev` | — |
| 1.3 | Mover componentes 3D para `src/components/3d/` | `@dev` | — |
| 1.4 | Quebrar `App.tsx` monolítico em features separadas | `@dev` | `/simplify` |
| 1.5 | Criar `src/lib/supabase.ts` com cliente Supabase | `@dev` | — |
| 1.6 | Criar `src/store/configuratorStore.ts` (migra useState do App.tsx) | `@dev` | — |
| 1.7 | Configurar React Router com layouts aninhados | `@dev` | — |
| 1.8 | Review de qualidade da estrutura | `@qa` | `/coderabbit-review` |

```
Ativar: @architect
Comando: *task validate-architecture
Depois: @dev *task refactor-app-structure
```

---

### Fase 2 — Auth (Dias 5-7)
**Agente obrigatório:** `@dev (Dex)` + `@qa (Quinn)` obrigatório no gate final
**Skills obrigatórias:** `/architect-first` para fluxo de auth, `/coderabbit-review` OBRIGATÓRIO antes de fechar

| # | Tarefa | Agente | Skill |
|---|--------|--------|-------|
| 2.1 | Criar story de auth (login + register + forgot-password) | `@sm` | — |
| 2.2 | Validar story de auth | `@po` | — |
| 2.3 | Tela de Login (`/login`) seguindo design Obsidian | `@dev` | — |
| 2.4 | Tela de Registro (`/register`) — cria tenant + profile | `@dev` | — |
| 2.5 | Tela Esqueci Senha (`/forgot-password`) | `@dev` | — |
| 2.6 | `ProtectedRoute` component + `useAuth` hook | `@dev` | — |
| 2.7 | `authStore` Zustand | `@dev` | — |
| 2.8 | QA Gate — segurança de auth (JWT, redirect, RLS) | `@qa` | `/coderabbit-review` |

```
Ativar: @sm → @po → @dev → @qa
Comando: @sm *create-story "auth-system"
```

---

### Fase 3 — Converter FRONT END OBRIGATORIO (Dias 8-12)
**Agente obrigatório:** `@ux-design-expert (Uma)` — EXCLUSIVO para conversão HTML→React
**Skills obrigatórias:** `/architect-first` para cada componente complexo, `/simplify` após cada conversão

| # | Tarefa | Agente | Skill |
|---|--------|--------|-------|
| 3.1 | Analisar as 4 telas HTML e mapear componentes reutilizáveis | `@ux-design-expert` | `/architect-first` |
| 3.2 | Converter `dashboard_marmu/code.html` → `DashboardPage.tsx` | `@ux-design-expert` | — |
| 3.3 | Converter `editor_3d_marmu/code.html` → integrar ThreeView existente | `@ux-design-expert` + `@dev` | — |
| 3.4 | Converter `configura_o_de_or_amento/code.html` → `ConfiguratorPage.tsx` | `@ux-design-expert` | — |
| 3.5 | Converter `finaliza_o_de_or_amento/code.html` → `QuoteFinalizationPage.tsx` | `@ux-design-expert` | — |
| 3.6 | Criar `Sidebar.tsx` reutilizável (extraído do dashboard) | `@ux-design-expert` | `/simplify` |
| 3.7 | Criar componentes UI base: Button, Input, Card, Badge, Modal | `@ux-design-expert` | `/simplify` |
| 3.8 | Centralizar TailwindCSS config (cores Obsidian em `tailwind.config.ts`) | `@dev` | — |
| 3.9 | QA visual — validar fidelidade ao design original | `@qa` | `/verify` |

```
Ativar: @ux-design-expert
Comando: *task convert-html-to-react "FRONT END OBRIGATORIO"
```

---

### Fase 4 — Banco de Dados (Dias 13-15)
**Agente obrigatório:** `@data-engineer (Dara)` — EXCLUSIVO para schema e RLS
**Skills obrigatórias:** `/architect-first` OBRIGATÓRIO antes de criar qualquer migration, `db-sage` para validação

| # | Tarefa | Status |
|---|--------|--------|
| 4.1 | Validar schema proposto (plans, tenants, profiles, materials, quotes) | ✅ **FEITO 2026-05-25** |
| 4.2 | Criar migration `001_initial_schema.sql` | ✅ **FEITO 2026-05-25** |
| 4.3 | Aplicar RLS em todas as tabelas (isolamento por tenant_id) | ✅ **FEITO 2026-05-25** |
| 4.4 | Criar seed com planos padrão + 14 materiais base | ✅ **FEITO 2026-05-25** |
| 4.5 | **APLICAR no Supabase** (Cloud ou local) + configurar `.env.local` | ⏳ **AGUARDANDO VOCÊ** |
| 4.6 | Gerar types TypeScript: `supabase gen types typescript` | ⏳ Após aplicar |
| 4.7 | Criar `services/materialsService.ts` | ⏳ Fase 5 |
| 4.8 | Criar `services/quotesService.ts` | ⏳ Fase 5 |
| 4.9 | Auditoria de segurança do schema e RLS | ⏳ Fase 5 |

**Arquivos prontos para aplicar:**
- `supabase/migrations/001_initial_schema.sql` — schema completo + RLS + triggers
- `supabase/seed.sql` — planos (Starter/Pro/Enterprise) + 14 materiais base
- `supabase/README.md` — instruções passo a passo (Cloud ou CLI)

**Próximo passo:** escolher Supabase Cloud ou CLI local → aplicar as migrations → voltar aqui com a URL e key.

```
Ativar: @data-engineer
Comando: *task create-supabase-schema
Gate obrigatório: @qa deve aprovar antes de aplicar em produção
```

---

### Fase 5 — Features Dashboard (Dias 16-19)
**Agente obrigatório:** `@dev (Dex)` implementa, `@qa (Quinn)` valida cada feature
**Skills obrigatórias:** `/coderabbit-review` antes de cada PR, `/verify` para validar UI

| # | Tarefa | Agente | Skill |
|---|--------|--------|-------|
| 5.1 | Criar stories para cada feature do dashboard | `@sm` | — |
| 5.2 | Validar stories | `@po` | — |
| 5.3 | CRUD de materiais (listar, adicionar, editar, ativar/desativar) | `@dev` | — |
| 5.4 | Listagem de orçamentos com filtros e paginação | `@dev` | — |
| 5.5 | Configurações da empresa (logo, nome, slug público) | `@dev` | — |
| 5.6 | Gestão de usuários (convidar por email, definir role) | `@dev` | — |
| 5.7 | QA Gate — testar CRUD + permissões por role | `@qa` | `/verify` + `/coderabbit-review` |
| 5.8 | Git commit + PR | `@devops` | — |

```
Ativar: @sm → @po → @dev → @qa → @devops
Fluxo: SDC completo (Story Development Cycle)
```

---

### Fase 6 — Configurador Público (Dias 20-21)
**Agente obrigatório:** `@dev (Dex)` + `@ux-design-expert (Uma)` para integração 3D
**Skills obrigatórias:** `/verify` obrigatório — testar o fluxo completo do cliente final

| # | Tarefa | Status |
|---|--------|--------|
| 6.1 | Criar rota pública `/:slug` | ✅ **FEITO 2026-05-25** |
| 6.2 | Carregar materiais do tenant via `publicTenantService` | ✅ **FEITO 2026-05-25** |
| 6.3 | Configurador 3D com materiais e branding do tenant | ✅ **FEITO 2026-05-25** |
| 6.4 | Geração de orçamento persiste via `submitPublicQuote` | ✅ **FEITO 2026-05-25** |
| 6.5 | Tela de sucesso pós-orçamento com protocolo | ✅ **FEITO 2026-05-25** |
| 6.6 | RLS anon para tenants + materials + quotes (migration 002) | ✅ **FEITO 2026-05-25** |
| 6.7 | Notificação por email ao admin | ⏳ Fase Asaas (Edge Function) |
| 6.8 | Testar fluxo completo em localhost | ⏳ **AGUARDANDO VALIDAÇÃO** |

**URLs para testar (localhost:3001):**
- `http://localhost:3001/demo` → Configurador 3D original
- `http://localhost:3001/demo` → Alias do slug "demo" (mock tenant "Marmoraria Demo")
- `http://localhost:3001/marmoraria-silva` → Mock tenant "Marmoraria Silva"
- `http://localhost:3001/qualquer-slug` → Gera tenant genérico com o slug

**Branding dinâmico:** cada tenant tem sua própria `primary_color` aplicada nos botões, seleção de material e controles sem nenhuma mudança de código.

```
Ativar: @dev → @qa
Teste crítico: /verify do fluxo completo do cliente final
```

---

### Fase 7 — Deploy Production (Dias 22-23)
**Agente obrigatório:** `@devops (Gage)` — EXCLUSIVO para git push, Vercel, CI/CD
**Skills obrigatórias:** `/coderabbit-review` OBRIGATÓRIO antes do push para main

| # | Tarefa | Agente | Skill |
|---|--------|--------|-------|
| 7.1 | Review final de segurança (env vars, RLS, secrets) | `@qa` | `/security-review` |
| 7.2 | `coderabbit` review do branch completo | `@devops` | `/coderabbit-review` |
| 7.3 | Push para GitHub main | `@devops` | — |
| 7.4 | Configurar variáveis de ambiente no Vercel | `@devops` | — |
| 7.5 | Aplicar migrations no Supabase produção | `@devops` | — |
| 7.6 | Deploy Edge Function `gemini-proxy` com chave segura | `@devops` | — |
| 7.7 | Smoke test em produção — fluxo completo | `@qa` | `/verify` |
| 7.8 | Configurar domínio customizado no Vercel | `@devops` | — |

```
Ativar: @devops
Comando: *push → *deploy-vercel → *deploy-supabase
BLOQUEIO: @qa deve dar PASS antes de qualquer push para main
```

---

## 🗺️ Roadmap por Fases

### Fase 1 — MVP (Semanas 1-6)
**Meta:** Uma empresa se cadastra, configura seus materiais, e compartilha o configurador com clientes.

| Semana | Entregas | Agente Principal |
|--------|---------|-----------------|
| 1 | Setup GitHub + Vercel + Supabase + Auth completo | `@devops` + `@dev` |
| 2 | Converter as 4 telas HTML (FRONT END OBRIGATORIO) para React | `@ux-design-expert` |
| 3 | Schema Supabase + RLS + Services + Seed de materiais | `@data-engineer` |
| 4 | Dashboard funcional + CRUD de materiais e preços | `@dev` + `@qa` |
| 5 | Configurador público por tenant + sincronização 2D↔3D | `@dev` + `@ux-design-expert` |
| 6 | Testes + Deploy production + smoke test | `@qa` + `@devops` |

**Features MVP incluídas:**
- Grid 2D com medidas básicas + snap
- Tipos de peça: reta, em L
- Elementos: cuba, cooktop (já existem na demo)
- Orbit controls no 3D (girar, zoom, pan)
- Materiais realistas com textura
- Orçamento automático com cálculo de m² e acabamentos
- Tabela de preços configurável por tenant

### Fase 2 — Crescimento (Semanas 7-12)
**Agentes:** `@dev`, `@ux-design-expert`, `@data-engineer`, `@qa`

**Configurador Avançado:**
- Drag & resize interativo no 2D (arrastar pontos)
- Tipos em U e Ilha
- Bordas arredondadas no 3D (boleado, chanfro, meia-esquadria)
- Biblioteca de elementos: torneiras, tomadas pop-up, LED embutido
- Upload de textura customizada (pedras próprias do tenant)
- Iluminação profissional (sombra real + reflexo)
- PDF profissional com screenshot 3D + dados do cliente

**SaaS:**
- Sistema de planos (Free: 50 orçamentos/mês, Pro: ilimitado)
- Painel master admin (gerenciar todos os tenants)
- Branding personalizado por tenant (logo, cor primária)
- Link compartilhável para cliente interagir com o modelo
- WhatsApp share (enviar PDF + link direto)
- Dashboard com faturamento, conversão, materiais mais pedidos

### Fase 3 — Escala (Meses 4+)
**Agentes:** `@architect`, `@dev`, `@analyst`, `@devops`

**IA e Automação:**
- Orçamento por texto: "pia 2.5m granito preto com cuba" → gera configuração
- Sugestão inteligente de materiais via Gemini
- Upload de foto da cozinha → simular pedra no ambiente
- Automação n8n (WhatsApp ao aprovar, email marketing, follow-up)

**Expansão do Produto:**
- Integração com pagamento (Stripe ou Pagar.me)
- API pública para ERPs de marmorarias
- Armários e estrutura embaixo (nível planejados)
- Móveis integrados (competir com planejados)
- App mobile (React Native, mesmo design Obsidian)
- Multi-idioma (PT/EN/ES)

---

## 🧩 Funcionalidades do Produto — Configurador Completo

> Transformar o sistema de "simples orçamento" em um **configurador profissional nível premium** — tipo IKEA + marmoraria + SaaS.

---

### ✏️ Editor 2D — Melhorias (vista superior / medidas)

**Estado atual:** o usuário digita números em campos de input.
**Meta:** desenhar igual AutoCAD simplificado.

#### UX Interativo
| Feature | Descrição | Prioridade |
|---------|-----------|-----------|
| Drag & resize de pontos | Arrastar vértices para redimensionar a peça | MVP |
| Snap automático | Encaixe inteligente nas bordas e centros | MVP |
| Grid com escala real | Grade em cm/mm com referência visual | MVP |
| Zoom + pan | Navegar pelo canvas sem perder contexto | MVP |
| Undo / Redo | Ctrl+Z para desfazer qualquer ação | ALTA |

#### Inteligência Automática
| Feature | Descrição | Prioridade |
|---------|-----------|-----------|
| Sugestão de medidas padrão | Ex: profundidade bancada = 60cm sugerido automaticamente | MVP |
| Detecção de erros | Alerta se peça muito fina, corte impossível, dimensão inválida | MVP |
| Ajuste proporcional | Redimensionar mantendo proporção quando necessário | ALTA |
| Medidas automáticas | Mostrar área total (m²), perímetro e linha de corte destacada | MVP |

#### Tipos de Peça (game changer)
| Tipo | Descrição | Prioridade |
|------|-----------|-----------|
| Reta | Bancada simples (já existe) | PRONTO |
| Em L | Bancada em canto 90° | MVP |
| Em U | Bancada em três lados | ALTA |
| Ilha | Bancada central sem encosto | ALTA |
| Personalizada | Forma livre com pontos editáveis | Fase 2 |

#### Componentes Prontos (botões de inserção rápida)
```
[+ Cuba]  [+ Cooktop]  [+ Torneira]  [+ Tomada]  [+ LED]
```
- Cada componente entra com medidas padrão pré-configuradas
- Posiciona com drag na bancada
- Editável após inserção

---

### 🎮 Visualização 3D — Melhorias

**Estado atual:** 3D estático com rotação básica e materiais procedurais.
**Meta:** experiência de produto premium — cliente "vê" antes de comprar.

#### Interação e Câmera
| Feature | Descrição | Prioridade |
|---------|-----------|-----------|
| Orbit controls completo | Girar + zoom + pan com mouse/touch | MVP |
| Câmera orbital predefinida | Botões: frontal, lateral, topo, perspectiva | ALTA |
| Animação suave | Transição entre ângulos com easing | Fase 2 |
| Modo tela cheia | Expandir 3D para fullscreen | ALTA |

#### Materiais Realistas
| Feature | Descrição | Prioridade |
|---------|-----------|-----------|
| Biblioteca de pedras | Granito, Mármore, Quartzo, Ultra com texturas reais | MVP |
| Preview em tempo real | Trocar material → 3D atualiza instantaneamente | PRONTO |
| PBR textures | Roughness, metalness, normal maps para realismo | ALTA |
| Upload de textura custom | Tenant pode adicionar suas próprias pedras | Fase 2 |

#### Iluminação Profissional
| Feature | Descrição | Prioridade |
|---------|-----------|-----------|
| Sombra real | Shadow maps para profundidade | ALTA |
| Reflexo leve | Environment map para pedras polidas | ALTA |
| HDRI ambiente | Iluminação de ambiente realista | Fase 2 |
| Modo showroom | Fundo neutro com iluminação estúdio | Fase 2 |

#### Recortes Reais no 3D
| Feature | Descrição | Prioridade |
|---------|-----------|-----------|
| Cuba vazada (inox embutir) | Recorte geométrico preciso | PRONTO |
| Cuba sobrepor | Modelo 3D posicionado sobre a pedra | ALTA |
| Cuba esculpida | Escavação na própria pedra | Fase 2 |
| Cooktop embutido | Recorte + modelo do cooktop | PRONTO |
| Torneira na bancada | Modelo 3D posicionado | ALTA |
| Bordas arredondadas | Boleado, meia-esquadria, chanfro no 3D | ALTA |

#### Sincronização 2D ↔ 3D
- Mudança no 2D → atualiza 3D **instantaneamente**, sem reload
- Adicionar componente no 2D → aparece no 3D na posição correta
- Estado sincronizado via `configuratorStore` (Zustand)

---

### 🧰 Biblioteca de Elementos Configuráveis

> Cada elemento é um **componente independente** com modelo 3D, preço e propriedades editáveis.

#### 🚰 Hidráulica
| Elemento | Variações | Preço Referência |
|----------|-----------|-----------------|
| Cuba inox embutir | 1, 2 cubas; tamanhos P/M/G | Configurável |
| Cuba inox sobrepor | Redonda, quadrada, retangular | Configurável |
| Cuba esculpida na pedra | Formato livre | Configurável |
| Torneira simples | Mesa, parede | Configurável |
| Torneira gourmet | Pescoço ganso, monocomando | Configurável |
| Torneira touch/sensor | Sensação premium | Configurável |
| Cooktop 2 bocas | Embutido | Configurável |
| Cooktop 4 bocas | Embutido | Configurável |
| Cooktop 5 bocas | Embutido | Configurável |
| Dispenser / filtro | Torneira auxiliar | Configurável |

#### 🔌 Elétricos / Embutidos
| Elemento | Descrição | Prioridade |
|----------|-----------|-----------|
| Tomada pop-up | Embutida na bancada, abre ao pressionar | ALTA |
| USB / USB-C | Tomada com carregamento | ALTA |
| Carregador wireless | Placa embutida invisível | Fase 2 |
| LED embutido | Faixa de luz sob frontão | ALTA |
| LED RGB | Controlado por app/cor | Fase 2 |

#### 🧱 Acabamentos da Pedra
| Feature | Opções | Impacto no Preço |
|---------|--------|-----------------|
| Tipo de borda | Reta, boleada, meia-esquadria, chanfro | +% por metro linear |
| Espessura | 2cm, 3cm, 4cm | +% por cm extra |
| Polimento | Brilho, fosco, escovado | +% |
| Saia frontal | Com / sem, altura configurável | +por metro linear |
| Frontão traseiro | Com / sem, altura configurável | +por metro linear |
| Cascata lateral | Com / sem, altura configurável | +por metro linear |

#### 🧊 Estrutura / Móveis (nível avançado — Fase 2)
| Elemento | Descrição |
|----------|-----------|
| Armários embaixo | Módulos padrão (60cm) |
| Suportes metálicos | Para ilha flutuante |
| Tampo de mesa | Integrado à bancada |
| Rodapé | Com ou sem, altura configurável |

```typescript
// Estrutura de dados de um elemento
interface ConfiguratorElement {
  id: string
  type: 'cuba' | 'cooktop' | 'torneira' | 'tomada' | 'led' | 'borda'
  model: string        // path do modelo 3D
  position: { x: number; y: number }  // posição na bancada (cm)
  dimensions: { w: number; d: number }
  price: number        // preço do elemento (configurável por tenant)
  properties: Record<string, string | number>
}
```

---

### 💰 Orçamento Inteligente

#### Cálculo Automático
| Componente | Como calcula |
|------------|-------------|
| Área da pedra | m² = (largura × profundidade) ÷ 10.000 |
| Descontos por recorte | -m² de cuba, -m² de cooktop |
| Saia | metros lineares × preço/ML |
| Frontão | metros lineares × preço/ML |
| Cascata | metros lineares × preço/ML |
| Bordas | metros lineares por tipo × preço/ML |
| Elementos extras | custo unitário configurável |
| Desconto | % configurável |
| Frete / acréscimo | valor fixo configurável |

#### Tabela de Preços Dinâmica (por tenant)
- Cada marmoraria define seus preços no dashboard
- Preço por m² por material
- Preço por metro linear de cada acabamento
- Margem de lucro configurável (ex: +30% automático)
- Preço mínimo de serviço

#### PDF Profissional (Edge Function)
```
Conteúdo do PDF gerado:
├── Logo da empresa (tenant)
├── Dados do cliente
├── Screenshot do modelo 3D
├── Vista superior (2D) com medidas
├── Lista de materiais e elementos
├── Tabela de preços detalhada
│   ├── Pedra (m²)
│   ├── Acabamentos (m.l.)
│   ├── Elementos (torneira, cuba, etc.)
│   ├── Subtotal
│   ├── Desconto
│   └── TOTAL
└── Observações e prazo de validade
```

---

### 🤖 IA — Diferencial Competitivo

| Feature | Descrição | Fase |
|---------|-----------|------|
| Orçamento por texto | "pia 2.5m granito preto com cuba e cooktop 4 bocas" → gera configuração completa | Fase 2 |
| Sugestão de materiais | IA sugere pedras com base em estilo e orçamento do cliente | Fase 2 |
| Detecção de erros inteligente | Alerta sobre combinações impossíveis ou muito caras | Fase 2 |
| Upload de foto da cozinha | Simular a pedra na foto real do ambiente | Fase 3 |
| Medição por imagem | Extrair medidas de uma foto com IA | Fase 3 |

---

### 📊 Dashboard da Marmoraria (Multi-tenant)

| Widget | Dados exibidos |
|--------|---------------|
| Faturamento do mês | Total de orçamentos aprovados |
| Orçamentos do mês | Criados / Enviados / Aprovados / Rejeitados |
| Materiais mais pedidos | Ranking por pedra/categoria |
| Ticket médio | Valor médio por orçamento |
| Taxa de conversão | % aprovados / total criados |
| Últimos orçamentos | Feed em tempo real |

---

### 📱 Extras de Produto

| Feature | Descrição | Fase |
|---------|-----------|------|
| Link compartilhável | Cliente recebe link para ver e interagir com seu modelo | Fase 2 |
| WhatsApp share | Botão para enviar PDF + link direto pelo WhatsApp | Fase 2 |
| QR Code | Gerar QR do configurador para imprimir em catálogo | Fase 2 |
| Modo cliente | URL pública onde cliente final monta a peça sozinho | Fase 1 |
| Histórico de revisões | Versões salvas de um mesmo orçamento | Fase 2 |

---

### 🏆 Posicionamento do Produto

```
ANTES:  ferramenta simples de desenho com orçamento básico

DEPOIS: configurador profissional completo
        ├── Editor 2D tipo AutoCAD simplificado
        ├── 3D realista com materiais e elementos
        ├── Biblioteca de componentes (torneiras, cubas, cooktops...)
        ├── Orçamento automático com PDF profissional
        ├── Dashboard por marmoraria (multi-tenant)
        └── IA para agilizar configuração

RESULTADO: sistema completo de vendas para marmoraria
           (nível IKEA configurador + SaaS B2B)
```

---

### Mapa de Autoridade por Agente

| Agente | Persona | Autoridade Exclusiva neste Projeto |
|--------|---------|-----------------------------------|
| `@pm (Morgan)` | Product Manager | Criar épicos, definir roadmap, priorização |
| `@architect (Aria)` | Arquiteta | Validar arquitetura multi-tenant, aprovar estrutura de pastas |
| `@data-engineer (Dara)` | Engenheira de Dados | Schema Supabase, migrations, RLS — ninguém mais mexe no DB |
| `@ux-design-expert (Uma)` | UX Expert | Converter HTML→React, componentização, fidelidade ao design |
| `@sm (River)` | Scrum Master | Criar stories para cada fase — não implementa código |
| `@po (Pax)` | Product Owner | Validar stories antes de qualquer implementação |
| `@dev (Dex)` | Developer | Implementar features, migrar App.tsx, stores Zustand |
| `@qa (Quinn)` | QA Engineer | Quality gates obrigatórios, segurança RLS, testes |
| `@devops (Gage)` | DevOps | git push, Vercel, CI/CD — ÚNICO que pode fazer deploy |

### Mapa de Skills Obrigatórias por Contexto

| Situação | Skill Obrigatória | Por quê |
|----------|------------------|---------|
| Antes de criar qualquer estrutura nova | `/architect-first` | Garante design antes de código |
| Antes de qualquer PR para main | `/coderabbit-review` | Review automatizado de qualidade |
| Após implementar uma feature | `/verify` | Confirma que funciona na prática |
| Após refatoração ou simplificação | `/simplify` | Remove código desnecessário |
| Antes do deploy final | `/security-review` | Audita secrets, RLS, auth |
| Pesquisa de best practices | `/tech-search` | Supabase RLS multi-tenant, padrões React |
| Criação de Edge Functions / integração Gemini | `/mcp-builder` | Padrão para integrações externas |

### Regras de Bloqueio (NUNCA pular)

```
REGRA 1: @architect DEVE aprovar estrutura → antes de @dev criar pastas
REGRA 2: @po DEVE validar story → antes de @dev implementar qualquer feature
REGRA 3: @qa DEVE dar PASS → antes de @devops fazer push para main
REGRA 4: @data-engineer EXCLUSIVO → nenhum outro agente cria migrations ou altera RLS
REGRA 5: @devops EXCLUSIVO → nenhum outro agente faz git push ou configura Vercel
REGRA 6: @ux-design-expert EXCLUSIVO → conversão de HTML→React do FRONT END OBRIGATORIO
```

### Sequência de Ativação — Do Zero ao Deploy

```
SEMANA 1
  @pm *create-epic marmu-saas-mvp
  @architect *task validate-architecture
  @devops *task setup-github-repo

SEMANA 2
  @data-engineer *task create-supabase-schema
  @sm *create-story "auth-system"
  @po *validate-story
  @dev *task implement-auth
  @qa *task qa-gate "auth"

SEMANA 3
  @sm *create-story "frontend-conversion"
  @po *validate-story
  @ux-design-expert *task convert-html-to-react
  @dev *task integrate-3d-with-supabase
  @qa *verify

SEMANA 4-5
  @sm *create-story "dashboard-features"
  @dev *task implement-dashboard
  @qa *qa-gate "dashboard"
  @devops *push

SEMANA 6
  @qa /security-review
  @devops *deploy-production
  @qa /verify (smoke test em produção)
```

**Comando para iniciar agora:**
```
@pm *create-epic marmu-saas-mvp
```

---

## ⚠️ Pontos de Atenção

### Segurança
- `GEMINI_API_KEY` nunca deve ir para o frontend — criar Edge Function proxy
- `.env` atual tem valores reais — não commitar, criar `.env.example` limpo
- Arquivos `*.Zone.Identifier` e ZIPs na raiz — adicionar ao `.gitignore`
- Todos os dados do banco protegidos por RLS (isolamento por tenant_id)

### Migração do App.tsx
- ~70 linhas de useState → migrar para `configuratorStore.ts` (Zustand)
- `ThreeView`, `Editor2D`, `BancadaModel`, `EscadaModel` → mover para `src/components/3d/`
- `BudgetInvoice` → mover para `src/components/invoice/`
- `STONE_MATERIALS` constante → virar tabela `materials` no Supabase por tenant
- `ClientQuote` state → virar form de criação de quote persistido no banco

### Design System (não alterar)
- As 4 telas do FRONT END OBRIGATORIO já usam o design Obsidian correto
- TailwindCSS config (cores) está nas telas HTML — centralizar em `tailwind.config.ts`
- Fontes Geist + Material Symbols via Google Fonts (já funciona, manter)
- Paleta de cores: violet `#a78bfa` (primary), emerald `#34d399` (tertiary), background `#09090b`

### Performance 3D
- Three.js é pesado — usar `React.lazy()` + `Suspense` para carregar o editor
- Rota pública `/:tenant-slug` não deve carregar Three.js até usuário interagir

---

## 🧪 Qualidade de Software (Profissional)

### Estratégia de Testes
| Camada | Ferramenta | Cobertura mínima |
|--------|-----------|-----------------|
| Unit tests | Vitest | Lógica de cálculo de orçamento, utilitários |
| Component tests | Vitest + Testing Library | Componentes UI críticos (form de auth, invoice) |
| Integration tests | Vitest | Services Supabase (materiais, quotes, auth) |
| E2E tests | Playwright | Fluxo completo: login → configurar → orçamento → PDF |
| Visual regression | Playwright screenshots | Telas do configurador após mudanças |

**Rotas E2E obrigatórias a cobrir:**
```
✓ /login → dashboard (fluxo feliz)
✓ /register → cria tenant → dashboard
✓ /dashboard/materials → CRUD completo
✓ /:slug → configurar bancada → gerar orçamento
✓ Isolamento: tenant A não acessa dados do tenant B
✓ RLS: query direta ao Supabase retorna 0 rows para usuário errado
```

### CI/CD — GitHub Actions
```yaml
# .github/workflows/ci.yml (executado em todo PR)
jobs:
  lint:       tsc --noEmit + eslint
  unit:       vitest run --coverage (mín. 80%)
  e2e:        playwright test (ambiente preview Vercel)
  security:   CodeRabbit review automático
  deploy:     Vercel preview automático por PR
```

**Branch protection rules (main):**
- Require PR review (mínimo 1 aprovação)
- Require CI passing (lint + unit + e2e)
- No force push
- Deploy automático somente após todos os checks verdes

### Monitoramento de Erros — Sentry
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react'
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% das transações
  environment: import.meta.env.MODE
})
```
- Alertas automáticos em erros novos
- Stack trace completo com contexto do usuário
- Performance traces para o editor 3D (frames lentos)
- Integração com Slack/email para notificações

### Analytics de Produto — PostHog (self-hosted ou cloud)
| Evento rastreado | Por que importa |
|-----------------|----------------|
| `configurator_started` | Quantos clientes chegam ao configurador |
| `material_selected` | Quais pedras são mais populares |
| `element_added` (cuba, cooktop...) | Features mais usadas |
| `quote_generated` | Taxa de conversão principal |
| `quote_pdf_downloaded` | Engajamento final |
| `tenant_registered` | Crescimento de base |
| `plan_upgraded` | Conversão free → pago |

---

## 🔒 Segurança Avançada

### Rate Limiting
```typescript
// Supabase Edge Function — limites por IP/user
const limits = {
  '/api/quotes':    { requests: 100, window: '1h' },  // anti-spam
  '/api/pdf':       { requests: 20,  window: '1h' },  // PDF é pesado
  '/auth/register': { requests: 5,   window: '1h' },  // anti-bot
  '/auth/login':    { requests: 10,  window: '15m' }  // brute force
}
```

### Audit Logs
```sql
-- Tabela de auditoria (imutável)
audit_logs (
  id uuid PRIMARY KEY,
  tenant_id uuid,
  user_id uuid,
  action text,        -- 'quote.created', 'material.deleted', 'user.invited'
  resource_type text,
  resource_id uuid,
  before_state jsonb, -- estado anterior
  after_state jsonb,  -- estado após
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
)
-- Nunca deletar, nunca atualizar — somente INSERT
```

### Proteções Obrigatórias
| Proteção | Implementação |
|----------|--------------|
| SQL Injection | Supabase parameterized queries (automático) |
| XSS | React escaping (automático) + Content-Security-Policy header |
| CSRF | Supabase JWT stateless (não usa cookies de sessão) |
| Secrets no frontend | Apenas `VITE_SUPABASE_ANON_KEY` (chave pública) |
| Gemini API | Somente em Edge Function — nunca exposta no cliente |
| CORS | Configurado no Supabase para domínio Vercel somente |
| Tenant isolation | RLS em 100% das tabelas — testado nos E2E |

### LGPD — Lei Geral de Proteção de Dados (Brasil)
| Requisito | Implementação |
|-----------|--------------|
| Consentimento | Banner de cookies na primeira visita |
| Política de Privacidade | Página `/privacidade` obrigatória |
| Termos de Uso | Página `/termos` obrigatória + aceite no cadastro |
| Direito ao esquecimento | Botão "Deletar minha conta" no painel do usuário |
| Portabilidade | Export dos dados em JSON/CSV |
| DPO (encarregado) | Email de contato para dados pessoais |
| Retenção de dados | Definir política: quotes deletados após X anos |

---

## ⚡ Performance & Infraestrutura

### Core Web Vitals (metas)
| Métrica | Meta | Estratégia |
|---------|------|-----------|
| LCP (maior conteúdo) | < 2.5s | SSG da landing, lazy load do 3D |
| FID (interatividade) | < 100ms | Code splitting, sem bloqueio de render |
| CLS (estabilidade visual) | < 0.1 | Skeleton loaders, dimensões fixas de imagens |
| TTFB | < 200ms | CDN Vercel Edge Network |

### Estratégia de Cache
| O que | Cache onde | TTL |
|-------|-----------|-----|
| Assets 3D (texturas) | Vercel CDN | 1 ano (hash no nome) |
| Materiais do tenant | Supabase + React Query | 5 min (stale-while-revalidate) |
| Configurações do tenant | sessionStorage | Sessão |
| Modelo 3D JS bundle | Vercel CDN | 1 semana |
| Fonts Geist | Google Fonts CDN | 1 ano |

### Lazy Loading estratégico
```typescript
// O editor 3D é carregado somente quando necessário
const ThreeView = React.lazy(() => import('./components/3d/ThreeView'))
const BudgetInvoice = React.lazy(() => import('./components/invoice/BudgetInvoice'))

// Rota pública: carrega Three.js só após interação
<Suspense fallback={<ConfiguratorSkeleton />}>
  <ThreeView ... />
</Suspense>
```

### Backup e Recuperação
| Item | Estratégia |
|------|-----------|
| Banco Supabase | Backup diário automático (7 dias gratuito, 30 dias Pro) |
| Migrations | Versionadas no Git — recriação total possível |
| Storage (logos, assets) | Supabase Storage com redundância |
| Código | GitHub — fonte única de verdade |
| Variáveis de ambiente | Documentadas no `.env.example` + Vercel dashboard |

---

## 📧 Sistema de Comunicação

### Emails Transacionais (Resend ou Supabase Emails)
| Trigger | Email enviado |
|---------|--------------|
| Novo cadastro | Boas-vindas + link de verificação |
| Esqueci senha | Link de reset (expira em 1h) |
| Novo usuário convidado | Convite com link de ativação |
| Orçamento gerado | Notificação ao admin do tenant |
| Plano prestes a expirar | Aviso 7 dias antes |
| Trial terminando | Aviso 3 dias antes |
| Pagamento recebido | Confirmação de cobrança |

### Notificações In-App
```typescript
// Sistema de notificações em tempo real via Supabase Realtime
notifications (
  id, tenant_id, user_id,
  type: 'quote_new' | 'user_invited' | 'plan_expiring' | 'system',
  title, message, read boolean, created_at
)
```
- Badge no sino da sidebar com contagem de não lidas
- Click leva para o recurso relacionado
- Marcar todas como lidas

---

## 🏢 White Label & Embed

### White Label Completo (plano Enterprise)
| Feature | Descrição |
|---------|-----------|
| Domínio customizado | `configurador.marmorariaxyz.com.br` apontando para o SaaS |
| Logo própria | Upload da logo — aparece no configurador e no PDF |
| Cor primária | Substituir violet `#a78bfa` pela cor da marca do tenant |
| Nome do produto | "Configurador da Marmoraria Silva" ao invés de "Marmu" |
| Email sender | Emails enviados com domínio do tenant |
| Sem "Powered by Marmu" | Remove branding no plano Enterprise |

### Widget Embeddable
```html
<!-- Tenant cola isso no site deles -->
<script src="https://app.marmu.com.br/embed.js"></script>
<marmu-configurator tenant="marmoraria-silva" theme="light" />
```
- Iframe isolado com configurador completo
- Comunica resultado via `postMessage`
- Responsivo (funciona em mobile)
- Sem necessidade de login do cliente final

---

## 👤 Portal do Cliente Final

> O cliente da marmoraria (não o admin) tem acesso a uma área leve para acompanhar seu pedido.

| Feature | Descrição |
|---------|-----------|
| Link único do orçamento | URL `/orcamento/{uuid}` — sem login necessário |
| Visualizar configuração | Ver o modelo 3D e os detalhes do orçamento |
| Aprovar / Recusar | Botão de aprovação digital (substitui assinatura física) |
| Solicitar alteração | Campo de observações + notificação ao admin |
| Assinar digitalmente | Aceite com nome + CPF + timestamp (validade jurídica básica) |
| Histórico de versões | Ver revisões anteriores do orçamento |
| Download do PDF | A qualquer momento |

---

## 🗂️ CRM Leve — Gestão de Clientes

| Feature | Descrição |
|---------|-----------|
| Cadastro de clientes | Nome, telefone, email, endereço, CPF opcional |
| Histórico completo | Todos os orçamentos de um cliente em um lugar |
| Tags | Organizar clientes (ex: "VIP", "lead", "aguardando") |
| Busca global | Pesquisar clientes, orçamentos e materiais de uma vez |
| Exportar CSV | Lista completa de clientes para uso externo |
| Importar CSV | Migrar base de clientes existente |
| Funil simples | Lead → Proposta → Aprovado → Em execução → Concluído |

---

## 📦 Gestão de Estoque (diferencial)

| Feature | Descrição |
|---------|-----------|
| Cadastro de chapas | Registrar chapas disponíveis (dimensão, quantidade) |
| Vincular ao orçamento | "Esta peça usa a chapa #42 do estoque" |
| Alerta de estoque baixo | Notificar quando material está acabando |
| Fornecedores | Cadastrar fornecedores com contato e prazo |
| Custo real vs. preço venda | Controle de margem por material |

---

## 🔗 Integrações

### Webhooks (para integrações externas)
```typescript
// Tenant pode configurar webhook para receber eventos
webhook_endpoints (
  id, tenant_id,
  url: 'https://erp-da-marmoraria.com/webhook',
  events: ['quote.approved', 'quote.created', 'client.created'],
  secret: string  // HMAC para validar autenticidade
)
```
**Eventos disponíveis:**
- `quote.created` — novo orçamento criado
- `quote.approved` — cliente aprovou
- `quote.rejected` — cliente recusou
- `client.created` — novo cliente cadastrado
- `payment.received` — pagamento confirmado

### Integrações Nativas (Fase 2-3)
| Integração | O que faz |
|-----------|-----------|
| WhatsApp Business API | Enviar orçamento automaticamente via WhatsApp |
| n8n | Automações customizadas (follow-up, CRM externo) |
| Google Sheets | Exportar orçamentos para planilha automaticamente |
| Stripe | Cobrar assinatura + receber sinal dos clientes |
| Pagar.me | Alternativa brasileira ao Stripe |
| Conta Azul / Omie | Emitir nota fiscal ao aprovar orçamento |

---

## 🛠️ Ferramentas de Produtividade (Power User)

### Atalhos de Teclado no Configurador
| Atalho | Ação |
|--------|------|
| `Ctrl+Z` / `Cmd+Z` | Desfazer última ação |
| `Ctrl+Y` | Refazer |
| `Ctrl+D` | Duplicar elemento selecionado |
| `Delete` | Remover elemento selecionado |
| `Ctrl+S` | Salvar configuração atual |
| `Ctrl+P` | Abrir preview do PDF |
| `F` | Focar câmera no objeto |
| `1/2/3` | Alternar vista: perspectiva / topo / frente |

### Templates de Configuração
```
Salvar configuração atual como template:
├── "Bancada padrão cozinha" (180×60, c/ cuba + cooktop)
├── "Banheiro compacto" (90×45, s/ cooktop)
├── "Ilha gourmet" (200×100, 2 cubas)
└── Templates do tenant (customizados)
```
- Reutilizar em novos orçamentos com 1 clique
- Compartilhar templates entre operadores do mesmo tenant

### Importação em Massa
| O que | Formato | Para quê |
|-------|---------|----------|
| Materiais | CSV | Migrar catálogo de outro sistema |
| Clientes | CSV | Importar base existente |
| Preços | CSV / Excel | Atualizar tabela de preços em lote |

---

## 📋 Onboarding do Novo Tenant

> Primeiro acesso após cadastro — guia o admin a configurar tudo antes de usar.

```
Passo 1: Dados da empresa (nome, logo, slug público)
Passo 2: Configurar pelo menos 5 materiais com preços
Passo 3: Testar o configurador público
Passo 4: Convidar primeiro operador (opcional)
Passo 5: Copiar link do configurador (pronto para compartilhar!)
```
- Barra de progresso no topo do dashboard
- Cada passo tem link direto para a configuração
- Checklist some ao completar todos os passos
- Email de onboarding com tutorial em vídeo

---

## 📜 Páginas Legais & Institucionais

| Página | Conteúdo | Obrigatória |
|--------|---------|------------|
| `/termos` | Termos de Uso do SaaS | SIM (LGPD) |
| `/privacidade` | Política de Privacidade | SIM (LGPD) |
| `/cookies` | Política de Cookies | SIM (LGPD) |
| `/precos` | Planos e preços públicos | RECOMENDADA |
| `/status` | Status dos serviços (uptime) | RECOMENDADA |
| `/changelog` | Histórico de atualizações | RECOMENDADA |
| `/ajuda` | Central de ajuda / FAQ | RECOMENDADA |

---

## 📊 Operações SaaS (Business Metrics)

### Usage Metering por Tenant
```sql
-- Rastrear uso para limites do plano
usage_metrics (
  id, tenant_id, month,
  quotes_created int,
  pdf_generated int,
  storage_mb numeric,
  active_users int
)
-- Verificar antes de criar novo recurso: está dentro do plano?
```

### Billing Portal (self-service)
- Ver plano atual e data de renovação
- Histórico de faturas (download PDF)
- Trocar plano (upgrade/downgrade)
- Cancelar assinatura (com pesquisa de motivo)
- Atualizar dados de pagamento

### Admin Master — Painel Marmu
| Feature | Descrição |
|---------|-----------|
| Lista de todos os tenants | Status, plano, data de cadastro, uso |
| Impersonar tenant | Logar como admin de qualquer tenant (debug) |
| Suspender conta | Bloquear acesso sem deletar dados |
| MRR em tempo real | Monthly Recurring Revenue do SaaS |
| Churn analysis | Tenants que cancelaram — motivos |
| Uso por feature | Quais features são mais usadas no produto |

---

## ♿ Acessibilidade — WCAG 2.1 AA

| Requisito | Implementação |
|-----------|--------------|
| Contraste mínimo | 4.5:1 para texto normal (design Obsidian já atende) |
| Navegação por teclado | Todos os elementos interativos focáveis com Tab |
| Screen readers | Atributos `aria-label`, `role`, `aria-live` corretos |
| Zoom 200% | Layout não quebra com zoom do browser |
| Foco visível | Ring de foco violet `#a78bfa` em todos os inputs |
| Alt text | Todas as imagens com descrição |
| Mensagens de erro | Não somente por cor — ícone + texto |

---

## 🚦 Status Page & Observabilidade

### Status Page (BetterUptime ou similar)
- `status.marmu.com.br` — página pública de uptime
- Monitoramento a cada 1 minuto
- Alertas automáticos em queda
- Histórico de incidentes

### Logs Estruturados
```typescript
// Cada operação crítica loga com contexto
logger.info('quote.generated', {
  tenant_id, user_id, quote_id,
  total_value, material_id,
  duration_ms: Date.now() - start
})
```
- Logs indexados no Supabase ou serviço externo (Logtail, Axiom)
- Alertas em erros acima de threshold
- Dashboard de saúde da aplicação

---

## 🎨 Design System Completo

### Componentes faltantes (além dos básicos)
| Componente | Onde usar |
|-----------|-----------|
| `<DataTable>` | Listagem de materiais, orçamentos, clientes |
| `<EmptyState>` | Tela vazia de cada seção (primeiro uso) |
| `<Skeleton>` | Placeholder de loading para todos os dados |
| `<Toast>` | Feedback de ações (salvo, erro, copiado) |
| `<ConfirmDialog>` | Confirmação antes de deletar |
| `<CommandPalette>` | Ctrl+K — busca global rápida |
| `<Stepper>` | Fluxo de onboarding e wizard de configuração |
| `<Tooltip>` | Ajuda contextual em cada campo |
| `<FileUpload>` | Upload de logo do tenant e texturas |
| `<ColorPicker>` | Personalização de cor do tema do tenant |

### Print Styles
```css
/* CSS para impressão do orçamento */
@media print {
  .sidebar, .header, .no-print { display: none; }
  .invoice { width: 100%; font-size: 12pt; }
  .three-view { page-break-before: avoid; }
}
```

---

## 👑 Painel Master — Controle Total dos Tenants

> Acesso exclusivo para **você (Marmu)**. Rota protegida por role `master` — nenhum tenant consegue acessar.

**URL:** `/master` → protegida por `role = 'master'` no Supabase

### Visão Geral do Painel Master

```
/master
├── /master/dashboard       → métricas globais do SaaS
├── /master/tenants         → lista e gestão de todas as empresas
├── /master/tenants/:id     → detalhes de um tenant específico
├── /master/planos          → criar e editar planos de assinatura
├── /master/cobrancas       → histórico de cobranças (Asaas)
├── /master/impersonate     → logar como qualquer tenant (debug)
└── /master/configuracoes   → configurações globais do sistema
```

---

### 📊 Dashboard Master — Métricas do SaaS

| Métrica | Descrição |
|---------|-----------|
| MRR (Monthly Recurring Revenue) | Receita recorrente mensal em tempo real |
| ARR | Receita anual projetada |
| Total de tenants ativos | Com status de plano |
| Novos tenants (últimos 30 dias) | Crescimento da base |
| Churn do mês | Cancelamentos + motivo |
| Orçamentos gerados (todos os tenants) | Volume de uso do sistema |
| Inadimplentes | Tenants com pagamento atrasado |
| Plano mais popular | Distribuição por plano |

```
┌─────────────────────────────────────────────────────────┐
│  MRR: R$ 12.400     ARR: R$ 148.800     Tenants: 87     │
│  Novos mês: +12     Churn: 2            Inadimp.: 3      │
├──────────────────────┬──────────────────────────────────┤
│  Orçamentos/mês: 1.847  │  PDF gerados: 423             │
│  Materiais ativos: 2.1k │  Usuários totais: 214         │
└──────────────────────┴──────────────────────────────────┘
```

---

### 🏢 Gestão de Tenants (lista completa)

#### Listagem com filtros
| Coluna | Descrição |
|--------|-----------|
| Empresa | Nome + logo |
| Slug | URL pública do configurador |
| Plano | Free / Pro / Enterprise + badge |
| Status | Ativo / Suspenso / Trial / Inadimplente |
| Usuários | Quantos usuários ativos |
| Orçamentos | Total gerado (mês atual) |
| Criado em | Data de cadastro |
| Próxima cobrança | Data + valor |
| Ações | Ver / Impersonate / Suspender / Deletar |

**Filtros disponíveis:**
- Por plano (Free, Pro, Enterprise)
- Por status (ativo, suspenso, trial, inadimplente)
- Por data de cadastro
- Busca por nome ou slug

---

### 🔍 Detalhes de um Tenant (`/master/tenants/:id`)

```
Aba: Visão Geral
├── Dados da empresa (nome, slug, logo, cor)
├── Plano atual + data de renovação
├── Status da assinatura (Asaas)
├── Histórico de cobranças
└── Botões: Upgrade plano | Suspender | Deletar conta

Aba: Usuários
├── Lista de todos os usuários do tenant
├── Role (admin, operator)
├── Último acesso
└── Botão: Revogar acesso

Aba: Uso
├── Orçamentos gerados (por mês — gráfico)
├── PDFs gerados
├── Materiais cadastrados
├── Armazenamento usado (MB)
└── Comparação com limite do plano

Aba: Materiais
├── Todos os materiais cadastrados pelo tenant
└── (somente leitura para o master)

Aba: Orçamentos
├── Últimos 50 orçamentos do tenant
└── (somente leitura para o master)
```

---

### 🎭 Impersonate — Logar como Qualquer Tenant

> Funcionalidade crítica para suporte e debug sem precisar da senha do cliente.

```typescript
// Fluxo de impersonation seguro
async function impersonateTenant(tenantId: string) {
  // 1. Verificar se usuário atual é master
  // 2. Gerar token temporário de impersonation (expira em 1h)
  // 3. Armazenar { originalUserId, impersonating: true } no sessionStorage
  // 4. Redirecionar para /dashboard com contexto do tenant
  // 5. Banner vermelho: "Você está visualizando como: [Empresa X] — Sair"
}
```

**Regras de segurança:**
- Token de impersonation expira em 1 hora
- Todas as ações feitas durante impersonation ficam no audit log com flag `impersonated: true`
- Banner vermelho permanente durante impersonation
- Botão "Sair da impersonation" sempre visível
- Impersonation não permite alterar senha do tenant

---

### 🏷️ Gestão de Planos

| Campo | Descrição |
|-------|-----------|
| Nome | "Free", "Pro", "Enterprise" |
| Preço mensal | R$ configurável |
| Preço anual | R$ com desconto configurável |
| Máx. usuários | Limite de operadores |
| Máx. orçamentos/mês | Limite mensal |
| Máx. materiais | Limite de materiais cadastrados |
| PDF profissional | Sim/Não |
| White label | Sim/Não |
| Domínio customizado | Sim/Não |
| API access | Sim/Não |
| Suporte prioritário | Sim/Não |

---

### ⚙️ Configurações Globais do Sistema

| Configuração | Descrição |
|-------------|-----------|
| Trial padrão | Dias de trial gratuito para novos cadastros |
| Email de suporte | Endereço exibido no rodapé |
| Manutenção programada | Exibir banner de aviso para todos os tenants |
| Materiais padrão | Catálogo base que todo tenant recebe no cadastro |
| Versão do sistema | Controle de versão exibido |
| Feature flags | Ativar/desativar features por plano ou tenant específico |

---

## 💳 Integração Asaas — Cobranças e Assinaturas

> **Asaas** é a plataforma brasileira de pagamentos escolhida para gerenciar assinaturas dos tenants. Alternativa nacional ao Stripe, com suporte a PIX, boleto e cartão.

**Documentação:** https://docs.asaas.com/

### Por que Asaas?
| Critério | Asaas |
|---------|-------|
| PIX | Sim (nativo) |
| Boleto | Sim |
| Cartão de crédito | Sim (parcelamento) |
| Recorrência (assinaturas) | Sim (nativo) |
| Split de pagamento | Sim |
| API REST | Sim, bem documentada |
| Sandbox para testes | Sim |
| Nota fiscal (NFS-e) | Sim (em cidades suportadas) |
| Custo | Taxa por transação (sem mensalidade) |

---

### 🏗️ Arquitetura da Integração

```
Marmu SaaS ←→ Asaas API (Edge Function proxy)
              ↕
          Webhook Asaas → atualiza status no Supabase
```

**Variáveis de ambiente:**
```bash
ASAAS_API_KEY=           # chave da conta Asaas (somente em Edge Function)
ASAAS_WEBHOOK_TOKEN=     # token para validar webhooks recebidos
ASAAS_ENVIRONMENT=       # "sandbox" ou "production"
```

---

### 📦 Schema — Tabelas de Cobrança

```sql
-- Cliente no Asaas (criado quando tenant se cadastra)
asaas_customers (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants UNIQUE,
  asaas_customer_id text UNIQUE,  -- "cus_xxxxx" do Asaas
  created_at timestamptz
)

-- Assinaturas ativas
asaas_subscriptions (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants,
  asaas_subscription_id text UNIQUE,  -- "sub_xxxxx"
  plan_id uuid REFERENCES plans,
  billing_type text,   -- 'CREDIT_CARD' | 'BOLETO' | 'PIX'
  status text,         -- 'ACTIVE' | 'OVERDUE' | 'INACTIVE' | 'TRIAL'
  value numeric,
  next_due_date date,
  created_at timestamptz
)

-- Cobranças individuais (invoices)
asaas_payments (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants,
  asaas_payment_id text UNIQUE,  -- "pay_xxxxx"
  subscription_id uuid REFERENCES asaas_subscriptions,
  value numeric,
  net_value numeric,   -- valor após taxa Asaas
  status text,         -- 'PENDING' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED'
  billing_type text,
  due_date date,
  payment_date date,
  invoice_url text,    -- link do boleto/PIX
  bank_slip_url text,
  created_at timestamptz
)

-- Eventos recebidos via webhook
asaas_webhook_events (
  id uuid PRIMARY KEY,
  event text,          -- 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE'...
  payload jsonb,       -- payload completo do Asaas
  processed boolean DEFAULT false,
  created_at timestamptz
)
```

---

### 🔄 Fluxos de Cobrança

#### Fluxo 1 — Novo Tenant se Cadastra
```
1. Tenant preenche /register
2. Supabase cria profile + tenant (plano Free ou Trial)
3. Edge Function cria cliente no Asaas:
   POST /api/v3/customers { name, email, cpfCnpj }
4. Salva asaas_customer_id no banco
5. Se escolheu plano pago: redireciona para /checkout
```

#### Fluxo 2 — Checkout (Escolha de Plano)
```
1. Tenant acessa /dashboard/planos → clica "Assinar Pro"
2. Edge Function cria assinatura no Asaas:
   POST /api/v3/subscriptions {
     customer: asaas_customer_id,
     billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD',
     value: 97.00,
     nextDueDate: hoje + 7 dias (trial)
   }
3. Asaas retorna subscription_id + link de pagamento
4. Redirecionar para link de pagamento do Asaas
5. Webhook confirma pagamento → ativa plano
```

#### Fluxo 3 — Webhook do Asaas (atualiza status em tempo real)
```typescript
// Supabase Edge Function: POST /functions/v1/asaas-webhook
async function handleAsaasWebhook(event: AsaasEvent) {
  // Validar token do webhook
  if (req.headers['asaas-access-token'] !== ASAAS_WEBHOOK_TOKEN) return 401

  switch (event.event) {
    case 'PAYMENT_RECEIVED':
      // Ativar/manter plano ativo
      await activateTenantPlan(event.payment.subscriptionId)
      break

    case 'PAYMENT_OVERDUE':
      // Marcar tenant como inadimplente (não bloquear ainda — dar 3 dias)
      await markTenantOverdue(event.payment.subscriptionId)
      // Enviar email de aviso ao tenant
      break

    case 'PAYMENT_DELETED':
    case 'SUBSCRIPTION_INACTIVATED':
      // Suspender acesso após período de graça
      await suspendTenantAfterGracePeriod(event.subscription.id)
      break
  }
}
```

#### Fluxo 4 — Inadimplência (gestão automática)
```
Dia 0:  Cobrança vence → status OVERDUE no Asaas
Dia 1:  Email automático "Seu pagamento está em atraso"
Dia 3:  2º email + banner de aviso no dashboard do tenant
Dia 7:  Acesso suspenso (somente leitura — não cria orçamentos)
Dia 30: Conta arquivada (dados mantidos por 90 dias)
Dia 90: Deleção definitiva (aviso 15 dias antes)
```

---

### 💰 Métodos de Pagamento Suportados

| Método | Configuração | Fluxo |
|--------|-------------|-------|
| PIX | Instantâneo | QR Code gerado pelo Asaas |
| Boleto | Vence em 3 dias úteis | Link do boleto enviado por email |
| Cartão de crédito | Recorrente automático | Tokenização pelo Asaas |
| Parcelamento | 2-12x (configurável) | Disponível para plano anual |

---

### 📋 Telas de Cobrança no SaaS

#### Para o Tenant (dentro do dashboard)
```
/dashboard/cobrancas
├── Plano atual + status
├── Próxima cobrança (data + valor)
├── Método de pagamento (trocar)
├── Histórico de faturas (últimas 12)
│   └── Cada linha: data, valor, status, botão "2ª via"
├── Botão: Fazer upgrade de plano
└── Botão: Cancelar assinatura (com pesquisa de motivo)
```

#### Para o Master (dentro do `/master`)
```
/master/cobrancas
├── Todas as cobranças (todos os tenants)
├── Filtros: status, método, plano, período
├── Total recebido no mês (líquido após taxas Asaas)
├── Total inadimplente
├── Ações: Reenviar cobrança | Gerar 2ª via | Estornar
└── Export CSV para contabilidade
```

---

### 🔑 Edge Functions Necessárias (Asaas)

| Função | Trigger | O que faz |
|--------|---------|-----------|
| `asaas-create-customer` | Novo cadastro | Cria cliente no Asaas |
| `asaas-create-subscription` | Tenant assina plano | Cria assinatura + retorna link |
| `asaas-webhook` | POST do Asaas | Processa eventos (pagamento, inadimplência) |
| `asaas-get-invoice` | Tenant pede 2ª via | Busca link atualizado da cobrança |
| `asaas-cancel-subscription` | Tenant cancela | Inativa assinatura no Asaas |
| `asaas-change-plan` | Upgrade/downgrade | Atualiza valor da assinatura |

---

### 🧪 Testes de Integração Asaas

**Ambiente Sandbox:** `https://sandbox.asaas.com`
- Usar CPF `000.000.000-00` para testes
- Cartão de teste: `4111111111111111`
- PIX em sandbox confirma automaticamente em 1 min

**Testes obrigatórios (E2E):**
```
✓ Criar tenant → cliente criado no Asaas sandbox
✓ Assinar plano → assinatura criada + link de pagamento gerado
✓ Webhook PAYMENT_RECEIVED → plano ativado no Supabase
✓ Webhook PAYMENT_OVERDUE → tenant marcado como inadimplente
✓ Cancelar → assinatura inativada + email enviado
✓ Upgrade Pro → Enterprise → valor atualizado no Asaas
```

**Agente responsável:** `@data-engineer` (schema) + `@dev` (Edge Functions) + `@qa` (testes E2E Asaas)

---

---

## 🖥️ Regra Obrigatória — Localhost Primeiro

> **NENHUMA feature vai para GitHub/Vercel/Supabase produção sem validação local aprovada pelo dono do produto.**

### Princípio

Todo desenvolvimento segue o ciclo:

```
Implementar → Rodar localhost → Validação humana → Aprovado → Deploy
                    ↑                    ↓
                    └──── Não aprovado ──┘
                          (ajustar e repetir)
```

---

### Ambiente Local Obrigatório

#### Portas padrão de desenvolvimento
```bash
Frontend (Vite):      http://localhost:3001   (porta 3000 ocupada, Vite usa 3001)
Supabase local:       http://localhost:54321  (supabase start)
Supabase Studio:      http://localhost:54323  (painel visual do banco)
Edge Functions:       http://localhost:54321/functions/v1/
```

#### Rotas disponíveis (localhost:3001)
```
/login                 → Tela de login (modo local: usar e-mail master)
/register              → Cadastro de conta
/forgot-password       → Recuperação de senha
/demo                  → Configurador 3D demo público (versão original)

/dashboard             → Home do tenant (cards de ação) — AUTENTICADO
/dashboard/new         → Editor 3D completo com painel de config — AUTENTICADO
/dashboard/admin       → Painel Admin Master — APENAS role=master
```

#### Comandos para subir tudo localmente
```bash
# Terminal 1 — Supabase local (banco + auth + storage)
supabase start

# Terminal 2 — Frontend
npm run dev

# Terminal 3 — Edge Functions (quando necessário)
supabase functions serve
```

#### Variáveis para localhost (`.env.local`)
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<gerado pelo supabase start>
# Asaas sandbox (nunca produção em localhost)
ASAAS_API_KEY=<chave sandbox>
ASAAS_ENVIRONMENT=sandbox
```

---

### Checklist de Validação Local (por fase)

**Antes de qualquer commit para `main`, o dono valida:**

#### Fase 0 — Setup
- [x] `npm run dev` abre em `localhost:3001` sem erros ✅ **VALIDADO 2026-05-25**
- [ ] `supabase start` sobe banco sem erros
- [ ] Supabase Studio abre em `localhost:54323`
- [ ] Migrations aplicadas com `supabase db push`

#### Fase 2 — Auth (Modo Local sem Supabase)
- [x] Login com e-mail master funciona sem Supabase configurado ✅ **VALIDADO 2026-05-25**
- [x] Badge "Modo local" exibido no formulário de login ✅
- [x] `matheusjuliodeoliveira@gmail.com` recebe `role: 'master'` automaticamente ✅
- [x] Rota `/dashboard` redireciona para `/login` sem autenticação ✅
- [ ] Cadastro cria usuário no Supabase local (aguarda Fase 4)
- [ ] Logout limpa sessão e redireciona para `/login`
- [ ] Esqueci senha envia email (Supabase local captura em `localhost:54324`)

#### Fase 3 — Frontend OBRIGATORIO
- [x] `http://localhost:3001/dashboard` renderiza DashboardPage com boas-vindas ✅ **VALIDADO 2026-05-25**
- [x] `http://localhost:3001/dashboard/new` abre Editor 3D com ThreeView integrado ✅
- [x] `http://localhost:3001/dashboard/admin` abre painel Admin Master ✅
- [x] Sidebar com link "Admin Master" visível apenas para role=master ✅
- [x] Modal "Finalizar Orçamento" abre ao clicar no configurador ✅
- [ ] Sidebar navega entre todas as rotas sem erro (aguarda rotas de Orçamentos, Estoque, etc.)
- [ ] Editor 3D sincroniza em tempo real com painel de configuração
- [ ] Todas as 4 telas com dados reais do banco (aguarda Fase 4)

#### Fase 4 — Banco
- [ ] CRUD de materiais funciona (criar, editar, deletar)
- [ ] RLS testado: criar 2 tenants no Studio e verificar isolamento
- [ ] Seed carregado com `supabase db seed`

#### Fase 5 — Dashboard
- [ ] Criar material → aparece na listagem
- [ ] Editar preço → reflete no configurador público
- [ ] Convidar usuário → email capturado no Inbucket local
- [ ] Configurador público `/:slug` carrega materiais do tenant correto

#### Fase Asaas
- [ ] Webhook local testado com `ngrok` ou Asaas sandbox
- [ ] Pagamento sandbox confirmado → plano ativado no banco local
- [ ] Inadimplência simulada → status atualizado no Supabase Studio

#### Fase Master
- [ ] Rota `/master` inacessível para tenants comuns
- [ ] Listagem de tenants exibe todos os cadastros
- [ ] Impersonation abre dashboard do tenant com banner vermelho
- [ ] Suspender tenant bloqueia criação de orçamentos

---

### Regra de Bloqueio de Deploy

```
BLOQUEIO ABSOLUTO:
Nenhum @devops pode executar git push para main
sem que o dono tenha validado a feature em localhost
e comunicado explicitamente: "APROVADO para deploy"
```

**Fluxo de aprovação:**
```
@dev implementa → testa em localhost → avisa o dono
Dono valida em localhost → diz "aprovado"
@qa faz quality gate → @devops faz push → Vercel deploy
```

**Ambientes:**
| Branch | Destino | Quem valida |
|--------|---------|-------------|
| `feature/*` | Localhost apenas | Dono do produto |
| `dev` | Vercel Preview URL | Dono (validação final) |
| `main` | Vercel Produção | Somente após aprovação em `dev` |

---

*Plano criado em 2026-05-25 | Baseado na análise real do codebase Marmu 3D*
*Stack confirmada: React 19 + TypeScript + Vite + Three.js + TailwindCSS v4 + Design Obsidian*
