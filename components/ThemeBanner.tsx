'use client'
// ─── components/ThemeBanner.tsx ───────────────────────────────────────────────
// Slides in from the top when a user arrives via a special ?theme= link.
// Automatically reverts after COUNTDOWN_SECONDS if the user takes no action.

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

const COUNTDOWN_SECONDS = 15

export default function ThemeBanner() {
  const { theme, isFromSpecialLink, keepTheme, revertTheme } = useTheme()
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset + start countdown whenever banner becomes visible
  useEffect(() => {
    if (!isFromSpecialLink) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    setSeconds(COUNTDOWN_SECONDS)

    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          revertTheme()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isFromSpecialLink, revertTheme])

  // Arc progress for the countdown ring
  const radius = 10
  const circumference = 2 * Math.PI * radius
  const progress = (seconds / COUNTDOWN_SECONDS) * circumference

  return (
    <AnimatePresence>
      {isFromSpecialLink && (
        <motion.div
          key="theme-banner"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="fixed top-3 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
        >
          <div
            className="pointer-events-auto flex items-center gap-4 rounded-2xl border px-5 py-3.5
                       backdrop-blur-2xl shadow-2xl w-full max-w-xl"
            style={{
              backgroundColor: `${theme.colors.surface}E0`,
              borderColor: theme.colors.borderGlow,
              boxShadow: theme.colors.glow,
            }}
          >
            {/* ── Theme icon ─────────────────────────────────────────── */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${theme.colors.primary}22` }}
            >
              {theme.emoji}
            </div>

            {/* ── Labels ─────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight" style={{ color: theme.colors.text }}>
                {theme.name} Theme
              </p>
              <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                {theme.descriptionAr} — هل تريد الاحتفاظ به؟
              </p>
            </div>

            {/* ── Countdown ring ─────────────────────────────────────── */}
            <svg width="28" height="28" className="flex-shrink-0 -rotate-90">
              <circle
                cx="14" cy="14" r={radius}
                fill="none"
                stroke={`${theme.colors.primary}33`}
                strokeWidth="2.5"
              />
              <circle
                cx="14" cy="14" r={radius}
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <text
                x="14" y="14"
                textAnchor="middle"
                dominantBaseline="central"
                className="rotate-90"
                fontSize="8"
                fill={theme.colors.primary}
                style={{ transform: 'rotate(90deg)', transformOrigin: '14px 14px' }}
              >
                {seconds}
              </text>
            </svg>

            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={revertTheme}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  color: theme.colors.textMuted,
                  backgroundColor: `${theme.colors.border}99`,
                }}
              >
                تجاهل
              </button>
              <button
                onClick={keepTheme}
                className="text-xs px-4 py-1.5 rounded-lg font-semibold transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                  color: '#fff',
                  boxShadow: `0 2px 12px ${theme.colors.primary}44`,
                }}
              >
                احتفظ بالثيم ✓
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
