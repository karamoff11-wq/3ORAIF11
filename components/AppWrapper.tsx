'use client'

import { useEffect } from 'react'
import { useFeedbackStore } from '@/store/feedbackStore'
import GlobalControls from './GlobalControls'
import { createClient } from '@/lib/supabaseClient'
import { getAppSettings, APPEARANCE_DEFAULTS } from '@/lib/appSettings'

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { themeMode, lang, setMounted, mounted } = useFeedbackStore()

  useEffect(() => {
    // Handle initial hydration
    setMounted(true)

    // Sync settings from Supabase
    async function syncSettings() {
      const supabase = createClient()
      const appearance = await getAppSettings('appearance', APPEARANCE_DEFAULTS, supabase)
      
      // Update store with global defaults from DB (admin settings)
      // Only set theme if the user hasn't explicitly set one locally? 
      // Actually, for Phase 1, let's let the Admin control the global theme.
      if (appearance.theme_mode) {
        useFeedbackStore.getState().setThemeMode(appearance.theme_mode)
      }
      if (appearance.accent_color) {
        useFeedbackStore.getState().setAccentColor(appearance.accent_color)
      }
    }
    syncSettings()
  }, [setMounted])

  useEffect(() => {
    if (!mounted) return
    
    const root = window.document.documentElement
    
    // Apply Language Direction
    root.dir = lang === 'AR' ? 'rtl' : 'ltr'
    root.lang = lang === 'AR' ? 'ar' : 'en'
    
    // Apply Theme
    const applyTheme = (mode: string) => {
      root.classList.remove('light', 'dark')
      if (mode === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.add(systemTheme)
      } else {
        root.classList.add(mode)
      }
    }

    applyTheme(themeMode)

    // Listen for system theme changes if in system mode
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme('system')
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [themeMode, lang, mounted])

  return (
    <>
      {children}
      <GlobalControls />
    </>
  )
}