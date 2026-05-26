-- ============================================================
-- Marmu SaaS — Migration 001: Schema Inicial
-- Aplique com: supabase db push  (ou cole no Supabase SQL Editor)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- busca textual futura

-- ============================================================
-- TABELA: plans
-- Planos de assinatura disponíveis na plataforma
-- ============================================================
CREATE TABLE public.plans (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,                       -- "Starter", "Pro", "Enterprise"
  slug          text        UNIQUE NOT NULL,                -- "starter", "pro", "enterprise"
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  max_users     int         NOT NULL DEFAULT 1,
  max_quotes_per_month int  NOT NULL DEFAULT 10,
  features      jsonb       NOT NULL DEFAULT '{}',          -- {"custom_branding": true, ...}
  active        boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: tenants
-- Cada marmoraria cadastrada = 1 tenant
-- ============================================================
CREATE TABLE public.tenants (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,                     -- "Marmoraria Silva"
  slug            text        UNIQUE,                       -- "marmoraria-silva" (URL pública)
  logo_url        text,
  primary_color   text        DEFAULT '#a78bfa',            -- Cor primária da marca
  plan_id         uuid        REFERENCES public.plans(id) ON DELETE SET NULL,
  status          text        NOT NULL DEFAULT 'trial'
                  CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'canceled')),
  trial_ends_at   timestamptz DEFAULT (now() + INTERVAL '14 days'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- ============================================================
-- TABELA: profiles
-- Usuários da plataforma — ligados ao Supabase Auth
-- ============================================================
CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid        REFERENCES public.tenants(id) ON DELETE SET NULL,
  name        text        NOT NULL DEFAULT '',
  role        text        NOT NULL DEFAULT 'operator'
              CHECK (role IN ('master', 'admin', 'operator')),
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);

-- ============================================================
-- TABELA: materials
-- Catálogo de pedras por tenant.
-- tenant_id = NULL → material base (visível para todos)
-- ============================================================
CREATE TABLE public.materials (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        REFERENCES public.tenants(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  category         text        NOT NULL
                   CHECK (category IN ('granito', 'marmore', 'quartzo', 'ultra')),
  color            text        NOT NULL DEFAULT '#888888',
  secondary_color  text,
  texture_type     text        NOT NULL DEFAULT 'solid'
                   CHECK (texture_type IN ('solid', 'marble', 'granite', 'composite')),
  price_per_m2     numeric(10,2) NOT NULL DEFAULT 0,
  price_saia_ml    numeric(10,2) NOT NULL DEFAULT 0,
  price_frontao_ml numeric(10,2) NOT NULL DEFAULT 0,
  roughness        numeric(5,4) NOT NULL DEFAULT 0.2,
  metalness        numeric(5,4) NOT NULL DEFAULT 0.1,
  active           boolean     NOT NULL DEFAULT true,
  sort_order       int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_materials_tenant_id ON public.materials(tenant_id);
CREATE INDEX idx_materials_category  ON public.materials(category);

-- ============================================================
-- TABELA: quotes
-- Orçamentos gerados pelo configurador
-- ============================================================
CREATE TABLE public.quotes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name     text        NOT NULL DEFAULT '',
  client_phone    text,
  client_cpf_cnpj text,
  client_address  text,
  project_type    text        NOT NULL DEFAULT 'pia'
                  CHECK (project_type IN ('pia', 'escada')),
  project_name    text        NOT NULL DEFAULT 'Projeto',
  material_id     uuid        REFERENCES public.materials(id) ON DELETE SET NULL,
  configuration   jsonb       NOT NULL DEFAULT '{}',  -- CountertopConfig | StaircaseConfig
  payment_methods text[]      DEFAULT '{}',           -- ['dinheiro_pix', 'credito']
  delivery_days   int         NOT NULL DEFAULT 15,
  subtotal        numeric(10,2) NOT NULL DEFAULT 0,
  discount_pct    numeric(5,2)  NOT NULL DEFAULT 0,
  discount_value  numeric(10,2) NOT NULL DEFAULT 0,
  installments    int         NOT NULL DEFAULT 1,
  total           numeric(10,2) NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  observations    text,
  pdf_url         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_tenant_id  ON public.quotes(tenant_id);
CREATE INDEX idx_quotes_status     ON public.quotes(status);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at DESC);

-- ============================================================
-- TABELA: subscriptions
-- Assinaturas Asaas — histórico e status de cobrança
-- ============================================================
CREATE TABLE public.subscriptions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id              uuid        REFERENCES public.plans(id) ON DELETE SET NULL,
  asaas_subscription_id text       UNIQUE,                  -- ID da assinatura no Asaas
  asaas_customer_id    text,
  status               text        NOT NULL DEFAULT 'trialing'
                       CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_start timestamptz,
  current_period_end   timestamptz,
  canceled_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);

-- ============================================================
-- FUNÇÃO: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- FUNÇÃO + TRIGGER: novo usuário → cria profile + tenant
-- Dispara quando alguém faz signUp via Supabase Auth
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id  uuid;
  v_role       text := 'admin';
  v_company    text;
  v_name       text;
  v_master_email text := current_setting('app.master_email', TRUE);
BEGIN
  v_name    := COALESCE(NEW.raw_user_meta_data->>'name',    split_part(NEW.email, '@', 1));
  v_company := COALESCE(NEW.raw_user_meta_data->>'company', v_name || ' Marmoraria');

  -- E-mail master recebe role=master sem tenant
  IF v_master_email IS NOT NULL AND NEW.email = v_master_email THEN
    INSERT INTO public.profiles (id, tenant_id, name, role)
    VALUES (NEW.id, NULL, v_name, 'master');
    RETURN NEW;
  END IF;

  -- Demais usuários: criar tenant + profile admin
  INSERT INTO public.tenants (name)
  VALUES (v_company)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.profiles (id, tenant_id, name, role)
  VALUES (NEW.id, v_tenant_id, v_name, 'admin');

  -- Copiar materiais base (tenant_id IS NULL) para o novo tenant
  INSERT INTO public.materials (
    tenant_id, name, category, color, secondary_color,
    texture_type, price_per_m2, price_saia_ml, price_frontao_ml,
    roughness, metalness, active, sort_order
  )
  SELECT
    v_tenant_id, name, category, color, secondary_color,
    texture_type, price_per_m2, price_saia_ml, price_frontao_ml,
    roughness, metalness, active, sort_order
  FROM public.materials
  WHERE tenant_id IS NULL;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS — Row Level Security
-- Isolamento total entre tenants
-- ============================================================

-- PLANS: leitura pública para autenticados (catálogo de planos)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_read_authenticated"
  ON public.plans FOR SELECT
  TO authenticated
  USING (active = true);

-- TENANTS: cada usuário vê apenas o seu tenant (master vê todos)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_read_own"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (
    id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

CREATE POLICY "tenants_update_admin"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
  );

-- PROFILES: cada usuário vê os profiles do seu tenant
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_own_tenant"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- MATERIALS: visíveis pelo tenant dono + materiais base (tenant_id IS NULL)
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materials_read_own_or_base"
  ON public.materials FOR SELECT
  TO authenticated
  USING (
    tenant_id IS NULL
    OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

CREATE POLICY "materials_write_admin"
  ON public.materials FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
  );

-- QUOTES: apenas o tenant dono
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_read_own_tenant"
  ON public.quotes FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

CREATE POLICY "quotes_write_own_tenant"
  ON public.quotes FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- SUBSCRIPTIONS: leitura pelo admin do tenant, escrita somente master
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_read_admin"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

CREATE POLICY "subscriptions_write_master"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

-- ============================================================
-- FUNÇÃO RPC: get_my_profile
-- Retorna o profile + nome do tenant do usuário logado
-- Usado pelo frontend para resolver role sem múltiplas queries
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_build_object(
    'id',          p.id,
    'name',        p.name,
    'role',        p.role,
    'tenant_id',   p.tenant_id,
    'tenant_name', t.name,
    'tenant_slug', t.slug
  )
  FROM public.profiles p
  LEFT JOIN public.tenants t ON t.id = p.tenant_id
  WHERE p.id = auth.uid();
$$;
