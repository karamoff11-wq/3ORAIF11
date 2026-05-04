/**
 * lib/appSettings.ts
 * ─────────────────────────────────────────────
 * Shared utility for reading and writing app_settings.
 * Architecture: one row per section (key = section name, value = JSON blob).
 *
 * Usage (admin write):
 *   await saveAppSettings('appearance', { primary_color: '#ff0000', ... }, supabase)
 *
 * Usage (page read):
 *   const appearance = await getAppSettings('appearance', APPEARANCE_DEFAULTS, supabase)
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type AppearanceSettings = {
  primary_color:    string
  accent_color:     string
  bg_color:         string
  font_body:        'Cairo' | 'Tajawal' | 'Inter'
  theme_mode:       'light' | 'dark' | 'system'
  particles_enabled: boolean
  grid_enabled:     boolean
  noise_enabled:    boolean
}

export type LandingSettings = {
  hero_title_ar:    string
  hero_title_en:    string
  hero_subtitle_ar: string
  hero_subtitle_en: string
  cta_label_ar:     string
  cta_label_en:     string
  show_quiz_demo:   boolean
  show_orbs:        boolean
  social_facebook:  string
  social_youtube:   string
  social_instagram: string
  social_twitter:   string
}

export type GameSettings = {
  max_categories:      number
  fireworks_enabled:   boolean
  particles_enabled:   boolean
  answer_reveal_delay: number
  start_label_ar:      string
  start_label_en:      string
  correct_label_ar:    string
  correct_label_en:    string
  wrong_label_ar:      string
  wrong_label_en:      string
  next_label_ar:       string
  next_label_en:       string
  timer_visible:       boolean
  scoreboard_visible:  boolean
}

// ─────────────────────────────────────────────
// Defaults (safe fallbacks if DB is empty)
// ─────────────────────────────────────────────

export const APPEARANCE_DEFAULTS: AppearanceSettings = {
  primary_color:    '#7c3aed',
  accent_color:     '#f59e0b',
  bg_color:         '#04040f',
  font_body:        'Cairo',
  theme_mode:       'dark',
  particles_enabled: true,
  grid_enabled:     true,
  noise_enabled:    true,
}

export const LANDING_DEFAULTS: LandingSettings = {
  hero_title_ar:    'أبو العُريف',
  hero_title_en:    'Abu Al-Areef',
  hero_subtitle_ar: 'منصة المسابقات الأولى عربياً',
  hero_subtitle_en: 'The #1 Arabic Trivia Platform',
  cta_label_ar:     'ابدأ اللعب',
  cta_label_en:     'Start Playing',
  show_quiz_demo:   true,
  show_orbs:        true,
  social_facebook:  '#',
  social_youtube:   '#',
  social_instagram: '#',
  social_twitter:   '#',
}

export const GAME_DEFAULTS: GameSettings = {
  max_categories:      12,
  fireworks_enabled:   true,
  particles_enabled:   true,
  answer_reveal_delay: 1200,
  start_label_ar:      'ابدأ اللعبة',
  start_label_en:      'Start Game',
  correct_label_ar:    'صحيح!',
  correct_label_en:    'Correct!',
  wrong_label_ar:      'خطأ!',
  wrong_label_en:      'Wrong!',
  next_label_ar:       'التالي',
  next_label_en:       'Next',
  timer_visible:       true,
  scoreboard_visible:  true,
}

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────

export async function getAppSettings<T>(
  key: string,
  defaults: T,
  supabase: any,
): Promise<T> {
  try {
    const { data } = await (supabase.from('app_settings') as any)
      .select('value')
      .eq('key', key)
      .single()
    if (data?.value) return { ...defaults, ...(data.value as object) } as T
  } catch {
    // Table may not exist yet — return defaults silently
  }
  return defaults
}

// ─────────────────────────────────────────────
// Write (upsert)
// ─────────────────────────────────────────────

export async function saveAppSettings(
  key: string,
  value: object,
  supabase: any,
): Promise<{ error: any }> {
  const { error } = await (supabase.from('app_settings') as any).upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  )
  return { error }
}
