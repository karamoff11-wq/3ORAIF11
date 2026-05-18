import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const getEnv = (key: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key]!
  }
  return fallback
}

export async function createClient() {
  return createSupabaseClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mbqonwwoazurvkxrffqx.supabase.co'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'sb_publishable_anAvCT0-6AZlKuGb9Ryaig_BFtasoQ1')
  )
}

export function createAdminClient() {
  return createSupabaseClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mbqonwwoazurvkxrffqx.supabase.co'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_secret_placeholder')
  )
}