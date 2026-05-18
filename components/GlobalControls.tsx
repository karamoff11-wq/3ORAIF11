'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useState, useRef } from 'react'
import { ASSETS } from '@/lib/constants'

export default function GlobalControls() {
  const { themeMode, setThemeMode, lang, setLang, accentColor, mounted } = useFeedbackStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const toggleSound = () => {
    if (!audioRef.current) return
    audioRef.current.volume = 0.25
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error("Playback blocked or failed:", err)
            // Fallback immediately on play failure
            if (audioRef.current) {
              audioRef.current.src = ASSETS.AUDIO.FALLBACK_BGM
              audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(() => { /* Fallback also failed — silent */ })
            }
          })
      }
    }
  }

  if (!mounted) return null

  const isRtl = lang === 'AR'

  return (
    <div className={`fixed bottom-8 ${isRtl ? 'left-8 items-start' : 'right-8 items-end'} z-[9999] flex flex-col gap-3 transition-all duration-500`}>
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

            {/* Premium Animated Theme Switch (Galahhad Uiverse) */}
            <div className="flex items-center justify-center p-2 rounded-2xl bg-white/5 border border-white/5 my-1">
              <label className="theme-switch cursor-pointer" title={lang === 'AR' ? 'تبديل المظهر' : 'Toggle Theme'}>
                <input 
                  type="checkbox" 
                  className="theme-switch__checkbox" 
                  checked={themeMode === 'dark'} 
                  onChange={(e) => setThemeMode(e.target.checked ? 'dark' : 'light')} 
                />
                <div className="theme-switch__container">
                  <div className="theme-switch__clouds" />
                  <div className="theme-switch__stars-container">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
                      <path fill="currentColor" d="M112.827 16.5517C111.954 12.0298 107.545 9.0768 103.023 9.94978C98.5015 10.8228 95.5485 15.2315 96.4215 19.7534C97.2945 24.2753 101.703 27.2283 106.225 26.3553C110.747 25.4824 113.7 21.0736 112.827 16.5517ZM106.918 22.8465C104.093 23.3923 101.338 21.5466 100.792 18.7214C100.246 15.8962 102.092 13.1408 104.917 12.595C107.742 12.0492 110.498 13.8949 111.043 16.7201C111.589 19.5453 109.743 22.3007 106.918 22.8465Z"/>
                      <polygon fill="currentColor" points="26,0 27.5,4 31.5,5.5 27.5,7 26,11 24.5,7 20.5,5.5 24.5,4 "/>
                      <polygon fill="currentColor" points="66,20 67,22.5 69.5,23.5 67,24.5 66,27 65,24.5 62.5,23.5 65,22.5 "/>
                      <polygon fill="currentColor" points="12,35 13,37.5 15.5,38.5 13,39.5 12,42 11,39.5 8.5,38.5 11,37.5 "/>
                    </svg>
                  </div>
                  <div className="theme-switch__circle-container">
                    <div className="theme-switch__sun-moon-container">
                      <div className="theme-switch__moon">
                        <div className="theme-switch__spot" />
                        <div className="theme-switch__spot" />
                        <div className="theme-switch__spot" />
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border ${isPlaying ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30 hover:text-white/60 border-white/5'}`}
              style={{ borderColor: isPlaying ? `${accentColor}40` : undefined, background: isPlaying ? accentColor : undefined }}
            >
              <div className="flex gap-[2px] items-center h-3 shrink-0">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: isPlaying ? [3, 11, 3] : 3, opacity: isPlaying ? [0.4, 1, 0.4] : 0.3 }}
                    transition={{ duration: 0.5 + i * 0.1, repeat: Infinity }}
                    className="w-[1.5px] rounded-full bg-current"
                  />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isPlaying ? (lang === 'AR' ? 'كتم الصوت' : 'Mute') : (lang === 'AR' ? 'تشغيل الصوت' : 'Play Sound')}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <audio 
        ref={audioRef} 
        src={ASSETS.AUDIO.PRIMARY_BGM} 
        loop 
        onError={() => {
          if (audioRef.current) {
            audioRef.current.src = ASSETS.AUDIO.FALLBACK_BGM;
          }
        }}
      />
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl relative overflow-hidden group border"
        style={{ 
          background: 'var(--glass-card-bg)',
          borderColor: isOpen ? accentColor : 'var(--glass-card-border)',
          backdropFilter: 'var(--glass-blur)',
          boxShadow: isOpen ? `0 0 30px ${accentColor}20, inset 0 0 20px ${accentColor}10` : 'var(--shadow-card)',
        }}
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" 
          style={{ background: `radial-gradient(circle at center, ${accentColor}25, transparent 70%)` }}
        />
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <motion.div animate={{ rotate: isOpen ? 90 : 0, scale: isOpen ? 0.9 : 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="relative z-10 flex items-center justify-center w-full h-full text-white/80 group-hover:text-white transition-colors">
          {isOpen ? (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M6 4v4" />
              <path d="M6 12v8" />
              <path d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M12 4v10" />
              <path d="M12 18v2" />
              <path d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M18 4v1" />
              <path d="M18 9v11" />
            </svg>
          )}
        </motion.div>
      </button>
    </div>
  )
}