'use client'

/**
 * Global Admin & Elite Privilege System
 * Centralizes permission logic for specific users (e.g., Karamoff11@gmail.com)
 */

export const ADMIN_EMAIL = 'Karamoff11@gmail.com'

/**
 * Checks if a given email belongs to the platform administrator.
 */
export const isUserAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

/**
 * Returns the effective plan for a user, granting 'pro' or 'elite' status to admins.
 */
export const getEffectivePlan = (email: string | null | undefined, currentPlan: string): string => {
  if (isUserAdmin(email)) return 'pro' // Admins get all features
  return currentPlan
}

/**
 * Returns the effective credits for a user, granting 'Unlimited' status to admins.
 */
export const getEffectiveCredits = (email: string | null | undefined, currentCredits: number): number | 'Unlimited' => {
  if (isUserAdmin(email)) return 9999 // Infinite feel
  return currentCredits
}
