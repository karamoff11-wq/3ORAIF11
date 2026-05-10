'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useFeedbackStore } from '@/store/feedbackStore'

const COOKIE_KEY = 'al-arif-cookie-consent'

export default function CookieBanner() {
  const { accentColor, lang, themeMode } = useFeedbackStore()
  const isRtl  = lang === 'AR'
  const isDark = themeMode !== 'light'
  const [visible, setVisible] = useState(false)

  // Only show after hydration + if not yet consented
  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) {
        // Small delay so it doesn't flash on initial paint
        const t = setTimeout(() => setVisible(true), 1200)
        return () => clearTimeout(t)
      }
    } catch {}
  }, [])

  const accept = () => {
    try { localStorage.setItem(COOKIE_KEY, 'accepted') } catch {}
    setVisible(false)
  }

  const decline = () => {
    try { localStorage.setItem(COOKIE_KEY, 'declined') } catch {}
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed bottom-5 inset-x-4 z-[9999] flex justify-center pointer-events-none"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div
            className="pointer-events-auto w-full max-w-2xl rounded-3xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
            style={{
              background:    isDark ? 'rgba(12,12,26,0.92)' : 'rgba(255,255,255,0.95)',
              border:        `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
              backdropFilter:'blur(28px)',
              boxShadow:     isDark
                ? `0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`
                : `0 8px 48px rgba(0,0,0,0.12)`,
            }}
          >
            {/* Icon */}
            <span className="text-3xl shrink-0 select-none">🍪</span>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-relaxed"
                style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#1e1e2e' }}>
                {isRtl
                  ? 'نستخدم ملفات الارتباط الضرورية لتشغيل المنصة وتحسين تجربتك.'
                  : 'We use essential cookies to operate the platform and improve your experience.'}
                {' '}
                <Link
                  href="/legal/privacy"
                  className="font-black underline underline-offset-2 hover:no-underline transition-all"
                  style={{ color: accentColor }}
                >
                  {isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </Link>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={decline}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                style={{
                  color:      isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  border:     `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                }}
              >
                {isRtl ? 'رفض' : 'Decline'}
              </button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={accept}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, #EC4899)`,
                  boxShadow:  `0 6px 20px ${accentColor}40`,
                }}
              >
                {isRtl ? 'قبول' : 'Accept'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
