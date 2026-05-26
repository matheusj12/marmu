import { getSupabaseClient } from '../lib/supabase'
import { lsGet, lsInsert, lsUpdate, lsDelete, lsFindById, lsSet } from '../lib/localStore'
import type { ProjectType, CountertopConfig, StaircaseConfig } from '../types'

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'

export interface QuoteRow {
  id: string
  tenant_id: string
  created_by?: string
  client_name: string
  client_phone?: string
  client_cpf_cnpj?: string
  client_address?: string
  project_type: ProjectType
  project_name: string
  material_id?: string
  material_name?: string   // join
  configuration: CountertopConfig | StaircaseConfig
  payment_methods: string[]
  delivery_days: number
  subtotal: number
  discount_pct: number
  discount_value: number
  installments: number
  total: number
  status: QuoteStatus
  observations?: string
  pdf_url?: string
  created_at: string
}

const LS_KEY = 'quotes'

// Seed dados de exemplo se localStorage estiver vazio
function seedIfEmpty() {
  const existing = lsGet<QuoteRow>(LS_KEY)
  if (existing.length > 0) return
  lsSet<QuoteRow>(LS_KEY, [
    {
      id: 'mock-001',
      tenant_id: 'local',
      client_name: 'Carlos Andrade',
      client_phone: '(11) 99999-0001',
      project_type: 'pia',
      project_name: 'Bancada Cozinha',
      material_name: 'Preto São Gabriel',
      configuration: {} as CountertopConfig,
      payment_methods: ['dinheiro_pix', 'credito'],
      delivery_days: 15,
      subtotal: 1850.00,
      discount_pct: 0,
      discount_value: 0,
      installments: 1,
      total: 1850.00,
      status: 'approved',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'mock-002',
      tenant_id: 'local',
      client_name: 'Ana Paula Souza',
      client_phone: '(11) 98888-0002',
      project_type: 'escada',
      project_name: 'Escada Residencial',
      material_name: 'Branco Carrara',
      configuration: {} as StaircaseConfig,
      payment_methods: ['credito'],
      delivery_days: 20,
      subtotal: 4200.00,
      discount_pct: 10,
      discount_value: 420.00,
      installments: 6,
      total: 3780.00,
      status: 'sent',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'mock-003',
      tenant_id: 'local',
      client_name: 'Roberto Lima',
      project_type: 'pia',
      project_name: 'Banheiro Social',
      material_name: 'Calacatta Gold',
      configuration: {} as CountertopConfig,
      payment_methods: ['dinheiro_pix'],
      delivery_days: 12,
      subtotal: 2600.00,
      discount_pct: 0,
      discount_value: 0,
      installments: 1,
      total: 2600.00,
      status: 'draft',
      created_at: new Date().toISOString(),
    },
  ])
}

export async function getQuotes(): Promise<QuoteRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    seedIfEmpty()
    return lsGet<QuoteRow>(LS_KEY).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*, materials(name)')
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data as unknown as Array<QuoteRow & { materials: { name: string } | null }>).map((row) => ({
    ...row,
    material_name: row.materials?.name,
  }))
}

export async function createQuote(input: Omit<QuoteRow, 'id' | 'created_at'>): Promise<QuoteRow> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    seedIfEmpty()
    return lsInsert<QuoteRow>(LS_KEY, input)
  }

  const { material_name: _, ...dbInput } = input
  const { data, error } = await supabase.from('quotes').insert(dbInput).select().single()
  if (error) throw error
  return data as QuoteRow
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    lsUpdate<QuoteRow>(LS_KEY, id, { status })
    return
  }
  const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
  if (error) throw error
}

export async function getQuoteById(id: string): Promise<QuoteRow | null> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    seedIfEmpty()
    return lsFindById<QuoteRow>(LS_KEY, id)
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*, materials(name)')
    .eq('id', id)
    .single()
  if (error) return null
  const row = data as QuoteRow & { materials: { name: string } | null }
  return { ...row, material_name: row.materials?.name }
}

export async function deleteQuote(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    lsDelete(LS_KEY, id)
    return
  }
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) throw error
}
