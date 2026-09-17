import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

// The generated Database generic on SupabaseClient triggers a resolver bug
// in this TypeScript toolchain (Schema collapses to `never`), so the client
// is left untyped here and every query casts its `data` to our hand-written
// row types from `@/types/database.types` instead.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
