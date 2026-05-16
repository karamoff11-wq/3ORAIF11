'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import toast from 'react-hot-toast'
import { ensureAuthenticated } from '@/lib/testMode'
import { Database } from '@/types/database'
import { isUserAdmin } from '@/lib/admin'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'
import { track, identifyUser, resetAnalytics } from '@/lib/analytics'
import CreationsLibrary from '@/components/dashboard/CreationsLibrary'
import AssetPreloader from '@/components/AssetPreloader'

// ─────────────────────────────────────────────
// UPGRADE SUCCESS OVERLAY
// ─────────────────────────────────────────────
function UpgradeSuccessOverlay({ plan, onDismiss, accentColor }: {
  plan: string; onDismiss: () => void; accentColor: string
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const planColor = plan === 'team' ? '#06b6d4' : '#7c3aed'
  const planLabel = plan === 'team' ? 'Team' : 'Pro'

  // Confetti pieces
  const pieces = useMemo(() =>
    Array.from({ length: 72 }, (_, i) => ({
      id: i,
      x: (i * 137.508) % 100,
      color: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#ffffff'][i % 6],
      sz: (i % 4) * 3 + 6,
      del: (i % 10) * 0.05,
      spin: i % 2 === 0 ? 520 : -520,
    })), []
  )

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: 'rgba(4,4,18,0.97)', backdropFilter: 'blur(40px)' }}
    >
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none z-[201] overflow-hidden">
        {pieces.map(p => (
          <motion.div key={p.id}
            initial={{ y: -16, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: '115vh', opacity: [1, 1, 0], rotate: p.spin }}
            transition={{ duration: 2.8 + p.del, delay: p.del, ease: 'easeIn' }}
            className="absolute top-0 rounded-sm"
            style={{ width: p.sz, height: p.sz * 0.55, background: p.color }}
          />
        ))}
      </div>

      {/* Ambient glow */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 40%, ${planColor}35 0%, transparent 65%)`, filter: 'blur(60px)' }}
      />

      <motion.div
        initial={{ scale: 0.88, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-[202] w-full max-w-sm text-center flex flex-col items-center gap-6"
      >
        {/* Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 280, damping: 18 }}
          className="px-6 py-2 rounded-full text-sm font-black text-white uppercase tracking-[0.18em]"
          style={{ background: `linear-gradient(135deg, ${planColor}, #EC4899)`, boxShadow: `0 8px 32px ${planColor}60` }}
        >
          {planLabel} Member
        </motion.div>

        {/* Icon */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-8xl"
        >
          ✨
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white leading-tight">
            اشتراكك فعّال الآن!
          </h2>
          <p className="text-base text-white/40 font-medium">
            مرحباً بك في العُريف {planLabel} — استمتع بكل المميزات الحصرية
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onDismiss}
          className="w-full py-4 rounded-2xl font-black text-base text-white"
          style={{ background: `linear-gradient(135deg, ${planColor}, #EC4899)`, boxShadow: `0 12px 40px ${planColor}40` }}
        >
          ابدأ الآن ←
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

type Profile = Database['public']['Tables']['profiles']['Row']
type Lang = 'AR' | 'EN'

// ─────────────────────────────────────────────
// SVG ICONS — all line-based, no emojis in UI
// ─────────────────────────────────────────────
const Icon = {
  Home: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Trophy: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Store: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Gamepad: ({ size = 26 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" /><line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  ),
  Globe: ({ size = 26 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Flame: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  Coin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2M9 9h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9m6 0h-2a1 1 0 0 0-1-1v-1a1 1 0 0 0 1-1h2" />
    </svg>
  ),
  Lock: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  PlusCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
}

// ─────────────────────────────────────────────
// SMART HEADER — premium section branding
// ─────────────────────────────────────────────
function SmartHeader({ title, subtitle, badge, accentColor, isRtl }: {
  title: string; subtitle?: string; badge?: string; accentColor: string; isRtl: boolean
}) {
  return (
    <div className={`flex flex-col ${isRtl ? 'items-end text-right ml-auto w-fit' : 'items-start text-left w-full'} gap-3 mb-10 group/header`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-4">
        <div className={`flex flex-col ${isRtl ? 'items-end' : 'items-start'}`}>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-black tracking-tighter"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </motion.h2>
          {subtitle && (
            <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {badge && (
          <motion.span
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #6366F1)` }}
          >
            {badge}
          </motion.span>
        )}
      </div>

      {/* Elegant Aurora HUD Line */}
      <div className={`relative ${isRtl ? 'w-56' : 'w-full'} min-w-[140px] h-px overflow-hidden`}>
        {/* Base Subtle Track */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `linear-gradient(${isRtl ? '270deg' : '90deg'}, ${accentColor} 0%, transparent 100%)` }}
        />

        {/* Smooth Flowing Pulse */}
        <motion.div
          className="absolute inset-y-0 w-64"
          animate={{ [isRtl ? 'right' : 'left']: ['-100%', '150%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 75%)`,
            opacity: 0.6
          }}
        />

        {/* Leading Elegant Dot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full blur-[1px]"
          animate={{ [isRtl ? 'right' : 'left']: ['-5%', '105%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// BACKGROUND — animated blobs, consistent with homepage
// ─────────────────────────────────────────────
function DashboardBackground({ accentColor, themeMode }: { accentColor: string; themeMode: string }) {
  const isLight = themeMode === 'light'

  // Generate particles for a "living" background
  const particles = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * -20,
    })), []
  )

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-1000"
      style={{ background: isLight ? '#F9FAFB' : '#020205' }}
    >
      {/* 1. Cinematic Film Grain */}
      <div className={`absolute inset-0 ${isLight ? 'opacity-[0.04]' : 'opacity-[0.06]'} mix-blend-overlay pointer-events-none z-50 noise`} />

      {/* 2. Dynamic Grid with Mask */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${accentColor}${isLight ? '20' : '15'} 1px, transparent 1px),
            linear-gradient(to bottom, ${accentColor}${isLight ? '20' : '15'} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
        }}
      />

      {/* 3. Deep Nebula Blobs */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 80, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${accentColor}${isLight ? '25' : '40'}, transparent 70%)`,
          filter: 'blur(100px)',
          opacity: isLight ? 0.8 : 0.7
        }}
      />
      <motion.div
        animate={{
          x: [0, -100, 60, 0],
          y: [0, 80, -100, 0],
          scale: [1, 1.1, 1.2, 1],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full"
        style={{
          background: `radial-gradient(circle, #6366F1${isLight ? '20' : '35'}, transparent 70%)`,
          filter: 'blur(100px)',
          opacity: isLight ? 0.7 : 0.6
        }}
      />
      <motion.div
        animate={{
          x: [0, 40, -80, 0],
          y: [0, 100, -50, 0],
          scale: [0.8, 1.3, 0.9, 0.8],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${isLight ? '#F472B6' : '#EC4899'}25, transparent 70%)`,
          filter: 'blur(120px)',
          opacity: 0.4
        }}
      />

      {/* 4. Interactive Particle Field */}
      {particles.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: `${p.y}vh`, opacity: 0 }}
          animate={{
            y: [`${p.y}vh`, `${p.y - 15}vh`, `${p.y}vh`],
            opacity: [0, isLight ? 0.3 : 0.5, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: i % 2 === 0 ? accentColor : (isLight ? '#6366F1' : '#34D399'),
            boxShadow: isLight ? 'none' : `0 0 10px ${accentColor}60`
          }}
        />
      ))}

      {/* 5. Vignette & Depth */}
      <div className={`absolute inset-0 bg-gradient-to-b from-${isLight ? '[#FDFCFE]' : '[#0B0B1A]'} via-transparent to-${isLight ? '[#FDFCFE]' : '[#0B0B1A]'} ${isLight ? 'opacity-50' : 'opacity-70'}`} />
      <div className={`absolute inset-0 bg-gradient-to-r from-${isLight ? '[#FDFCFE]' : '[#0B0B1A]'} via-transparent to-${isLight ? '[#FDFCFE]' : '[#0B0B1A]'} ${isLight ? 'opacity-30' : 'opacity-50'}`} />
    </div>
  )
}

// ─────────────────────────────────────────────
// SIDEBAR ITEM
// ─────────────────────────────────────────────
const SIDEBAR_ICON_KEYS = ['Home', 'User', 'Users', 'Trophy', 'Calendar', 'Store', 'Settings', 'LogOut', 'CreditCard'] as const
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
        whileHover={!locked ? { x: isRtl ? -4 : 4 } : {}}
        onClick={!locked ? onClick : undefined}
        className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative group ${active ? '' : locked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.02]'
          }`}
        style={{
          background: active ? `${accentColor}12` : 'transparent',
          border: active ? `1px solid ${accentColor}20` : '1px solid transparent',
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        {active && (
          <motion.div
            layoutId="activeSide"
            className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-1 h-8 rounded-full shadow-[0_0_20px_var(--accent-glow)]`}
            style={{
              background: `linear-gradient(to bottom, ${accentColor}, #6366F1)`,
              boxShadow: `0 0 20px ${accentColor}80`
            }}
          />
        )}
        <span className="shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ color: active ? accentColor : 'inherit' }}>
          <IconComp />
        </span>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-black flex-1 whitespace-nowrap tracking-tight"
          >
            {label}
          </motion.span>
        )}
        {!collapsed && locked && <span className="opacity-40"><Icon.Lock /></span>}
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
  accentFrom, accentTo, accentGlow, badge, lang, comingSoon,
}: {
  title: string; desc: string; icon: React.ReactNode;
  onClick: () => void; loading: boolean;
  accentFrom: string; accentTo: string; accentGlow: string;
  badge: string; lang: Lang; comingSoon?: boolean;
}) {
  const isRtl = lang === 'AR'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -12, scale: 1.01 }}
      onClick={!comingSoon ? onClick : undefined}
      className={`relative p-10 md:p-14 rounded-[4rem] border overflow-hidden group flex-1 flex flex-col justify-between transition-all duration-700 glass-card min-h-[420px] ${comingSoon ? 'cursor-not-allowed opacity-70 grayscale' : 'cursor-pointer shadow-2xl hover:shadow-[0_40px_100px_-20px_rgba(67,56,202,0.3)]'
        } ${isRtl ? 'text-right' : 'text-left'}`}
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Corner Aurora Light */}
      <div
        className="absolute -top-32 -right-32 w-64 h-64 blur-[100px] opacity-0 group-hover:opacity-30 transition-all duration-1000"
        style={{ backgroundColor: accentFrom }}
      />

      {/* Coming Soon Overlay */}
      {comingSoon && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-[16px]" style={{ backgroundColor: 'var(--bg-overlay)' }} />
          <div className="relative z-20 flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-indigo-500/20 bg-indigo-500/5 shadow-2xl"
              style={{ color: 'var(--text-tertiary)' }}>
              <Icon.Lock />
            </div>
            <span className="px-8 py-2.5 rounded-full border-2 text-[11px] font-black uppercase tracking-[0.5em] text-white"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-strong)' }}>
              {isRtl ? 'قريباً' : 'COMING SOON'}
            </span>
          </div>
        </div>
      )}

      <div className={`flex flex-col ${isRtl ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 relative z-10`}>
        <div
          className="w-24 h-24 md:w-28 md:h-28 rounded-[3rem] flex items-center justify-center text-5xl md:text-6xl shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 shrink-0"
          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`, color: 'white', boxShadow: `0 20px 50px ${accentGlow}` }}
        >
          {icon}
        </div>
        <div className="flex-1 space-y-4">
          <div className={`flex items-center gap-4 justify-center ${isRtl ? 'md:justify-start' : 'md:justify-end'}`}>
            <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {badge && (
              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                {badge}
              </span>
            )}
          </div>
          <p className="text-lg opacity-40 font-medium leading-relaxed max-w-sm mx-auto md:mx-0" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
        </div>
      </div>

      <div className={`mt-12 flex ${isRtl ? 'justify-end' : 'justify-start'} relative z-30`}>
        <button
          onClick={!comingSoon ? onClick : undefined}
          disabled={loading || comingSoon}
          data-testid="start-session-btn"
          className="px-12 py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] text-white transition-all flex items-center gap-4 hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
            boxShadow: `0 20px 40px ${accentGlow}`,
          }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              {isRtl ? 'ابدأ النمط' : 'START SESSION'}
              <motion.span
                animate={{ x: isRtl ? [0, -6, 0] : [0, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ transform: isRtl ? 'none' : 'scaleX(-1)', display: 'inline-block' }}
              >
                ←
              </motion.span>
            </span>
          )}
        </button>
      </div>
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
      <SmartHeader
        title={t('dash_recent_sessions')}
        subtitle={t('dash_last_4')}
        accentColor={accentColor}
        isRtl={lang === 'AR'}
      />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
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
// ACHIEVEMENTS SECTION
// ─────────────────────────────────────────────
function AchievementsSection({ isRtl, accentColor, profile, router }: { isRtl: boolean; accentColor: string; profile: Profile | null; router: any }) {
  const t = useTranslator()

  const achievements = [
    {
      id: 'first_game',
      icon: '🎯',
      titleAr: 'البداية القوية',
      titleEn: 'First Blood',
      descAr: 'استضف أول جلسة لعب لك.',
      descEn: 'Host your very first game session.',
      progress: (profile?.sessions_played ?? 0) >= 1 ? 100 : 0,
      target: 1,
    },
    {
      id: 'knowledge_king',
      icon: '👑',
      titleAr: 'ملك المعرفة',
      titleEn: 'Knowledge King',
      descAr: 'استضف ١٠ جلسات لعب كاملة.',
      descEn: 'Host 10 full game sessions.',
      progress: Math.min(((profile?.sessions_played ?? 0) / 10) * 100, 100),
      target: 10,
    },
    {
      id: 'streak_master',
      icon: '🔥',
      titleAr: 'سيد الاستمرارية',
      titleEn: 'Streak Master',
      descAr: 'حافظ على سلسلة استضافة لـ ٣ أيام.',
      descEn: 'Maintain a 3-day hosting streak.',
      progress: Math.min(((profile?.streak ?? 0) / 3) * 100, 100),
      target: 3,
    },
    {
      id: 'social_star',
      icon: '🌟',
      titleAr: 'نجم الحفلة',
      titleEn: 'Social Star',
      descAr: 'اجذب مجموع ٥٠ لاعباً لجلساتك.',
      descEn: 'Have 50 total players join your games.',
      progress: 20, // Placeholder for total players if not tracked yet
      target: 50,
    }
  ]

  return (
    <div className="space-y-4">
      <SmartHeader
        title={isRtl ? 'الإنجازات والأوسمة' : 'Achievements & Milestones'}
        accentColor={accentColor}
        isRtl={isRtl}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((ach, i) => {
          const isDone = ach.progress >= 100
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="p-7 rounded-[2.5rem] glass-card relative overflow-hidden group/ach hover:y-[-5px] transition-all duration-500 border border-white/5"
            >
              {/* Achievement Corner Glow */}
              <div
                className="absolute -top-16 -right-16 w-32 h-32 blur-[40px] opacity-0 group-hover/ach:opacity-20 transition-opacity duration-700 pointer-events-none"
                style={{ backgroundColor: accentColor }}
              />

              {/* Background Glow for Completed */}
              {isDone && (
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 120%, ${accentColor}, transparent 70%)` }}
                />
              )}

              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${isDone ? 'bg-white/5 shadow-2xl scale-110' : 'grayscale opacity-20'}`}>
                    {ach.icon}
                  </div>
                  {isDone && (
                    <div
                      className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-xl"
                      style={{ background: `linear-gradient(135deg, #22c55e, #10B981)` }}
                    >
                      {isRtl ? 'مكتمل' : 'UNLOCKED'}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-black mb-1 tracking-tight" style={{ color: isDone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {isRtl ? ach.titleAr : ach.titleEn}
                  </h3>
                  <p className="text-xs leading-relaxed opacity-40 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {isRtl ? ach.descAr : ach.descEn}
                  </p>
                </div>

                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] opacity-40">
                    <span>{Math.round(ach.progress)}%</span>
                    <span>{ach.target}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${ach.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.2 + (i * 0.1) }}
                      className="h-full rounded-full relative"
                      style={{ background: isDone ? `linear-gradient(90deg, ${accentColor}, #6366F1)` : 'var(--text-tertiary)' }}
                    >
                      {isDone && (
                        <motion.div
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 w-1/2 bg-white/20 skew-x-12"
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

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
          data-testid="welcome-start-btn"
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
    { icon: 'Home' as const, label: t('side_home'), active: true },
    { icon: 'User' as const, label: t('side_profile') },
    { icon: 'Trophy' as const, label: t('side_achievements'), locked: true },
    { icon: 'Settings' as const, label: t('side_settings') },
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState<Profile | null>(null)
  const [creating, setCreating] = useState<'local' | 'remote' | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradedPlan, setUpgradedPlan] = useState('pro')

  const {
    accentColor,
    lang,
    mounted,
    themeMode,
    userName,
    userAvatar,
    userAvatarColor,
    userAvatarType,
    setUserName
  } = useFeedbackStore()
  const t = useTranslator()
  const isRtl = lang === 'AR'
  const dir = isRtl ? 'rtl' : 'ltr'

  // Theme, Lang, and Accent are now handled by AppWrapper globally.

  // ── Detect upgrade=success param from Paddle redirect ──
  useEffect(() => {
    const upgradeParam = searchParams.get('upgrade')
    const planParam = searchParams.get('plan') ?? 'pro'
    if (upgradeParam === 'success') {
      setUpgradedPlan(planParam)
      setShowUpgrade(true)
      // Clear param from URL so refresh won't re-trigger
      const url = new URL(window.location.href)
      url.searchParams.delete('upgrade')
      url.searchParams.delete('plan')
      window.history.replaceState({}, '', url.toString())
      // Track upgrade in analytics
      track('pro_upgrade_completed', { plan: planParam as 'pro' | 'team', user_id: '' })
    }
  }, [searchParams])

  // Load profile
  useEffect(() => {
    async function load() {
      const user = await ensureAuthenticated()
      if (!user) { router.push('/auth/login'); return }
      try {
        const { data } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single()
        if (data) {
          setProfile(data)
          // Sync to store if empty
          if (!userName && data.display_name) setUserName(data.display_name)
          // Identify user in PostHog for funnel analysis
          identifyUser(user.id, { email: user.email, plan_type: data.plan_type ?? 'free', created_at: data.created_at })
        }
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
      track('session_created', { mode, user_id: user.id })
      router.push(`/game/setup/${session.id}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreating(null)
    }
  }, [supabase, router])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    resetAnalytics()
    router.push('/')
    toast.success(t('dash_logout_toast'))
  }, [supabase, router, t])

  if (!mounted) return null

  const userId = profile?.id ?? ''
  const userEmail = profile?.email ?? ''
  const isAdmin = isUserAdmin(userEmail)

  const finalName = userName || profile?.display_name || profile?.email?.split('@')[0] || '...'
  const finalAvatarBg = userAvatarType === 'color' ? userAvatarColor : (profile as any)?.avatar_bg_color || accentColor
  const finalAvatarType = userAvatarType || (profile?.avatar_url ? 'image' : 'color')
  const finalAvatarUrl = userAvatar || profile?.avatar_url

  const sidebarItems: { labelKey: Parameters<typeof t>[0]; iconKey: SidebarIconKey; active?: boolean; locked?: boolean; href?: string }[] = [
    { labelKey: 'side_home', iconKey: 'Home', active: true, href: '/dashboard' },
    { labelKey: 'side_profile', iconKey: 'User', href: '/dashboard/profile' },
    { labelKey: 'side_billing', iconKey: 'CreditCard', href: '/pricing' },
    { labelKey: 'side_friends', iconKey: 'Users', locked: true },
    { labelKey: 'side_achievements', iconKey: 'Trophy', href: '/dashboard/achievements' },
    { labelKey: 'side_daily', iconKey: 'Calendar', href: '/dashboard/daily' },
    { labelKey: 'side_store', iconKey: 'Store', href: '/dashboard/store' },
    { labelKey: 'side_settings', iconKey: 'Settings', href: '/dashboard/settings' },
  ]

  return (<>
    <AssetPreloader />
    <div
      className="min-h-screen flex overflow-hidden transition-colors duration-700"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        direction: dir,
        fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif'
      }}
    >
      {/* Root CSS variables are handled by AppWrapper */}

      {/* Animated background */}
      <DashboardBackground accentColor={accentColor} themeMode={themeMode} />


      {/* ══════════ SIDEBAR (desktop) ══════════ */}
      <motion.aside
        animate={{ width: collapsed ? 88 : 280 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 h-screen shrink-0 hidden lg:flex flex-col overflow-hidden transition-colors duration-700 border-l border-white/5"
        style={{
          background: 'var(--sidebar-bg)',
          [isRtl ? 'borderLeft' : 'borderRight']: '1px solid var(--border-subtle)',
          [isRtl ? 'borderRight' : 'borderLeft']: 'none',
          backdropFilter: 'blur(40px)'
        }}
      >
        {/* Inner Glass Glow (always on the side touching the main content) */}
        <div className={`absolute inset-y-0 ${isRtl ? 'left-0' : 'right-0'} w-px bg-gradient-to-b from-transparent via-white/5 to-transparent`} />

        {/* Logo Section */}
        <div className="flex items-center gap-4 p-7 shrink-0 relative overflow-hidden group/logo">
          <div
            className="w-11 h-11 rounded-[1.2rem] flex items-center justify-center text-base font-black text-white shrink-0 overflow-hidden shadow-2xl transition-all duration-500 group-hover/logo:scale-110 group-hover/logo:rotate-6"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #EC4899)`,
              boxShadow: `0 8px 24px ${accentColor}40`
            }}
          >
            <div className="w-full h-full relative">
              {finalAvatarType === 'image' && finalAvatarUrl ? (
                <Image src={finalAvatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">{finalName.charAt(0).toUpperCase()}</div>
              )}
            </div>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                <span className="font-black text-xl tracking-tighter text-white">العُريف</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 text-white">Platform v1.2</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar">
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
              onClick={() => item.href && router.push(item.href)}
            />
          ))}
        </nav>

        {/* Sidebar Footer Branding */}
        <div className="p-4 space-y-4">
          {/* Logout */}
          <motion.div
            whileHover={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-red-500/10 group"
          >
            <span className="shrink-0 text-red-500/40 group-hover:text-red-500 transition-colors"><Icon.LogOut /></span>
            {!collapsed && <span className="text-xs font-black uppercase tracking-widest text-red-500/40 group-hover:text-red-500">{t('side_logout')}</span>}
          </motion.div>

          {/* Version / Brand */}
          {!collapsed && (
            <div className="px-4 py-2 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between opacity-20">
                <span className="text-[8px] font-black uppercase tracking-widest">{isRtl ? 'إنتاج العُريف' : 'BY AL-AREEF'}</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-white" />
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              </div>
            </div>
          )}

          {/* Collapse Trigger (Floating Style) */}
          <button
            onClick={() => setCollapsed(p => !p)}
            className="w-full p-3 flex items-center justify-center transition-all hover:bg-white/5 rounded-2xl group"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              className="group-hover:scale-125 transition-transform"
            >
              {isRtl ? <Icon.ChevronLeft /> : <Icon.ChevronLeft />}
            </motion.div>
          </button>
        </div>
      </motion.aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0 relative z-10">


        {/* Page body */}
        <main className="flex-1 p-5 md:p-8 space-y-10 max-w-5xl w-full mx-auto pb-24 lg:pb-8">

          {/* ── Cinematic Aurora Command Center ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[3rem] p-px group mb-8"
            style={{
              background: `linear-gradient(135deg, ${accentColor}40, transparent, var(--border-strong))`,
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.3)'
            }}
          >
            {/* Ambient Aurora Glow (Behind Card) */}
            <div className="absolute -top-20 -left-20 w-48 h-48 blur-[80px] opacity-20 pointer-events-none" style={{ backgroundColor: accentColor }} />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 blur-[80px] opacity-20 pointer-events-none" style={{ backgroundColor: '#6366F1' }} />

            {/* HUD Scanning Layer */}
            <motion.div
              animate={{ x: isRtl ? ['120%', '-120%'] : ['-120%', '120%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-1/2 skew-x-12 pointer-events-none z-10"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)' }}
            />

            <div className={`relative overflow-hidden rounded-[2.9rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 transition-all duration-700 ${isRtl ? 'md:flex-row-reverse' : 'md:flex-row'}`}
              style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(60px)' }}>

              {/* Complex Background HUD Pattern */}
              <div className={`absolute inset-0 pointer-events-none select-none opacity-20`} style={{ color: 'var(--text-tertiary)', opacity: 0.05 }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid)" />
                  <circle cx={isRtl ? "10" : "90"} cy="10" r="20" stroke="currentColor" strokeWidth="0.05" fill="none" />
                </svg>
              </div>

              {/* 1. Identity & Bio-Sync Block */}
              <div className={`flex flex-col items-center md:items-${isRtl ? 'end' : 'start'} gap-6 relative z-20 shrink-0`}>
                {/* Multi-Ring Avatar HUD */}
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 rounded-full border border-indigo-500/10 border-dashed"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-8 rounded-full border border-indigo-500/5 border-dotted"
                  />

                  <div className="relative p-1.5 rounded-full border-2 border-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden shadow-2xl relative" style={{ backgroundColor: finalAvatarBg }}>
                      {finalAvatarType === 'image' && finalAvatarUrl ? (
                        <Image src={finalAvatarUrl} alt="Avatar" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white">
                          {finalName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Inner Glass Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    </div>
                    {/* Floating Level Hub */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg text-white text-[9px] font-black tracking-widest shadow-2xl border border-white/10"
                      style={{ backgroundColor: '#1E1B4B', boxShadow: `0 8px 20px rgba(0,0,0,0.5)` }}>
                      {isRtl ? 'المستوى ٢٤' : 'LVL 24'}
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. Massive Greeting Hub */}
              <div className={`flex-1 flex flex-col items-center md:items-${isRtl ? 'end' : 'start'} text-center md:text-${isRtl ? 'right' : 'left'} space-y-4 relative z-20`}>
                <div className="space-y-1">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/60"
                  >
                    {isRtl ? 'مرحباً بك مجدداً' : 'WELCOME BACK, ELITE'}
                  </motion.span>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {finalName}
                  </h1>
                </div>

              </div>

              {/* 3. Liquid Credit Portfolio Portfolio */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => router.push('/pricing')}
                className="relative group/credits cursor-pointer z-20 shrink-0"
              >
                <div className="p-6 md:p-8 rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden flex flex-col items-center md:items-start min-w-[240px]"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>

                  {/* Portfolio Glow Corner */}
                  <div className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} p-4 text-indigo-500/20 group-hover/credits:text-indigo-500/40 transition-colors`}>
                    <Icon.PlusCircle />
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400/40 mb-1">
                    {isRtl ? 'رصيد الجلسات' : 'SESSION CREDITS'}
                  </span>

                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                      {isAdmin ? '∞' : (profile?.session_credits ?? 0)}
                    </span>
                    <span className="text-xs font-black opacity-30 uppercase tracking-[0.15em]" style={{ color: 'var(--text-secondary)' }}>
                      {isAdmin ? (isRtl ? 'مشرف' : 'ELITE') : (isRtl ? 'جلسة' : 'SESS')}
                    </span>
                  </div>

                </div>
              </motion.div>
            </div>
          </motion.div>







          {/* Game Modes Section */}
          <div className="space-y-4">
            <SmartHeader
              title={isRtl ? 'أنماط اللعب' : 'Game Modes'}
              accentColor={accentColor}
              isRtl={isRtl}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <motion.div
                className="h-full flex"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <ActionCard
                  title={t('dash_local_title')}
                  desc={t('dash_local_desc')}
                  icon={<Icon.Gamepad />}
                  loading={creating === 'local'}
                  onClick={() => handleCreate('local')}
                  accentFrom={accentColor}
                  accentTo="#7C3AED"
                  accentGlow={`${accentColor}40`}
                  badge=""
                  lang={lang}
                />
              </motion.div>
              <motion.div
                className="h-full flex"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <ActionCard
                  title={t('dash_remote_title')}
                  desc={t('dash_remote_desc')}
                  icon={<Icon.Globe />}
                  loading={creating === 'remote'}
                  onClick={() => handleCreate('remote')}
                  accentFrom="#F59E0B"
                  accentTo="#D97706"
                  accentGlow="#F59E0B40"
                  badge=""
                  lang={lang}
                  comingSoon={true}
                />
              </motion.div>
            </div>
          </div>

          {/* Daily Challenge Section (WIDE) */}
          <div className="space-y-4">
            <SmartHeader
              title={isRtl ? 'تحدي اليوم' : 'Today\'s Challenge'}
              accentColor={accentColor}
              isRtl={isRtl}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              onClick={() => router.push('/dashboard/daily')}
              className={`relative p-8 md:p-10 rounded-[3rem] overflow-hidden group cursor-pointer border border-white/10 glass-card ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <div
                className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30"
                style={{ background: `linear-gradient(90deg, ${accentColor}, #F59E0B)` }}
              />
              <div className={`relative z-10 flex flex-col ${isRtl ? 'md:flex-row' : 'md:flex-row-reverse'} items-center justify-between gap-8`}>
                <div className={`flex-1 text-center ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto ${isRtl ? 'md:mr-0 md:ml-auto' : 'md:ml-0 md:mr-auto'}`}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#F59E0B' }}
                  >
                    <Icon.Trophy />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
                    {isRtl ? 'اختبر حدود ذكائك الآن' : 'Test Your Limits Now'}
                  </h3>
                  <p className="text-sm md:text-base opacity-60 font-medium max-w-xl">
                    {isRtl
                      ? 'سؤال واحد فائق الصعوبة يومياً. هل تملك الشجاعة الكافية لمواجهة تحدي اليوم؟ مكافآت ضخمة بانتظارك.'
                      : 'One extremely difficult question per day. Do you have the courage to face today\'s challenge? Massive rewards await.'}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-xl group-hover:scale-110 transition-transform">
                    {isRtl ? 'ابدأ الآن' : 'Start Now'}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: '#F59E0B' }}>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
                    {isRtl ? 'فرصة واحدة فقط' : 'Only One Chance'}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Studio Section (WIDE) */}
          <div className="space-y-4">
            <SmartHeader
              title={isRtl ? 'استوديو الإبداع' : 'Creator Studio'}
              accentColor="#D4AF37"
              isRtl={isRtl}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.01 }}
              onClick={() => router.push('/dashboard/studio')}
              className={`relative p-8 md:p-12 rounded-[3rem] overflow-hidden group cursor-pointer border border-[#D4AF37]/20 glass-card transition-all duration-700 shadow-2xl hover:shadow-[0_40px_100px_-20px_rgba(212,175,55,0.3)] ${isRtl ? 'text-right' : 'text-left'}`}
            >
              {/* Animated Aurora Background */}
              <div
                className="absolute inset-0 opacity-10 transition-opacity duration-1000 group-hover:opacity-30 pointer-events-none"
                style={{ background: `linear-gradient(135deg, #D4AF37, #A17B00, transparent)` }}
              />
              <motion.div
                animate={{
                  x: [0, 40, -40, 0],
                  y: [0, -40, 40, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute top-[-50%] right-[-10%] w-[80%] h-[150%] rounded-full opacity-20 pointer-events-none blur-[100px]"
                style={{ background: `radial-gradient(circle, #D4AF37, transparent 70%)` }}
              />

              <div className={`relative z-10 flex flex-col ${isRtl ? 'md:flex-row' : 'md:flex-row-reverse'} items-center justify-between gap-10`}>
                <div className={`flex-1 ${isRtl ? 'md:text-right' : 'md:text-left'} text-center`}>
                  <div className="flex items-center gap-4 mb-6 justify-center md:justify-start" style={{ flexDirection: isRtl ? 'row' : 'row-reverse' }}>
                     <div
                       className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-2xl"
                       style={{ background: 'linear-gradient(135deg, #D4AF37, #A17B00)', color: 'white', boxShadow: '0 10px 30px rgba(212,175,55,0.4)' }}
                     >
                       🎭
                     </div>
                  </div>
                  
                  <h3 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {isRtl ? 'حكاياتك، قوانينك، مسرحك الخاص!' : 'Your Stories, Your Rules, Your Stage!'}
                  </h3>
                  <p className="text-base md:text-lg opacity-60 font-medium max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {isRtl
                      ? 'لأن أفضل الأسئلة هي التي نعيشها.. حوّل ذكريات الشلة ومواقف العائلة إلى تحديات ملحمية. ارفع صوركم الخاصة، واكتب أسئلة يعرف إجابتها فقط من كان هناك. اجعل كل جلسة قصة لا تُنسى.'
                      : 'Because the best trivia is the one you lived! Turn inside jokes and family moments into epic challenges. Upload your own photos and create questions only your crew can answer. Make every session an unforgettable story.'}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4 shrink-0">
                  <div className="px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm text-black transition-all group-hover:scale-105 flex items-center gap-3 shadow-2xl shadow-[#D4AF37]/30"
                       style={{ background: 'linear-gradient(135deg, #D4AF37, #FDE047)' }}>
                    {isRtl ? 'ادخل الاستوديو' : 'ENTER STUDIO'}
                    <span className="text-xl">✨</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Custom Creations Library */}
          <CreationsLibrary isRtl={isRtl} lang={lang} />

          {/* Achievements Section */}
          <AchievementsSection isRtl={isRtl} accentColor={accentColor} profile={profile} router={router} />


        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav accentColor={accentColor} onLogout={handleLogout} />
    </div>

    {/* ── UPGRADE SUCCESS OVERLAY ── */}
    <AnimatePresence>
      {showUpgrade && (
        <UpgradeSuccessOverlay
          plan={upgradedPlan}
          accentColor={accentColor}
          onDismiss={() => setShowUpgrade(false)}
        />
      )}
    </AnimatePresence>
  </>)
}
