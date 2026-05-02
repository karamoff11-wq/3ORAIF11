'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { MascotState } from '@/types/game'

// Standardized team color palette
export const TEAM_PALETTE = [
  { color: '#FF3B3B', glow: 'rgba(255,59,59,0.6)',   dark: '#8B0000', label: 'أحمر'   },
  { color: '#3B82F6', glow: 'rgba(59,130,246,0.6)',  dark: '#1E3A8A', label: 'أزرق'   },
  { color: '#A855F7', glow: 'rgba(168,85,247,0.6)',  dark: '#4C1D95', label: 'بنفسجي' },
  { color: '#22C55E', glow: 'rgba(34,197,94,0.6)',   dark: '#14532D', label: 'أخضر'   },
]

interface Props {
  state?: MascotState
  size?: number
  className?: string
  isTalking?: boolean
  color?: string  // Base team color e.g. '#FF3B3B'
  expandBody?: boolean
}

export default function Mascot({
  state = 'idle',
  size = 160,
  className = '',
  isTalking = false,
  color = '#3B82F6',
  expandBody = false,
}: Props) {
  const [mouthOpen, setMouthOpen] = useState(false)
  const uid = color.replace('#', 'c')

  // Derive dark variant for gradient end stop
  const palette = TEAM_PALETTE.find(p => p.color.toLowerCase() === color.toLowerCase())
  const darkColor = palette?.dark || '#000000'

  useEffect(() => {
    if (!isTalking) { setMouthOpen(false); return }
    const interval = setInterval(() => setMouthOpen(p => !p), 130)
    return () => clearInterval(interval)
  }, [isTalking])

  const containerVariants: any = {
    idle:       { y: [0, -5, 0],         transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
    correct:    { y: [0, -22, 0, -10, 0], scale: [1, 1.08, 1], transition: { duration: 0.6 } },
    wrong:      { x: [-8, 8, -8, 8, 0],   transition: { duration: 0.4 } },
    punishment: { rotate: [-6, 6, -6, 6, 0], scale: [1, 0.92, 1], transition: { duration: 0.45 } },
    thinking:   { x: [0, -4, 0], y: [0, -3, 0], transition: { duration: 2.2, repeat: Infinity } },
    hype:       { y: [0, -24, 0], scale: [1, 1.1, 1], transition: { duration: 0.38, repeat: Infinity } },
    angry:      { scale: [1, 1.05, 1], y: [0, -2, 0], transition: { duration: 0.22, repeat: Infinity, repeatType: 'mirror' as any } },
  }


  const eyebrowV: any = {
    idle:       { y: 0, rotate: 0 },
    correct:    { y: -5, rotate: 0 },
    wrong:      { y: 3, rotate: 0 },
    punishment: { y: 4, rotate: 14 },
    thinking:   { y: [-1, 2, -1], rotate: [-3, 3, -3], transition: { repeat: Infinity, duration: 2 } },
    hype:       { y: -7, rotate: 0 },
    angry:      { y: 4, rotate: 18 },
  }

  // Limb / feature stroke color — always near-black for minimalist doodle look
  const INK = '#111111'

  return (
    <motion.div
      key={state}
      variants={containerVariants}
      animate={state}
      className={`relative flex items-end justify-center select-none ${className}`}
      style={{ width: size, height: size * 1.28 }}
    >
      <svg width="100%" height="100%" viewBox="0 0 200 256" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
        <defs>
          {/* 3-stop radial gradient: bright highlight → vivid base → deep dark */}
          <radialGradient id={`bg-${uid}`} cx="35%" cy="28%" r="75%">
            <stop offset="0%"   stopColor="white"     stopOpacity="0.6" />
            <stop offset="45%"  stopColor={color}     stopOpacity="1" />
            <stop offset="100%" stopColor={darkColor}  stopOpacity="1" />
          </radialGradient>
          {/* Extra vivid inner glow */}
          <radialGradient id={`vg-${uid}`} cx="40%" cy="32%" r="55%">
            <stop offset="0%"   stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor={color} floodOpacity="0.7" />
          </filter>
        </defs>



        {/* ── PERFECT CIRCLE BODY ── vivid radial gradient */}
        <motion.circle cx="100" cy="104" r="70" fill={`url(#bg-${uid})`} filter={`url(#glow-${uid})`} 
          animate={expandBody ? { scale: 80 } : { scale: 1 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: '100px', originY: '104px' }}
        />
        {/* Extra inner glow layer for vividness */}
        <motion.circle cx="100" cy="104" r="70" fill={`url(#vg-${uid})`} 
          animate={expandBody ? { scale: 80 } : { scale: 1 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: '100px', originY: '104px' }}
        />
        {/* Subtle dark outline */}
        <motion.circle cx="100" cy="104" r="70" stroke={INK} strokeWidth="1.5" strokeOpacity="0.12" fill="none" 
          animate={expandBody ? { scale: 80, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: '100px', originY: '104px' }}
        />

        <motion.g animate={{ opacity: expandBody ? 0 : 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
        {/* ── EYES ── */}
        {state === 'correct' || state === 'hype' ? (
          /* Happy arcs */
          <>
            <path d="M76 100 Q85 90 94 100" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M106 100 Q115 90 124 100" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </>
        ) : state === 'wrong' || state === 'punishment' ? (
          /* X eyes */
          <>
            <path d="M74 93 L90 107 M90 93 L74 107" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M110 93 L126 107 M126 93 L110 107" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          </>
        ) : state === 'angry' ? (
          /* Squinted slits */
          <>
            <path d="M75 102 Q84 106 93 102" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M107 102 Q116 106 125 102" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        ) : state === 'thinking' ? (
          /* One squinted, one dot */
          <>
            <path d="M75 102 Q84 106 93 102" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="116" cy="100" r="6" fill={INK} />
          </>
        ) : (
          /* Normal dots with blink */
          <>
            <circle cx="84" cy="100" r="6" fill={INK} />
            <circle cx="116" cy="100" r="6" fill={INK} />
            <motion.rect x="78" y="94" width="12" height="12" fill={color} rx="6"
              animate={{ scaleY: [0, 1, 0] }}
              transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 4 }}
              style={{ transformOrigin: '84px 100px' }}
            />
            <motion.rect x="110" y="94" width="12" height="12" fill={color} rx="6"
              animate={{ scaleY: [0, 1, 0] }}
              transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 4 }}
              style={{ transformOrigin: '116px 100px' }}
            />
          </>
        )}

        {/* ── EYEBROWS ── */}
        <motion.g variants={eyebrowV} animate={state} style={{ originX: '100px', originY: '88px' }}>
          {state === 'angry' ? (
            <>
              <path d="M72 86 Q83 79 94 85" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M106 85 Q117 79 128 86" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <path d="M74 87 Q84 82 94 87" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M106 87 Q116 82 126 87" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          )}
        </motion.g>

        {/* ── MOUTH ── */}
        {mouthOpen ? (
          <ellipse cx="100" cy="126" rx="9" ry="7.5" fill={INK} />
        ) : state === 'correct' || state === 'hype' ? (
          <path d="M82 122 Q100 142 118 122 Z" fill={INK} />
        ) : state === 'wrong' || state === 'punishment' ? (
          <path d="M84 132 Q100 120 116 132" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        ) : state === 'angry' ? (
          <line x1="85" y1="127" x2="115" y2="127" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        ) : state === 'thinking' ? (
          <circle cx="100" cy="126" r="5" stroke={INK} strokeWidth="3" fill="none" />
        ) : (
          <path d="M86 124 Q100 134 114 124" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        )}
        </motion.g>

      </svg>

      {/* Reaction glow burst */}
      {(state === 'correct' || state === 'hype') && (
        <motion.div
          className="absolute inset-0 rounded-full z-[-1] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${palette?.glow || color + '80'} 0%, transparent 65%)` }}
          animate={{ scale: [1, 1.9], opacity: [0.85, 0] }}
          transition={{ duration: 0.7, repeat: state === 'hype' ? Infinity : 1 }}
        />
      )}
    </motion.div>
  )
}
