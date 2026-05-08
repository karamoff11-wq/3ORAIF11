'use client'

// ── PostHog Analytics Provider ─────────────────────────────────────
// Wraps the app with PostHog. Only activates in production.
// Automatically tracks page views on route changes.

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// Auto-capture page views on route change
function PageViewTracker() {
  const pathname      = usePathname()
  const searchParams  = useSearchParams()
  const ph            = usePostHog()

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      ph?.capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams, ph])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

    if (!key) return  // Skip in dev if key not set
    if (typeof window === 'undefined') return

    posthog.init(key, {
      api_host:               host,
      person_profiles:        'identified_only',  // GDPR-friendly default
      capture_pageview:       false,              // We handle this manually above
      capture_pageleave:      true,
      autocapture:            false,              // Manual control for clean data
      session_recording: {
        maskAllInputs:        true,              // Privacy: hide all form inputs
      },
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  )
}

// ── Re-export posthog for use in event tracking ──
export { posthog }
