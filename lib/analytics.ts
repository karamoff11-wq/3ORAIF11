// lib/analytics.ts
// Central analytics utility — all PostHog events go through here.
// This gives us one place to audit, rename, or disable events.

// PostHog is lazily loaded only when the API key is configured.
// This prevents the ~80KB bundle from loading on pages/sessions that don't need it.
let _posthog: typeof import('posthog-js').default | null = null

async function getPosthog() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null
  if (_posthog) return _posthog
  try {
    const mod = await import('posthog-js')
    _posthog = mod.default
    if (!_posthog.__loaded) {
      _posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // we control this manually
      })
    }
    return _posthog
  } catch {
    return null
  }
}

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
  | { event: 'game_completed';         props: { session_id: string; winner_name: string; winner_score: number; team_count: number } }
  | { event: 'ai_generation_completed'; props: { session_id: string; latency_ms: number; category_count: number; custom: boolean } }
  | { event: 'session_launched';       props: { session_id: string; teams_count: number; cats_count: number } }

// ── Track function ─────────────────────────────────────────────────
export function track<T extends AnalyticsEvent['event']>(
  event: T,
  props: Extract<AnalyticsEvent, { event: T }>['props']
) {
  if (typeof window === 'undefined') return
  // Fire-and-forget: load posthog lazily, then capture
  getPosthog().then(ph => {
    if (!ph) return
    try { ph.capture(event, props) }
    catch (err) { console.warn('[Analytics] Failed to track event:', event, err) }
  })
}

// ── Identify user on login ─────────────────────────────────────────
export function identifyUser(userId: string, props?: {
  email?: string
  plan_type?: string
  created_at?: string
}) {
  if (typeof window === 'undefined') return
  getPosthog().then(ph => {
    if (!ph) return
    try { ph.identify(userId, props) }
    catch (err) { console.warn('[Analytics] Failed to identify user:', err) }
  })
}

// ── Reset on logout ────────────────────────────────────────────────
export function resetAnalytics() {
  if (typeof window === 'undefined') return
  if (_posthog) {
    try { _posthog.reset() } catch { /* silent */ }
  }
}
