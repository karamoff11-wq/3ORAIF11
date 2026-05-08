'use client'

import { useEffect } from 'react'
import { useFeedbackStore } from '@/store/feedbackStore'

/**
 * AppWrapper — THE single source of truth for theme + lang on <html>.
 *
 * This is the ONLY place that touches document.documentElement for:
 *   - theme class (.dark / .light)
 *   - dir + lang attributes
 *   - --accent CSS variable
 *
 * NO page should have its own useEffect for any of these.
 */
export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { themeMode, lang, accentColor, setMounted } = useFeedbackStore()

  // ── 1. Theme class → <html> ──
  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (mode: string) => {
      root.classList.remove('dark', 'light')
      root.classList.add(mode)
      root.style.colorScheme = mode
    }

    if (themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mq.matches ? 'dark' : 'light')
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      applyTheme(themeMode)
    }
  }, [themeMode])

  // ── 2. Lang + dir → <html> ──
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('lang', lang === 'AR' ? 'ar' : 'en')
    root.setAttribute('dir',  lang === 'AR' ? 'rtl' : 'ltr')
  }, [lang])

  // ── 3. Accent color → CSS variable on <html> ──
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent',        accentColor)
    root.style.setProperty('--accent-glow',   accentColor + '40')
    root.style.setProperty('--accent-subtle', accentColor + '15')
  }, [accentColor])

  // ── 4. Signal hydration complete ──
  useEffect(() => {
    setMounted(true)
    // Reveal page (was hidden by anti-flash script to prevent FOUC)
    document.documentElement.style.visibility = 'visible'
  }, [setMounted])

  return <>{children}</>
}