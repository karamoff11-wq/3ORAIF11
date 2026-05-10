'use client'

/**
 * LazyPostHog — Client Component wrapper for PostHogProvider.
 *
 * This component exists so we can use next/dynamic with ssr:false
 * from within a Client Component, which is required since layout.tsx
 * is a Server Component and can't use ssr:false directly.
 *
 * Result: posthog-js (~80KB) is deferred from the initial JS bundle
 * and only fetched after React hydration is complete.
 */
import dynamic from 'next/dynamic'

const PostHogProvider = dynamic(
  () => import('@/components/PostHogProvider').then(m => ({ default: m.PostHogProvider })),
  { ssr: false }
)

export default function LazyPostHog({ children }: { children: React.ReactNode }) {
  return <PostHogProvider>{children}</PostHogProvider>
}
