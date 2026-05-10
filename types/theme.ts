// ─── types/theme.ts ───────────────────────────────────────────────────────────
// Central type definitions for the app-wide theme system.
// Add new theme IDs here first whenever you create a new theme.

export type ThemeId = 'default' | 'medical' | 'engineering' | 'education' | 'birthday'

export interface ThemeColors {
  primary: string       // Main accent / CTA colour
  primaryLight: string  // Lighter tint of primary
  secondary: string     // Supporting accent colour
  accent: string        // Deep variant used for hovers / shadows
  background: string    // Page-level background
  surface: string       // Card / panel background
  surfaceHover: string  // Card hover state
  border: string        // Subtle border
  borderGlow: string    // Glowing border (rgba)
  text: string          // Primary text
  textMuted: string     // De-emphasised text
  glow: string          // box-shadow glow string
}

export interface Theme {
  id: ThemeId
  name: string           // English label
  nameAr: string         // Arabic label
  shortName: string      // Short English label for UI cards
  shortNameAr: string    // Short Arabic label for UI cards
  emoji: string          // Representative emoji
  description: string
  descriptionAr: string

  // Smart greeting functions — pass the user's display_name (or null for generic)
  greeting: (name?: string | null) => string
  greetingAr: (name?: string | null) => string

  subGreeting: string    // Subtitle shown under the main greeting
  subGreetingAr: string

  badge: string          // Short badge text shown on the avatar / dashboard chip
  badgeAr: string

  colors: ThemeColors
  cssVars: Record<string, string>  // Applied to :root via ThemeProvider
  celebratory?: boolean            // Triggers confetti on birthday theme
  bgGradient?: string              // Used for theme preview cards in Settings
}
