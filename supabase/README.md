# Supabase — Marmu SaaS

## Como aplicar (escolha uma das opções)

### Opção A — Supabase Cloud (app.supabase.com)
1. Crie um projeto em https://app.supabase.com
2. Vá em **SQL Editor**
3. Cole e execute `migrations/001_initial_schema.sql`
4. Cole e execute `seed.sql`
5. Defina o e-mail master (descomente a última linha do seed):
   ```sql
   ALTER DATABASE postgres SET app.master_email = 'matheusjuliodeoliveira@gmail.com';
   ```
6. Copie a **Project URL** e **anon key** para `.env.local`

### Opção B — Supabase CLI (local)
```bash
# Instalar CLI (uma vez)
npm install -g supabase

# Subir banco local
supabase start

# Aplicar migrations
supabase db push

# Aplicar seed
supabase db seed

# Ver URL e keys geradas
supabase status
```

## Após configurar

Atualize `.env.local`:
```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co    # ou http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_MASTER_EMAIL=matheusjuliodeoliveira@gmail.com
```

## Estrutura

```
supabase/
├── migrations/
│   └── 001_initial_schema.sql   ← tabelas, RLS, triggers, funções
└── seed.sql                     ← planos + 14 materiais base
```

## Tabelas criadas

| Tabela | Descrição |
|--------|-----------|
| `plans` | Planos de assinatura (Starter / Pro / Enterprise) |
| `tenants` | Empresas cadastradas (uma por assinatura) |
| `profiles` | Usuários ligados ao Supabase Auth |
| `materials` | Catálogo de pedras por tenant + base global |
| `quotes` | Orçamentos gerados |
| `subscriptions` | Assinaturas Asaas |
