import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let _client: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  _client = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn(
    '[Marmu] Supabase não configurado. ' +
    'Crie .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = _client

export function getSupabaseClient(): SupabaseClient | null {
  return _client
}
