'use client'
// ─── context/ThemeContext.tsx ──────────────────────────────────────────────────
// Provides the active theme to the entire app.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  Suspense,
} from 'react'
import { useSearchParams } from 'next/navigation'
import { Theme, ThemeId } from '@/types/theme'
import { themes, THEME_STORAGE_KEY, THEME_SESSION_KEY } from '@/lib/themes'

// ─── Context shape ─────────────────────────────────────────────────────────────
export interface ThemeContextValue {
  /** The fully resolved Theme object */
  theme: Theme
  /** Just the ID string — useful for conditional rendering */
  themeId: ThemeId
  /**
   * Switch themes programmatically.
   * @param id      - Target theme ID
   * @param persist - If true (default) saves to localStorage
   */
  setTheme: (id: ThemeId, persist?: boolean) => void
  /** True when the current theme came from a ?theme= URL param */
  isFromSpecialLink: boolean
  /** Persist the current special-link theme to localStorage */
  keepTheme: () => void
  /** Revert to the user's previously saved theme (or default) */
  revertTheme: () => void
}

const defaultCtx: ThemeContextValue = {
  theme: themes.default,
  themeId: 'default',
  setTheme: () => {},
  isFromSpecialLink: false,
  keepTheme: () => {},
  revertTheme: () => {},
}

const ThemeContext = createContext<ThemeContextValue>(defaultCtx)

// ─── Inner component — reads URL search params (needs Suspense above it) ───────
function ThemeUrlReader({
  onThemeFromUrl,
}: {
  onThemeFromUrl: (id: ThemeId) => void
}) {
  const searchParams = useSearchParams()
  // Track last-handled value so rapid re-renders don't re-trigger
  const lastHandled = useRef<string | null>(null)

  useEffect(() => {
    const urlTheme = searchParams.get('theme') as ThemeId | null
    if (urlTheme && themes[urlTheme] && urlTheme !== lastHandled.current) {
      lastHandled.current = urlTheme
      onThemeFromUrl(urlTheme)
    }
  }, [searchParams, onThemeFromUrl])

  return null
}

// ─── ThemeProvider ─────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('default')
  const [isFromSpecialLink, setIsFromSpecialLink] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // ── Read saved preference or URL param on first mount ───────────────────────
  useEffect(() => {
    // 1. Check URL first
    const urlParams = new URLSearchParams(window.location.search)
    const urlTheme = urlParams.get('theme') as ThemeId | null
    
    if (urlTheme && themes[urlTheme]) {
      setThemeId(urlTheme)
      // If it's different from saved, trigger special link state
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null
      if (urlTheme !== saved) {
        setIsFromSpecialLink(true)
        sessionStorage.setItem(THEME_SESSION_KEY, urlTheme)
      }
    } else {
      // 2. Check localStorage
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null
      if (saved && themes[saved]) {
        setThemeId(saved)
      }
    }
    setInitialized(true)
  }, [])

  // ── Apply CSS variables & background whenever theme changes ─────────────────
  useEffect(() => {
    if (!initialized) return
    const t = themes[themeId] ?? themes.default

    const root = document.documentElement
    Object.entries(t.cssVars).forEach(([k, v]) => root.style.setProperty(k, v))
    document.body.style.backgroundColor = t.colors.background
    root.setAttribute('data-theme', themeId)
  }, [themeId, initialized])

  // ── Handler called by ThemeUrlReader ────────────────────────────────────────
  const handleThemeFromUrl = useCallback((urlThemeId: ThemeId) => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null
    setThemeId(urlThemeId)
    if (urlThemeId !== saved) {
      // The user arrived via a special link → show the banner
      setIsFromSpecialLink(true)
      sessionStorage.setItem(THEME_SESSION_KEY, urlThemeId)
    }
  }, [])

  // ── Public API ───────────────────────────────────────────────────────────────
  const setTheme = useCallback((id: ThemeId, persist = true) => {
    if (!themes[id]) return
    setThemeId(id)
    setIsFromSpecialLink(false)
    if (persist) localStorage.setItem(THEME_STORAGE_KEY, id)
  }, [])

  const keepTheme = useCallback(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
    setIsFromSpecialLink(false)
    sessionStorage.removeItem(THEME_SESSION_KEY)
  }, [themeId])

  const revertTheme = useCallback(() => {
    setIsFromSpecialLink(false)
    sessionStorage.removeItem(THEME_SESSION_KEY)
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null
    setThemeId(saved && themes[saved] ? saved : 'default')
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme: themes[themeId] ?? themes.default,
        themeId,
        setTheme,
        isFromSpecialLink,
        keepTheme,
        revertTheme,
      }}
    >
      {/* ThemeUrlReader is wrapped in its own Suspense so the rest of the
          app renders immediately — no loading state needed at root level */}
      <Suspense fallback={null}>
        <ThemeUrlReader onThemeFromUrl={handleThemeFromUrl} />
      </Suspense>
      {children}
    </ThemeContext.Provider>
  )
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
