import { createClient } from '@supabase/supabase-js'

const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key]!
  }
  if (typeof window !== 'undefined' && (window as any).ENV?.[key]) {
    return (window as any).ENV[key]!
  }
  return ''
}

export function createEdgeClient() {
  return createClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}

export function createEdgeAdminClient() {
  return createClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY')
  )
}