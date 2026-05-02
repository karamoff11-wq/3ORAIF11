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

  // Persistence for Guests to ensure "Never Repeat" works
  if (typeof window !== 'undefined') {
    const savedId = localStorage.getItem('trivia_persistent_guest_id')
    if (savedId) {
      // We don't sign in again, we just return a mock user object with this ID
      // because the game engine uses user.id
      return { id: savedId, email: 'guest@persistent.ai' } as any
    }
  }

  if (isTestMode() || true) { // Default to guest mode for ease of use
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) return null
    
    if (data.user && typeof window !== 'undefined') {
      localStorage.setItem('trivia_persistent_guest_id', data.user.id)
    }
    return data.user
  }

  return null
}
