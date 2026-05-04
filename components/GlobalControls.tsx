'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useState } from 'react'

export default function GlobalControls() {
  const { themeMode, setThemeMode, lang, setLang, accentColor, mounted } = useFeedbackStore()
  const [isOpen, setIsOpen] = useState(false)

  if (!mounted) return null

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col gap-2 p-3 rounded-3xl bg-[#0F0F2D]/80 backdrop-blur-2xl border border-white/10 shadow-2xl mb-2"
          >
            {/* Lang Toggle */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/5">
              {['AR', 'EN'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l as any)}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${lang === l ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                  style={{ background: lang === l ? accentColor : undefined }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/5">
              {[
                { id: 'light', icon: '☀️' },
                { id: 'dark', icon: '🌙' },
                { id: 'system', icon: '💻' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setThemeMode(m.id as any)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all ${themeMode === m.id ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                  style={{ background: themeMode === m.id ? accentColor : undefined }}
                >
                  {m.icon}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95 shadow-2xl relative overflow-hidden group border"
        style={{ 
          background: 'rgba(15, 15, 45, 0.8)',
          borderColor: isOpen ? accentColor : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
          {isOpen ? '✕' : '⚙️'}
        </motion.span>
      </button>
    </div>
  )
}