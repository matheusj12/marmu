import { getSupabaseClient } from '../lib/supabase'
import { STONE_MATERIALS } from '../materials'
import type { StoneMaterial } from '../types'

export interface MaterialRow extends StoneMaterial {
  active: boolean
  created_at: string
}

// In-memory store para modo dev local (sem Supabase)
let _mockStore: MaterialRow[] = STONE_MATERIALS.map((m) => ({
  ...m,
  active: true,
  created_at: new Date().toISOString(),
}))

// ---- Helpers de mapeamento DB ↔ app ----

function dbToMaterial(row: Record<string, unknown>): MaterialRow {
  return {
    id:               row.id as string,
    name:             row.name as string,
    category:         row.category as StoneMaterial['category'],
    color:            row.color as string,
    secondaryColor:   row.secondary_color as string | undefined,
    textureType:      row.texture_type as StoneMaterial['textureType'],
    pricePerM2:       Number(row.price_per_m2),
    pricePerML_Saia:  Number(row.price_saia_ml),
    pricePerML_Frontao: Number(row.price_frontao_ml),
    roughness:        Number(row.roughness),
    metalness:        Number(row.metalness),
    active:           row.active as boolean,
    created_at:       row.created_at as string,
  }
}

function materialToDb(m: Omit<MaterialRow, 'id' | 'created_at'>, tenantId: string) {
  return {
    tenant_id:        tenantId,
    name:             m.name,
    category:         m.category,
    color:            m.color,
    secondary_color:  m.secondaryColor ?? null,
    texture_type:     m.textureType,
    price_per_m2:     m.pricePerM2,
    price_saia_ml:    m.pricePerML_Saia,
    price_frontao_ml: m.pricePerML_Frontao,
    roughness:        m.roughness,
    metalness:        m.metalness,
    active:           m.active,
  }
}

// ---- API ----

export async function getMaterials(): Promise<MaterialRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return [..._mockStore]

  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data as Record<string, unknown>[]).map(dbToMaterial)
}

export async function createMaterial(
  tenantId: string,
  input: Omit<MaterialRow, 'id' | 'created_at'>,
): Promise<MaterialRow> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    const newMat: MaterialRow = {
      ...input,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    _mockStore = [..._mockStore, newMat]
    return newMat
  }

  const { data, error } = await supabase
    .from('materials')
    .insert(materialToDb(input, tenantId))
    .select()
    .single()
  if (error) throw error
  return dbToMaterial(data as Record<string, unknown>)
}

export async function updateMaterial(
  id: string,
  input: Partial<Omit<MaterialRow, 'id' | 'created_at'>>,
  tenantId = '',
): Promise<MaterialRow> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    _mockStore = _mockStore.map((m) => (m.id === id ? { ...m, ...input } : m))
    return _mockStore.find((m) => m.id === id)!
  }

  const dbInput = materialToDb(
    { ..._mockStore.find((m) => m.id === id)!, ...input } as MaterialRow,
    tenantId,
  )
  const { data, error } = await supabase
    .from('materials')
    .update(dbInput)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return dbToMaterial(data as Record<string, unknown>)
}

export async function toggleMaterial(id: string, active: boolean): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    _mockStore = _mockStore.map((m) => (m.id === id ? { ...m, active } : m))
    return
  }
  const { error } = await supabase.from('materials').update({ active }).eq('id', id)
  if (error) throw error
}

export async function deleteMaterial(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    _mockStore = _mockStore.filter((m) => m.id !== id)
    return
  }
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) throw error
}
