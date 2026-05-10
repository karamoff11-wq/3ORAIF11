'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useFeedbackStore, SpecialThemeId } from '@/store/feedbackStore'
import { themes } from '@/lib/themes'
import CookieBanner from '@/components/CookieBanner'

// ── URL param reader (needs Suspense) ───────────────────────────────────────
function SpecialThemeUrlReader() {
  const searchParams = useSearchParams()
  const { setSpecialTheme, specialTheme } = useFeedbackStore()

  useEffect(() => {
    const urlTheme = searchParams.get('theme') as SpecialThemeId | null
    const valid: SpecialThemeId[] = ['default', 'medical', 'engineering', 'education', 'birthday']
    if (urlTheme && valid.includes(urlTheme) && urlTheme !== specialTheme) {
      setSpecialTheme(urlTheme)
    }
  }, [searchParams, setSpecialTheme, specialTheme])

  return null
}

/**
 * AppWrapper — single source of truth for all global styles on <html>.
 */
export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { themeMode, lang, accentColor, specialTheme, setMounted } = useFeedbackStore()

  // 1. Dark / Light
  useEffect(() => {
    const root = document.documentElement
    const applyMode = (mode: string) => {
      root.classList.remove('dark', 'light')
      root.classList.add(mode)
      root.style.colorScheme = mode
    }
    if (themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyMode(mq.matches ? 'dark' : 'light')
      const handler = (e: MediaQueryListEvent) => applyMode(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      applyMode(themeMode)
    }
  }, [themeMode])

  // 2. Lang + dir
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('lang', lang === 'AR' ? 'ar' : 'en')
    root.setAttribute('dir',  lang === 'AR' ? 'rtl' : 'ltr')
  }, [lang])

  // 3. Special theme OR default accent
  useEffect(() => {
    const root = document.documentElement
    const themeObj = themes[specialTheme as keyof typeof themes]
    const vars = themeObj?.cssVars

    if (vars) {
      // Reset all theme variables first
      const allVars = ['--body-bg-image', '--body-bg-opacity', '--body-gradient', '--bg-card', '--bg-card-hover', '--border-card', '--glass-card-bg', '--glass-card-border', '--color-surface', '--nav-bg'];
      allVars.forEach(v => root.style.removeProperty(v));

      // Apply base theme variables
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
      
      // If it's the default theme, allow the user's custom accentColor to override the theme's default accent
      if (specialTheme === 'default') {
        root.style.setProperty('--accent',        accentColor)
        root.style.setProperty('--accent-glow',   accentColor + '40')
        root.style.setProperty('--accent-subtle', accentColor + '15')
        root.style.setProperty('--color-primary', accentColor)
      }
      
      root.setAttribute('data-theme', specialTheme)
    }
  }, [specialTheme, accentColor])

  // 4. Hydration
  useEffect(() => {
    setMounted(true)
    document.documentElement.style.visibility = 'visible'
  }, [setMounted])

  return (
    <>
      <Suspense fallback={null}>
        <SpecialThemeUrlReader />
      </Suspense>
      <CookieBanner />
      {children}
    </>
  )
}