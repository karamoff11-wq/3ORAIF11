'use client'

import { createClient } from './supabaseClient'

/**
 * Utility to check if the app is running in Test Mode via ?test=true
 */
export const isTestMode = () => {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('test') === 'true' || params.get('guest') === 'true'
}

/**
 * Ensures the user is signed in, either normally or as a guest for testing.
 */
export async function ensureAuthenticated() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) return user

  if (isTestMode()) {
    console.log('[TestMode] Attempting anonymous/guest sign-in...')
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('[TestMode] Guest sign-in failed:', error.message)
      return null
    }
    return data.user
  }

  return null
}
