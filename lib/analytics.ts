// lib/analytics.ts
// Central analytics utility — all PostHog events go through here.
// This gives us one place to audit, rename, or disable events.

import posthog from 'posthog-js'

// ── Type-safe event definitions ────────────────────────────────────
export type AnalyticsEvent =
  | { event: 'session_created';        props: { mode: 'local' | 'remote'; user_id: string } }
  | { event: 'session_joined';         props: { session_id: string; player_name: string } }
  | { event: 'question_answered';      props: { session_id: string; correct: boolean; difficulty: string } }
  | { event: 'pro_upgrade_clicked';    props: { plan: 'pro' | 'team'; user_id: string } }
  | { event: 'pro_upgrade_completed';  props: { plan: 'pro' | 'team'; user_id: string } }
  | { event: 'google_signin_clicked';  props: Record<string, never> }
  | { event: 'forgot_password_opened'; props: Record<string, never> }
  | { event: 'signup_completed';       props: { method: 'email' | 'google' } }
  | { event: 'game_completed';         props: { session_id: string; winner_team: string; total_questions: number } }

// ── Track function ─────────────────────────────────────────────────
export function track<T extends AnalyticsEvent['event']>(
  event: T,
  props: Extract<AnalyticsEvent, { event: T }>['props']
) {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return  // Skip if not configured

  try {
    posthog.capture(event, props)
  } catch (err) {
    console.warn('[Analytics] Failed to track event:', event, err)
  }
}

// ── Identify user on login ─────────────────────────────────────────
export function identifyUser(userId: string, props?: {
  email?: string
  plan_type?: string
  created_at?: string
}) {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  try {
    posthog.identify(userId, props)
  } catch (err) {
    console.warn('[Analytics] Failed to identify user:', err)
  }
}

// ── Reset on logout ────────────────────────────────────────────────
export function resetAnalytics() {
  if (typeof window === 'undefined') return
  try { posthog.reset() } catch { /* silent */ }
}
