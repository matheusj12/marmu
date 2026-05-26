-- ============================================================
-- Marmu SaaS — Seed Data
-- Execute DEPOIS de aplicar 001_initial_schema.sql
-- Comando: supabase db seed   (ou cole no Supabase SQL Editor)
-- ============================================================

-- ============================================================
-- PLANOS DE ASSINATURA
-- ============================================================
INSERT INTO public.plans (id, name, slug, price_monthly, max_users, max_quotes_per_month, features) VALUES
(
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Starter',
  'starter',
  0.00,
  1,
  20,
  '{
    "custom_branding": false,
    "ai_suggestions": false,
    "pdf_export": true,
    "public_configurator": false,
    "analytics": false,
    "priority_support": false
  }'::jsonb
),
(
  'a1b2c3d4-0001-0001-0001-000000000002',
  'Pro',
  'pro',
  297.00,
  5,
  200,
  '{
    "custom_branding": true,
    "ai_suggestions": true,
    "pdf_export": true,
    "public_configurator": true,
    "analytics": true,
    "priority_support": false
  }'::jsonb
),
(
  'a1b2c3d4-0001-0001-0001-000000000003',
  'Enterprise',
  'enterprise',
  897.00,
  -1,
  -1,
  '{
    "custom_branding": true,
    "ai_suggestions": true,
    "pdf_export": true,
    "public_configurator": true,
    "analytics": true,
    "priority_support": true,
    "white_label": true,
    "api_access": true
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- MATERIAIS BASE (tenant_id = NULL)
-- São copiados automaticamente para cada novo tenant via trigger.
-- Fonte: src/materials.ts
-- ============================================================
INSERT INTO public.materials
  (id, tenant_id, name, category, color, secondary_color, texture_type,
   price_per_m2, price_saia_ml, price_frontao_ml, roughness, metalness, sort_order)
VALUES

-- GRANITOS
(gen_random_uuid(), NULL, 'Preto São Gabriel',   'granito', '#0d0d0d', '#3a3a3a', 'granite',   520.00,  90.00,  85.00, 0.12, 0.10,  1),
(gen_random_uuid(), NULL, 'Verde Ubatuba',        'granito', '#0b1613', '#2b5042', 'granite',   450.00,  80.00,  75.00, 0.15, 0.15,  2),
(gen_random_uuid(), NULL, 'Amarelo Ornamental',   'granito', '#c8922a', '#a06b18', 'granite',   380.00,  65.00,  60.00, 0.18, 0.08,  3),
(gen_random_uuid(), NULL, 'Cinza Andorinha',      'granito', '#6b6e73', '#454749', 'granite',   420.00,  72.00,  68.00, 0.14, 0.12,  4),

-- MÁRMORES
(gen_random_uuid(), NULL, 'Branco Prime',         'marmore', '#f9f9fa', '#e1e3e8', 'composite', 680.00, 110.00, 105.00, 0.08, 0.05,  5),
(gen_random_uuid(), NULL, 'Crema Marfil',         'marmore', '#f4ede1', '#decbb4', 'marble',    890.00, 140.00, 130.00, 0.18, 0.05,  6),
(gen_random_uuid(), NULL, 'Branco Carrara',       'marmore', '#eaeaea', '#b0b5be', 'marble',   1450.00, 220.00, 210.00, 0.20, 0.05,  7),
(gen_random_uuid(), NULL, 'Nero Marquina',        'marmore', '#111111', '#2a2a2a', 'marble',   1200.00, 185.00, 175.00, 0.12, 0.08,  8),

-- QUARTZOS
(gen_random_uuid(), NULL, 'Cinza Absoluto',       'quartzo', '#42454a', '#232529', 'composite', 950.00, 160.00, 150.00, 0.08, 0.05,  9),
(gen_random_uuid(), NULL, 'Calacatta Gold',       'quartzo', '#fbfbfb', '#cca256', 'marble',   2100.00, 320.00, 300.00, 0.06, 0.05, 10),
(gen_random_uuid(), NULL, 'Branco Zeus',          'quartzo', '#f0f0f0', '#d5d5d5', 'composite', 880.00, 145.00, 138.00, 0.09, 0.04, 11),
(gen_random_uuid(), NULL, 'Chumbo Titanium',      'quartzo', '#3d3d3d', '#222222', 'composite',1050.00, 170.00, 162.00, 0.07, 0.06, 12),

-- ULTRA COMPACTOS
(gen_random_uuid(), NULL, 'Slate Black (Dekton)', 'ultra',   '#1a1b1d', '#34363a', 'solid',    2400.00, 380.00, 350.00, 0.40, 0.10, 13),
(gen_random_uuid(), NULL, 'Arctic White (Neolith)','ultra',  '#f5f5f7', '#e0e0e3', 'solid',    2200.00, 350.00, 325.00, 0.35, 0.08, 14)

ON CONFLICT DO NOTHING;

-- ============================================================
-- CONFIGURAÇÕES DA PLATAFORMA (app.settings via GUC)
-- Defina o e-mail master antes de criar o primeiro usuário.
-- Execute: ALTER DATABASE postgres SET app.master_email = 'seu@email.com';
-- Ou configure via Supabase Dashboard → Settings → Database → Config
-- ============================================================

-- Descomentar e ajustar antes de criar o primeiro usuário:
-- ALTER DATABASE postgres SET app.master_email = 'matheusjuliodeoliveira@gmail.com';

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Seed concluído. Planos: %, Materiais base: %',
    (SELECT COUNT(*) FROM public.plans),
    (SELECT COUNT(*) FROM public.materials WHERE tenant_id IS NULL);
END;
$$;
