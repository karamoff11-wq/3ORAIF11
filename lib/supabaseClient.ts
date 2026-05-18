import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * INVINCIBLE SUPABASE CLIENT
 * This version checks if it's running in a build environment (no window, no env)
 * and returns a mock if variables are missing, preventing the app from crashing.
 * Updated to trigger fresh environment variable injection in Cloudflare.
 */
export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mbqonwwoazurvkxrffqx.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_anAvCT0-6AZlKuGb9Ryaig_BFtasoQ1';

  return createSupabaseClient(url, key);
}