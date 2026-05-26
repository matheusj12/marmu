import { getSupabaseClient } from '../lib/supabase'
import { STONE_MATERIALS } from '../materials'
import type { MaterialRow } from './materialsService'

export interface PublicTenant {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  primary_color: string
  status: string
}

// Tenants mock para dev local — um por slug
const MOCK_TENANTS: Record<string, PublicTenant> = {
  'demo': {
    id: 'mock-tenant-demo',
    name: 'Marmoraria Demo',
    slug: 'demo',
    logo_url: null,
    primary_color: '#a78bfa',
    status: 'active',
  },
  'marmoraria-silva': {
    id: 'mock-tenant-silva',
    name: 'Marmoraria Silva',
    slug: 'marmoraria-silva',
    logo_url: null,
    primary_color: '#8b5cf6',
    status: 'active',
  },
}

const MOCK_MATERIALS: MaterialRow[] = STONE_MATERIALS.map((m) => ({
  ...m,
  active: true,
  created_at: new Date().toISOString(),
}))

// ---- API ----

export async function getTenantBySlug(slug: string): Promise<PublicTenant | null> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    // Modo dev: qualquer slug retorna um tenant genérico
    return (
      MOCK_TENANTS[slug] ?? {
        id: `mock-${slug}`,
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        slug,
        logo_url: null,
        primary_color: '#a78bfa',
        status: 'active',
      }
    )
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, slug, logo_url, primary_color, status')
    .eq('slug', slug)
    .neq('status', 'suspended')
    .neq('status', 'canceled')
    .single()

  if (error || !data) return null
  return data as PublicTenant
}

export async function getPublicMaterials(tenantId: string): Promise<MaterialRow[]> {
  const supabase = getSupabaseClient()

  if (!supabase) return [...MOCK_MATERIALS]

  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (data as Record<string, unknown>[]).map((row) => ({
    id:               row.id as string,
    name:             row.name as string,
    category:         row.category as MaterialRow['category'],
    color:            row.color as string,
    secondaryColor:   row.secondary_color as string | undefined,
    textureType:      row.texture_type as MaterialRow['textureType'],
    pricePerM2:       Number(row.price_per_m2),
    pricePerML_Saia:  Number(row.price_saia_ml),
    pricePerML_Frontao: Number(row.price_frontao_ml),
    roughness:        Number(row.roughness),
    metalness:        Number(row.metalness),
    active:           row.active as boolean,
    created_at:       row.created_at as string,
  }))
}

export async function submitPublicQuote(
  tenantId: string,
  payload: {
    client_name: string
    client_phone: string
    client_cpf_cnpj: string
    client_address: string
    project_type: string
    project_name: string
    material_id?: string
    configuration: Record<string, unknown>
    payment_methods: string[]
    delivery_days: number
    subtotal: number
    discount_pct: number
    discount_value: number
    installments: number
    total: number
    observations?: string
  },
): Promise<{ id: string }> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return { id: `mock-quote-${Date.now()}` }
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert({ ...payload, tenant_id: tenantId, status: 'draft' })
    .select('id')
    .single()

  if (error) throw error
  return data as { id: string }
}
