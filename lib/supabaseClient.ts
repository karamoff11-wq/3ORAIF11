import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key]!
  }
  if (typeof window !== 'undefined' && (window as any).ENV?.[key]) {
    return (window as any).ENV[key]!
  }
  return ''
}

export const createClient = () => {
  return createSupabaseClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}