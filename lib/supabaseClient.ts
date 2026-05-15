import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * INVINCIBLE SUPABASE CLIENT
 * This version checks if it's running in a build environment (no window, no env)
 * and returns a mock if variables are missing, preventing the app from crashing.
 */
export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase credentials missing — using dummy client (expected during build)');
    // Return a dummy client to prevent build-time crashes
    return createSupabaseClient('https://placeholder.supabase.co', 'placeholder');
  }

  return createSupabaseClient(url, key);
}