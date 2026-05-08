'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import toast from 'react-hot-toast'
import { ensureAuthenticated } from '@/lib/testMode'
import { Database } from '@/types/database'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'

type Profile = Database['public']['Tables']['profiles']['Row']
type Lang = 'AR' | 'EN'

// ─────────────────────────────────────────────
// SVG ICONS — all line-based, no emojis in UI
// ─────────────────────────────────────────────
const Icon = {
  Home: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Store: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Gamepad: ({ size = 26 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
      <line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
      <rect x="2" y="6" width="20" height="12" rx="2"/>
    </svg>
  ),
  Globe: ({ size = 26 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Flame: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  Coin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v2m0 8v2M9 9h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9m6 0h-2a1 1 0 0 0-1-1v-1a1 1 0 0 0 1-1h2"/>
    </svg>
  ),
  Lock: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
}

// ─────────────────────────────────────────────
// BACKGROUND — animated blobs, consistent with homepage
// ─────────────────────────────────────────────
function DashboardBackground({ accentColor, themeMode }: { accentColor: string; themeMode: string }) {
  const isLight = themeMode === 'light'
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${isLight ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.02)'} 1px, transparent 1px),
            linear-gradient(to bottom, ${isLight ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.02)'} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 80% 60% at center, black, transparent)',
        }}
      />
      {/* Blob 1 */}
      <motion.div
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 80, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[-10%] left-[-5%] w-[55%] h-[55%] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}${isLight ? '14' : '18'}, transparent 65%)`, filter: 'blur(100px)' }}
      />
      {/* Blob 2 */}
      <motion.div
        animate={{ x: [0, -70, 50, 0], y: [0, 80, -40, 0], scale: [1, 0.8, 1.15, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, #3B82F6${isLight ? '10' : '14'}, transparent 65%)`, filter: 'blur(100px)' }}
      />
      {/* Vignette */}
      {!isLight && (
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 200px rgba(7,7,26,0.6)' }} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// SIDEBAR ITEM
// ─────────────────────────────────────────────
const SIDEBAR_ICON_KEYS = ['Home', 'User', 'Users', 'Trophy', 'Calendar', 'Store', 'Settings', 'LogOut'] as const
type SidebarIconKey = typeof SIDEBAR_ICON_KEYS[number]

function SidebarItem({
  iconKey, label, active = false, locked = false, collapsed, lang, accentColor, onClick,
}: {
  iconKey: SidebarIconKey; label: string; active?: boolean;
  locked?: boolean; collapsed: boolean; lang: Lang; accentColor: string; onClick?: () => void
}) {
  const [showTip, setShowTip] = useState(false)
  const t = useTranslator()
  const isRtl = lang === 'AR'
  const IconComp = Icon[iconKey] as React.FC

  return (
    <div
      className="relative"
      onMouseEnter={() => locked && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <motion.div
        whileHover={!locked ? { x: isRtl ? -2 : 2 } : {}}
        onClick={!locked ? onClick : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
          active ? '' : locked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
        }`}
        style={{
          background: active ? `${accentColor}18` : 'transparent',
          border: active ? `1px solid ${accentColor}25` : '1px solid transparent',
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: locked ? 'not-allowed' : 'pointer',
        }}
      >
        {active && (
          <div
            className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full`}
            style={{ background: accentColor }}
          />
        )}
        <span className="shrink-0" style={{ color: active ? accentColor : 'inherit' }}>
          <IconComp />
        </span>
        {!collapsed && (
          <>
            <span className="text-sm font-semibold flex-1 whitespace-nowrap">{label}</span>
            {locked && <span className="opacity-40"><Icon.Lock /></span>}
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, x: isRtl ? -6 : 6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: isRtl ? -6 : 6, scale: 0.95 }}
            className={`absolute ${isRtl ? 'right-full mr-2' : 'left-full ml-2'} top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap z-50 pointer-events-none glass-card`}
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('side_soon')}
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
  title, desc, icon, onClick, loading,
  accentFrom, accentTo, accentGlow, badge, lang,
}: {
  title: string; desc: string; icon: React.ReactNode;
  onClick: () => void; loading: boolean;
  accentFrom: string; accentTo: string; accentGlow: string;
  badge: string; lang: Lang;
}) {
  const isRtl = lang === 'AR'
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative p-7 rounded-3xl overflow-hidden group flex flex-col justify-between min-h-[260px] glass-card cursor-default"
    >
      {/* Top shine on hover */}
      <div
        className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${accentFrom}55, transparent)` }}
      />
      {/* Corner glow */}
      <div
        className="absolute -bottom-14 w-36 h-36 rounded-full blur-[50px] opacity-15 pointer-events-none transition-opacity duration-500 group-hover:opacity-30"
        style={{ [isRtl ? 'left' : 'right']: '-2.5rem', background: `radial-gradient(circle, ${accentFrom}, ${accentTo})` }}
      />
      {/* Badge */}
      <div
        className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} text-[9px] font-mono tracking-[0.3em] uppercase`}
        style={{ color: 'var(--text-tertiary)' }}
      >
        {badge}
      </div>

      <div>
        <div
          className="w-13 h-13 w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ background: `${accentFrom}15`, border: `1px solid ${accentFrom}25`, color: accentFrom }}
        >
          {icon}
        </div>
        <h3 className="text-xl font-black mb-1.5 tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: 200 }}>{desc}</p>
      </div>

      <button
        onClick={onClick}
        disabled={loading}
        className="mt-5 px-5 py-2.5 rounded-xl font-black text-sm text-white transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 w-fit"
        style={{
          background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
          boxShadow: `0 4px 16px ${accentGlow}`,
        }}
      >
        {loading
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <span className="flex items-center gap-2">{title} <span style={{ transform: isRtl ? 'none' : 'scaleX(-1)', display: 'inline-block' }}>←</span></span>
        }
      </button>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// RECENT SESSIONS
// ─────────────────────────────────────────────
function RecentSessions({
  lang, accentColor, userId, router,
}: {
  lang: Lang; accentColor: string; userId: string; router: ReturnType<typeof useRouter>
}) {
  const t = useTranslator()
  const supabase = useMemo(() => createClient(), [])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function load() {
      try {
        const { data } = await (supabase.from('sessions') as any)
          .select('id, mode, state, created_at')
          .eq('host_id', userId)
          .order('created_at', { ascending: false })
          .limit(4)
        setSessions(data ?? [])
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, supabase])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000)
    if (diffH < 1) return lang === 'AR' ? 'منذ قليل' : 'Just now'
    if (diffH < 24) return lang === 'AR' ? `منذ ${diffH} س` : `${diffH}h ago`
    const diffD = Math.floor(diffH / 24)
    if (diffD === 1) return lang === 'AR' ? 'أمس' : 'Yesterday'
    return lang === 'AR' ? `منذ ${diffD} أيام` : `${diffD}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
          {t('dash_recent_sessions')}
        </h2>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          {t('dash_last_4')}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center glass-card"
        >
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
            {t('dash_no_sessions')}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {t('dash_start_first')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sessions.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.06 }}
              whileHover={{ y: -3, scale: 1.02 }}
              onClick={() => router.push(`/game/${s.id}`)}
              className="text-start p-4 rounded-2xl glass-card transition-all group relative overflow-hidden"
            >
              {/* Hover shimmer */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 30%, ${accentColor}10, transparent 65%)` }}
              />
              <div className="relative z-10">
                {/* Mode badge */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${accentColor}18`, color: accentColor }}
                  >
                    {s.mode === 'remote' ? <Icon.Globe /> : <Icon.Gamepad />}
                  </div>
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: s.state === 'finished' ? '#22c55e' : '#F59E0B' }}
                  />
                </div>
                <p className="text-xs font-black truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                  {t('dash_session_label')}
                </p>
                <div className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                  <Icon.Clock />
                  <span className="text-[10px] font-medium">{formatDate(s.created_at)}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// STAT PILL
// ─────────────────────────────────────────────
function StatPill({
  iconEl, value, label,
}: {
  iconEl: React.ReactNode; value: string | number; label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-3.5 rounded-2xl glass-card min-w-[90px]">
      <span className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</span>
      <div className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
        {iconEl}
        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// THEME TOGGLE
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
      <motion.span key={themeMode} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-sm">
        {(icons as any)[themeMode] ?? '🌙'}
      </motion.span>
    </button>
  )
}

// ─────────────────────────────────────────────
// WELCOME OVERLAY
// ─────────────────────────────────────────────
function WelcomeOverlay({ username, onComplete, accentColor }: {
  username: string; onComplete: () => void; accentColor: string
}) {
  const t = useTranslator()
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: 'rgba(7,7,26,0.96)', backdropFilter: 'blur(32px)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full"
          style={{ background: `radial-gradient(circle, ${accentColor}, transparent 65%)`, filter: 'blur(100px)' }}
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
          transition={{ duration: 3, repeat: Infinity }}
          className="text-7xl mb-8"
        >
          💎
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
          {t('dash_welcome')} <span style={{ color: accentColor }}>{username}</span>!
        </h2>
        <p className="text-white/40 text-base mb-10 leading-relaxed font-medium max-w-sm mx-auto">
          {t('dash_onboarding')}
        </p>
        <motion.button
          onClick={onComplete}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="w-full py-5 rounded-2xl font-black text-lg text-white"
          style={{ background: `linear-gradient(135deg, ${accentColor}, #EC4899)`, boxShadow: `0 12px 40px ${accentColor}35` }}
        >
          {t('dash_onboarding_btn')}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// MOBILE BOTTOM NAV
// ─────────────────────────────────────────────
function MobileBottomNav({
  accentColor, onLogout,
}: {
  accentColor: string; onLogout: () => void
}) {
  const t = useTranslator()
  const items = [
    { icon: 'Home' as const,     label: t('side_home'),     active: true  },
    { icon: 'User' as const,     label: t('side_profile')              },
    { icon: 'Trophy' as const,   label: t('side_achievements'), locked: true },
    { icon: 'Settings' as const, label: t('side_settings')            },
  ]

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden flex items-center justify-around px-2 py-2"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      {items.map((item, i) => {
        const IconComp = Icon[item.icon] as React.FC
        return (
          <button
            key={i}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative"
            style={{
              color: item.active ? accentColor : 'var(--text-tertiary)',
              opacity: item.locked ? 0.35 : 1,
            }}
          >
            {item.active && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                style={{ background: accentColor }}
              />
            )}
            <IconComp />
            <span className="text-[9px] font-black tracking-wide">{item.label}</span>
          </button>
        )
      })}
      {/* Logout on mobile */}
      <button
        onClick={onLogout}
        className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
        style={{ color: 'rgba(239,68,68,0.6)' }}
      >
        <Icon.LogOut />
        <span className="text-[9px] font-black tracking-wide">{t('side_logout')}</span>
      </button>
    </nav>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [profile,     setProfile]     = useState<Profile | null>(null)
  const [creating,    setCreating]    = useState<'local' | 'remote' | null>(null)
  const [collapsed,   setCollapsed]   = useState(false)

  const { accentColor, lang, mounted, themeMode } = useFeedbackStore()
  const t      = useTranslator()
  const isRtl  = lang === 'AR'
  const dir    = isRtl ? 'rtl' : 'ltr'

  // Theme, Lang, and Accent are now handled by AppWrapper globally.

  // Load profile
  useEffect(() => {
    async function load() {
      const user = await ensureAuthenticated()
      if (!user) { router.push('/auth/login'); return }
      try {
        const { data } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single()
        if (data) { setProfile(data) }
      } catch (e) { console.error(e) }
    }
    load()
  }, [router, supabase])


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

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/')
    toast.success(t('dash_logout_toast'))
  }, [supabase, router, t])

  if (!mounted) return null

  const displayName = profile?.email?.split('@')[0] ?? '...'
  const userId      = profile?.id ?? ''

  const sidebarItems: { labelKey: Parameters<typeof t>[0]; iconKey: SidebarIconKey; active?: boolean; locked?: boolean }[] = [
    { labelKey: 'side_home',         iconKey: 'Home',     active: true  },
    { labelKey: 'side_profile',      iconKey: 'User'                    },
    { labelKey: 'side_friends',      iconKey: 'Users',    locked: true  },
    { labelKey: 'side_achievements', iconKey: 'Trophy',   locked: true  },
    { labelKey: 'side_daily',        iconKey: 'Calendar', locked: true  },
    { labelKey: 'side_store',        iconKey: 'Store',    locked: true  },
    { labelKey: 'side_settings',     iconKey: 'Settings'                },
  ]

  return (
    <div
      className="min-h-screen flex overflow-hidden transition-colors duration-700"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', direction: dir, fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif' }}
    >
      {/* Root CSS variables are handled by AppWrapper */}

      {/* Animated background */}
      <DashboardBackground accentColor={accentColor} themeMode={themeMode} />


      {/* ══════════ SIDEBAR (desktop) ══════════ */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 252 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 h-screen shrink-0 hidden lg:flex flex-col overflow-hidden"
        style={{ background: 'var(--sidebar-bg)', borderInlineEnd: '1px solid var(--border-subtle)', backdropFilter: 'blur(32px)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #EC4899)`, boxShadow: `0 4px 14px ${accentColor}30` }}
          >
            A
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-black text-lg tracking-tight overflow-hidden whitespace-nowrap"
                style={{ color: 'var(--text-primary)' }}
              >
                العُريف
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {sidebarItems.map((item, i) => (
            <SidebarItem
              key={i}
              iconKey={item.iconKey}
              label={t(item.labelKey)}
              active={item.active}
              locked={item.locked}
              collapsed={collapsed}
              lang={lang}
              accentColor={accentColor}
            />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2.5 mb-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <motion.div
            whileHover={{ x: isRtl ? -3 : 3 }}
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
            style={{ color: 'rgba(239,68,68,0.6)' }}
          >
            <span className="shrink-0"><Icon.LogOut /></span>
            {!collapsed && <span className="text-sm font-semibold">{t('side_logout')}</span>}
          </motion.div>
        </div>

        {/* Collapse */}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="p-3 flex items-center justify-center transition-all hover:opacity-60 shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}
        >
          {isRtl
            ? (collapsed ? <Icon.ChevronLeft /> : <Icon.ChevronRight />)
            : (collapsed ? <Icon.ChevronRight /> : <Icon.ChevronLeft />)
          }
        </button>
      </motion.aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0 relative z-10">

        {/* Top nav */}
        <nav
          className="sticky top-0 z-40 flex items-center justify-between px-5 md:px-8 py-3.5 shrink-0"
          style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="relative max-w-xs w-full hidden md:flex items-center">
            <div className="absolute" style={{ [isRtl ? 'right' : 'left']: '14px', color: 'var(--text-tertiary)' }}>
              <Icon.Search />
            </div>
            <input
              type="text"
              placeholder={t('dash_search_ph')}
              className="w-full py-2.5 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                paddingInlineStart: '40px',
                paddingInlineEnd: '14px',
              }}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <div className="w-px h-5 hidden sm:block" style={{ background: 'var(--border-card)' }} />
            <div className="hidden sm:block" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                {t('dash_level')} 1
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0" style={{ border: `2px solid ${accentColor}28` }}>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </nav>

        {/* Page body */}
        <main className="flex-1 p-5 md:p-8 space-y-7 max-w-5xl w-full mx-auto pb-24 lg:pb-8">

          {/* Welcome header */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl p-7 md:p-9 glass-card"
          >
            <div
              className="absolute top-0 inset-x-0 pointer-events-none"
              style={{ height: 180, background: `radial-gradient(ellipse at 50% -20%, ${accentColor}18 0%, transparent 65%)` }}
            />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-1.5" style={{ color: accentColor }}>
                  {isRtl ? 'مرحباً بعودتك' : 'Welcome back'}
                </p>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-snug mb-1.5">
                  {t('dash_welcome')},{' '}
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, #EC4899)` }}>
                    {displayName}
                  </span>{' '}
                  👋
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('dash_ready')}</p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <StatPill
                  iconEl={<Icon.Flame />}
                  value={0}
                  label={t('dash_streak')}
                />
                <StatPill
                  iconEl={<Icon.Coin />}
                  value={0}
                  label={t('dash_coins')}
                />
              </div>
            </div>
          </motion.div>

          {/* Action cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <ActionCard
                title={t('dash_local_title')}
                desc={t('dash_local_desc')}
                icon={<Icon.Gamepad />}
                badge="MOD 01"
                loading={creating === 'local'}
                onClick={() => handleCreate('local')}
                accentFrom={accentColor}
                accentTo="#7C3AED"
                accentGlow={`${accentColor}40`}
                lang={lang}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <ActionCard
                title={t('dash_remote_title')}
                desc={t('dash_remote_desc')}
                icon={<Icon.Globe />}
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

          {/* Recent sessions */}
          <RecentSessions lang={lang} accentColor={accentColor} userId={userId} router={router} />

        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav accentColor={accentColor} onLogout={handleLogout} />
    </div>
  )
}
