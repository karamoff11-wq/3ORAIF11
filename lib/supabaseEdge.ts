import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const getEnv = (key: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key]!
  }
  if (typeof window !== 'undefined' && (window as any).ENV?.[key]) {
    return (window as any).ENV[key]!
  }
  return fallback
}

export function createEdgeClient() {
  return createSupabaseClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mbqonwwoazurvkxrffqx.supabase.co'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'sb_publishable_anAvCT0-6AZlKuGb9Ryaig_BFtasoQ1')
  )
}

export function createEdgeAdminClient() {
  return createSupabaseClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mbqonwwoazurvkxrffqx.supabase.co'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_secret_placeholder')
  )
}