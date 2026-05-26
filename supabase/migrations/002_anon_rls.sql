-- ============================================================
-- Marmu SaaS — Migration 002: RLS para Configurador Público
-- Permite leitura anônima das rotas públicas (/:slug)
-- Aplique após 001_initial_schema.sql
-- ============================================================

-- TENANTS: clientes podem ler tenant ativo pelo slug (sem login)
CREATE POLICY "tenants_read_public"
  ON public.tenants FOR SELECT
  TO anon
  USING (status NOT IN ('suspended', 'canceled'));

-- MATERIALS: clientes podem ler materiais ativos do tenant (sem login)
CREATE POLICY "materials_read_public"
  ON public.materials FOR SELECT
  TO anon
  USING (active = true);

-- QUOTES: clientes podem inserir orçamentos sem estar logados
-- (tenant_id vem do slug resolvido no frontend)
CREATE POLICY "quotes_insert_public"
  ON public.quotes FOR INSERT
  TO anon
  WITH CHECK (true);
