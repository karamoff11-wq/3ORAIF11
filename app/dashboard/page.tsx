'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import toast from 'react-hot-toast'
import { ensureAuthenticated } from '@/lib/testMode'
import { Database } from '@/types/database'
import { useFeedbackStore } from '@/store/feedbackStore'
import { createTranslator } from '@/lib/i18n'

type Profile = Database['public']['Tables']['profiles']['Row']
type Lang = 'AR' | 'EN'

// ─────────────────────────────────────────────
// ICONS (line icons, consistent with page.tsx)
// ─────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function StoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
    </svg>
  )
}
function GamepadIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
      <line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
      <rect x="2" y="6" width="20" height="12" rx="2"/>
    </svg>
  )
}
function GlobeIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

// ─────────────────────────────────────────────
// SIDEBAR ITEM
// ─────────────────────────────────────────────
const SIDEBAR_ICONS = [HomeIcon, UserIcon, UsersIcon, TrophyIcon, CalendarIcon, StoreIcon, SettingsIcon]

function SidebarItem({
  iconIndex, label, active = false, badge, locked = false, collapsed, lang, accentColor,
}: {
  iconIndex: number; label: string; active?: boolean; badge?: string;
  locked?: boolean; collapsed: boolean; lang: Lang; accentColor: string
}) {
  const [showTip, setShowTip] = useState(false)
  const t = createTranslator(lang)
  const Icon = SIDEBAR_ICONS[iconIndex]
  const isRtl = lang === 'AR'

  return (
    <div
      className="relative"
      onMouseEnter={() => locked && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <motion.div
        whileHover={!locked ? { x: isRtl ? -2 : 2 } : {}}
        className={`flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all relative ${
          active ? 'text-white' : locked ? 'opacity-30 cursor-default' : 'hover:opacity-80'
        }`}
        style={{
          background: active ? `${accentColor}18` : 'transparent',
          border: active ? `1px solid ${accentColor}28` : '1px solid transparent',
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        {/* Active indicator bar */}
        {active && (
          <div
            className={`absolute ${isRtl ? 'right-0' : 'left-0'} w-0.5 h-5 rounded-full`}
            style={{ background: accentColor }}
          />
        )}

        <span className="shrink-0" style={{ color: active ? accentColor : 'inherit' }}>
          <Icon />
        </span>

        {!collapsed && (
          <>
            <span className="text-sm font-bold flex-1 whitespace-nowrap">{label}</span>
            {badge && !locked && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
                style={{ background: '#EC4899' }}>
                {badge}
              </span>
            )}
            {locked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
          </>
        )}
      </motion.div>

      {/* Tooltip for locked items */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, x: isRtl ? -8 : 8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: isRtl ? -8 : 8, scale: 0.95 }}
            className={`absolute ${isRtl ? 'right-full mr-3' : 'left-full ml-3'} top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap z-50 pointer-events-none glass-card`}
            style={{ color: 'var(--text-secondary)' }}
          >
            🔒 {t('side_soon')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────
// ACTION CARD
// ─────────────────────────────────────────────
function ActionCard({
  title, desc, icon, onClick, loading, accentFrom, accentTo, accentGlow, badge, lang,
}: {
  title: string; desc: string; icon: React.ReactNode;
  onClick: () => void; loading: boolean;
  accentFrom: string; accentTo: string; accentGlow: string;
  badge: string; lang: Lang;
}) {
  const isRtl = lang === 'AR'
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.22 }}
      className="relative p-8 rounded-3xl overflow-hidden group flex flex-col justify-between min-h-[280px] glass-card"
    >
      {/* Top accent line on hover */}
      <div
        className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${accentFrom}60, transparent)` }}
      />

      {/* Background glow blob */}
      <div
        className="absolute -bottom-16 w-40 h-40 rounded-full blur-[60px] opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-35"
        style={{
          [isRtl ? 'left' : 'right']: '-3rem',
          background: `radial-gradient(circle, ${accentFrom}, ${accentTo})`,
        }}
      />

      {/* Badge label */}
      <div className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} text-[9px] font-mono tracking-[0.25em] uppercase`}
        style={{ color: 'var(--text-tertiary)' }}>
        {badge}
      </div>

      <div>
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{
            background: `${accentFrom}18`,
            border: `1px solid ${accentFrom}28`,
            color: accentFrom,
          }}
        >
          {icon}
        </div>

        <h3 className="text-2xl font-black mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: 'var(--text-secondary)' }}>
          {desc}
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={onClick}
        disabled={loading}
        className="relative mt-6 px-6 py-3 rounded-2xl font-black text-sm text-white transition-all flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 w-fit"
        style={{
          background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
          boxShadow: `0 6px 20px ${accentGlow}`,
        }}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        <span>{loading ? '...' : title}</span>
        <span style={{ transform: isRtl ? 'scaleX(1)' : 'scaleX(-1)', display: 'inline-block' }}>←</span>
      </button>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// WELCOME OVERLAY
// ─────────────────────────────────────────────
function WelcomeOverlay({
  username, onComplete, accentColor, lang,
}: {
  username: string; onComplete: () => void; accentColor: string; lang: Lang
}) {
  const t = createTranslator(lang)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: 'rgba(7,7,26,0.96)', backdropFilter: 'blur(32px)' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 65%)`,
            filter: 'blur(100px)',
          }}
        />
      </div>

      <motion.div
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl mb-8"
        >
          💎
        </motion.div>

        <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
          {t('dash_welcome')}{' '}
          <span style={{ color: accentColor }}>{username}</span>!
        </h2>

        <p className="text-white/40 text-base mb-10 leading-relaxed font-medium max-w-sm mx-auto">
          {t('dash_onboarding')}
        </p>

        <motion.button
          onClick={onComplete}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-5 rounded-2xl font-black text-lg text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, #EC4899)`,
            boxShadow: `0 12px 40px ${accentColor}35`,
          }}
        >
          {t('dash_onboarding_btn')}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// STAT PILL
// ─────────────────────────────────────────────
function StatPill({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl glass-card min-w-[100px]">
      <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</span>
      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
        {icon} {label}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────
// THEME TOGGLE (same as page.tsx)
// ─────────────────────────────────────────────
function ThemeToggle() {
  const { themeMode, setThemeMode, mounted } = useFeedbackStore()
  if (!mounted) return <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: 'var(--bg-card)' }} />

  const modes = ['dark', 'light', 'system'] as const
  const icons = { dark: '🌙', light: '☀️', system: '💻' }

  return (
    <button
      onClick={() => setThemeMode(modes[(modes.indexOf(themeMode as any) + 1) % 3])}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 focus:outline-none"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
    >
      <motion.span key={themeMode} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-sm">
        {(icons as any)[themeMode] ?? '🌙'}
      </motion.span>
    </button>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [creating, setCreating] = useState<'local' | 'remote' | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  const { accentColor, lang, mounted, themeMode, setThemeMode } = useFeedbackStore()
  const t = createTranslator(lang)
  const isRtl = lang === 'AR'
  const dir = isRtl ? 'rtl' : 'ltr'
  const isLight = themeMode === 'light'

  // ── Apply theme to document ──
  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    const apply = (mode: string) => {
      root.classList.remove('light', 'dark')
      root.classList.add(mode)
      root.style.colorScheme = mode
    }
    if (themeMode === 'system') {
      apply(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    } else {
      apply(themeMode)
    }
  }, [themeMode, mounted])

  // ── Apply lang direction ──
  useEffect(() => {
    document.documentElement.setAttribute('lang', isRtl ? 'ar' : 'en')
    document.documentElement.setAttribute('dir', dir)
  }, [lang, dir, isRtl])

  useEffect(() => {
    async function load() {
      const user = await ensureAuthenticated()
      if (!user) { router.push('/auth/login'); return }
      try {
        const { data } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single()
        if (data) {
          setProfile(data)
          if (!(data as any).onboarding_completed) setShowWelcome(true)
        }
      } catch (e) { console.error(e) }
    }
    load()
  }, [router, supabase])

  const handleCompleteOnboarding = async () => {
    if (!profile) return
    setShowWelcome(false)
    await (supabase.from('profiles') as any).update({ onboarding_completed: true }).eq('id', profile.id)
    setProfile({ ...profile, onboarding_completed: true } as any)
    toast.success(lang === 'AR' ? 'مرحباً بك في العُريف! 🎉' : 'Welcome to Al-Arif! 🎉')
  }

  const handleCreate = useCallback(async (mode: 'local' | 'remote') => {
    setCreating(mode)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const session = await gameEngine.createSession(user.id, mode)
      router.push(`/game/setup/${session.id}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreating(null)
    }
  }, [supabase, router])

  if (!mounted) return null

  const displayName = (profile as any)?.username ?? profile?.email?.split('@')[0] ?? '...'

  const sidebarItems = [
    { labelKey: 'side_home'         as const, iconIndex: 0, active: true  },
    { labelKey: 'side_profile'      as const, iconIndex: 1 },
    { labelKey: 'side_friends'      as const, iconIndex: 2, locked: true  },
    { labelKey: 'side_achievements' as const, iconIndex: 3, locked: true  },
    { labelKey: 'side_daily'        as const, iconIndex: 4, locked: true  },
    { labelKey: 'side_store'        as const, iconIndex: 5, locked: true  },
    { labelKey: 'side_settings'     as const, iconIndex: 6 },
  ]

  return (
    <div
      className="min-h-screen flex overflow-hidden transition-colors duration-700"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        direction: dir,
        fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif',
      }}
    >
      {/* ── CSS variables (same system as page.tsx) ── */}
      <style>{`
        :root { --accent: ${accentColor}; --accent-glow: ${accentColor}40; --accent-subtle: ${accentColor}15; }
        .dark {
          --bg-primary: #07071A; --bg-secondary: #0D0D28;
          --bg-card: rgba(255,255,255,0.025); --bg-card-hover: rgba(255,255,255,0.045);
          --bg-input: rgba(255,255,255,0.04);
          --border-subtle: rgba(255,255,255,0.04); --border-card: rgba(255,255,255,0.08);
          --text-primary: #ffffff; --text-secondary: rgba(255,255,255,0.45); --text-tertiary: rgba(255,255,255,0.2);
          --shadow-card: 0 20px 60px rgba(0,0,0,0.4);
          --glass-card-bg: rgba(255,255,255,0.025); --glass-card-border: rgba(255,255,255,0.08);
          --glass-blur: blur(24px); --nav-bg: rgba(7,7,26,0.75); --sidebar-bg: rgba(7,7,26,0.8);
        }
        .light {
          --bg-primary: #f8f7fc; --bg-secondary: #f3f0ff;
          --bg-card: rgba(255,255,255,0.7); --bg-card-hover: rgba(255,255,255,0.88);
          --bg-input: rgba(255,255,255,0.85);
          --border-subtle: rgba(0,0,0,0.04); --border-card: rgba(255,255,255,0.9);
          --text-primary: #12082e; --text-secondary: rgba(18,8,46,0.55); --text-tertiary: rgba(18,8,46,0.3);
          --shadow-card: 0 4px 24px rgba(139,92,246,0.08), 0 1px 3px rgba(0,0,0,0.04);
          --glass-card-bg: rgba(255,255,255,0.65); --glass-card-border: rgba(255,255,255,0.88);
          --glass-blur: blur(20px); --nav-bg: rgba(248,247,252,0.85); --sidebar-bg: rgba(248,247,252,0.9);
        }
        .glass-card {
          background: var(--glass-card-bg); border: 1px solid var(--glass-card-border);
          backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
          box-shadow: var(--shadow-card);
        }
        .light .glass-card {
          box-shadow: 0 4px 20px rgba(139,92,246,0.07), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95);
        }
      `}</style>

      <AnimatePresence>
        {showWelcome && (
          <WelcomeOverlay
            username={displayName}
            accentColor={accentColor}
            onComplete={handleCompleteOnboarding}
            lang={lang}
          />
        )}
      </AnimatePresence>

      {/* ════════════════════ SIDEBAR ════════════════════ */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 h-screen shrink-0 hidden lg:flex flex-col overflow-hidden"
        style={{
          background: 'var(--sidebar-bg)',
          borderInlineEnd: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(32px)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 p-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #EC4899)`, boxShadow: `0 4px 16px ${accentColor}30` }}
          >
            A
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-black text-xl tracking-tight overflow-hidden whitespace-nowrap"
                style={{ color: 'var(--text-primary)' }}
              >
                العُريف
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {sidebarItems.map((item, i) => (
            <SidebarItem
              key={i}
              iconIndex={item.iconIndex}
              label={t(item.labelKey)}
              active={item.active}
              locked={item.locked}
              collapsed={collapsed}
              lang={lang}
              accentColor={accentColor}
            />
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="p-4 flex items-center justify-center transition-all hover:opacity-70 shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}
          title={collapsed ? t('side_expand') : t('side_collapse')}
        >
          <ChevronIcon dir={isRtl ? (collapsed ? 'left' : 'right') : (collapsed ? 'right' : 'left')} />
        </button>
      </motion.aside>

      {/* ════════════════════ MAIN ════════════════════ */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">

        {/* ── TOP NAV ── */}
        <nav
          className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-8 py-4 shrink-0"
          style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          {/* Search */}
          <div className="relative max-w-xs w-full hidden md:flex items-center gap-3">
            <div className="absolute" style={{ [isRtl ? 'right' : 'left']: '16px', color: 'var(--text-tertiary)' }}>
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder={t('dash_search_ph')}
              className="w-full py-2.5 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                paddingInlineStart: '44px',
                paddingInlineEnd: '16px',
              }}
            />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div
              className="w-px h-5 hidden sm:block"
              style={{ background: 'var(--border-card)' }}
            />

            {/* User info */}
            <div className={`text-${isRtl ? 'right' : 'left'} hidden sm:block`}>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                {t('dash_level')} {(profile as any)?.level ?? 1}
              </p>
            </div>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-2xl overflow-hidden shrink-0"
              style={{ border: `2px solid ${accentColor}30` }}
            >
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </nav>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">

          {/* ── WELCOME HEADER CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl p-8 md:p-10 glass-card"
          >
            {/* Decorative blob */}
            <div
              className="absolute top-0 inset-x-0 pointer-events-none"
              style={{
                height: 200,
                background: `radial-gradient(ellipse at 50% -30%, ${accentColor}18 0%, transparent 65%)`,
              }}
            />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color: accentColor }}>
                  {isRtl ? 'مرحباً بعودتك' : 'Welcome back'}
                </p>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-2">
                  {t('dash_welcome')},{' '}
                  <span
                    className="text-transparent bg-clip-text"
                    style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, #EC4899)` }}
                  >
                    {displayName}
                  </span>{' '}
                  👋
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('dash_ready')}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 flex-wrap">
                <StatPill icon="🔥" value={(profile as any)?.streak ?? 0} label={t('dash_streak')} />
                <StatPill icon="💰" value={(profile as any)?.coins ?? 0} label={t('dash_coins')} />
              </div>
            </div>
          </motion.div>

          {/* ── ACTION CARDS ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <ActionCard
                title={t('dash_local_title')}
                desc={t('dash_local_desc')}
                icon={<GamepadIcon />}
                badge="MOD 01"
                loading={creating === 'local'}
                onClick={() => handleCreate('local')}
                accentFrom={accentColor}
                accentTo="#7C3AED"
                accentGlow={`${accentColor}40`}
                lang={lang}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <ActionCard
                title={t('dash_remote_title')}
                desc={t('dash_remote_desc')}
                icon={<GlobeIcon />}
                badge="MOD 02"
                loading={creating === 'remote'}
                onClick={() => handleCreate('remote')}
                accentFrom="#F59E0B"
                accentTo="#D97706"
                accentGlow="rgba(245,158,11,0.35)"
                lang={lang}
              />
            </motion.div>
          </section>

          <div className="h-4" />
        </main>
      </div>
    </div>
  )
}
