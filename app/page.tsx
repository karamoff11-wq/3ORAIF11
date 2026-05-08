'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator, createTranslator } from '@/lib/i18n'
import { ASSETS } from '@/lib/constants'
import { QUIZ_QUESTIONS } from '@/lib/quiz'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type ThemeMode = 'dark' | 'light' | 'system'

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
// Quiz moved to lib/quiz.ts

const ARABIC_FLAGS = ['sa','ae','kw','qa','bh','om','eg','jo','lb','ps','iq','ye','ly','dz','ma','tn','sd','sy','so','mr','dj','km']

const SOCIALS = [
  { key: 'social_facebook' as const, icon: '🔵', href: '#' },
  { key: 'social_youtube'  as const, icon: '🔴', href: '#' },
  { key: 'social_instagram'as const, icon: '📸', href: '#' },
  { key: 'social_twitter'  as const, icon: '🐦', href: '#' },
]

const ORBITAL_DATA = [
  { key: 'orb_knowledge'   as const, color: '#8B5CF6', icon: BrainIcon   },
  { key: 'orb_challenge'   as const, color: '#EC4899', icon: TargetIcon  },
  { key: 'orb_achievement' as const, color: '#F59E0B', icon: TrophyIcon  },
  { key: 'orb_play'        as const, color: '#3B82F6', icon: PlayIcon    },
]

// ─────────────────────────────────────────────
// MINIMAL LINE ICONS (no emojis)
// ─────────────────────────────────────────────
function BrainIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2a2.5 2.5 0 0 1 5 0v.5"/>
      <path d="M14.5 2.5a4 4 0 0 1 4 4v1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2v1a4 4 0 0 1-4 4H9.5a4 4 0 0 1-4-4v-1a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2V7a4 4 0 0 1 4-4.5"/>
      <line x1="12" y1="6" x2="12" y2="12"/>
      <line x1="9" y1="9" x2="15" y2="9"/>
    </svg>
  )
}

function TargetIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
      <line x1="22" y1="12" x2="18" y2="12"/>
      <line x1="6" y1="12" x2="2" y2="12"/>
      <line x1="12" y1="6" x2="12" y2="2"/>
      <line x1="12" y1="22" x2="12" y2="18"/>
    </svg>
  )
}

function TrophyIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  )
}

function PlayIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/>
      <path d="M6 12h.01M18 12h.01"/>
    </svg>
  )
}

// ─────────────────────────────────────────────
// LIVING PLANET COMPONENT
// CSS/SVG hybrid — no Three.js, premium feel
// ─────────────────────────────────────────────
function LivingPlanet() {
  const { accentColor, themeMode, lang } = useFeedbackStore()
  const t = useTranslator()
  const [activeOrb, setActiveOrb] = useState<number | null>(null)
  const [energyProgress, setEnergyProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const prefersReduced = useReducedMotion()
  const isLight = themeMode === 'light'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (activeOrb === null) { setEnergyProgress(0); return }
    const id = setInterval(() => setEnergyProgress(p => (p + 2) % 101), 16)
    return () => clearInterval(id)
  }, [activeOrb])

  // Elliptical orbit positions — each moon has unique orbit parameters
  const orbits = [
    { rx: 170, ry: 90,  speed: 28, offset: 0   },  // Knowledge
    { rx: 200, ry: 110, speed: 36, offset: 90  },  // Challenge
    { rx: 155, ry: 85,  speed: 22, offset: 180 },  // Achievement
    { rx: 185, ry: 100, speed: 32, offset: 270 },  // Play
  ]

  const activeColor = activeOrb !== null ? ORBITAL_DATA[activeOrb].color : accentColor

  return (
    <div className="relative flex items-center justify-center" style={{ width: 440, height: 440 }}>

      {/* ── Ambient background glow ── */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${activeColor}18 0%, transparent 70%)`,
          filter: 'blur(40px)',
          transform: 'scale(1.3)',
        }}
      />

      {/* ── Particle dust (CSS only, GPU-friendly) ── */}
      {mounted && !prefersReduced && [...Array(12)].map((_, i) => {
        const style = {
          width: (Math.sin(i) * 1.5 + 2.5) + 'px',
          height: (Math.sin(i) * 1.5 + 2.5) + 'px',
          background: `${activeColor}60`,
          top: `${25 + (Math.cos(i) * 30 + 30)}%`,
          left: `${20 + (Math.sin(i * 2) * 30 + 30)}%`,
          opacity: 0.4 + (Math.abs(Math.sin(i * 3)) * 0.3),
          animation: `float-particle ${8 + i * 1.3}s ease-in-out infinite`,
          animationDelay: `${i * 0.7}s`,
        }
        return (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={style}
          />
        )
      })}

      {/* ── Orbiting Moons ── */}
      {ORBITAL_DATA.map((orb, i) => {
        const o = orbits[i]
        const isActive = activeOrb === i
        const Icon = orb.icon

        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ width: o.rx * 2, height: o.ry * 2, top: '50%', left: '50%', x: '-50%', y: '-50%' }}
            animate={prefersReduced ? {} : { rotate: 360 }}
            transition={{ duration: o.speed, repeat: Infinity, ease: 'linear', delay: -(o.offset / 360) * o.speed }}
          >
            {/* Orbit path ring */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: isActive ? 0.25 : 0.08 }}>
              <ellipse
                cx="50%" cy="50%"
                rx={`${(o.rx / (o.rx * 2)) * 100}%`}
                ry={`${(o.ry / (o.ry * 2)) * 100}%`}
                fill="none"
                stroke={isActive ? orb.color : 'white'}
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            </svg>

            {/* Moon positioned at top of ellipse */}
            <motion.button
              className="absolute"
              style={{ top: 0, left: '50%', x: '-50%', y: '-50%' }}
              animate={prefersReduced ? {} : { rotate: -360 }}
              transition={{ duration: o.speed, repeat: Infinity, ease: 'linear', delay: -(o.offset / 360) * o.speed }}
              onHoverStart={() => setActiveOrb(i)}
              onHoverEnd={() => setActiveOrb(null)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div
                className="relative flex flex-col items-center gap-2 cursor-pointer"
                style={{ width: 72 }}
              >
                {/* Moon sphere */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500"
                  style={{
                    background: isActive
                      ? `radial-gradient(circle at 35% 35%, ${orb.color}40, ${orb.color}15)`
                      : isLight
                        ? 'rgba(255,255,255,0.75)'
                        : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? orb.color + '60' : isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: isActive
                      ? `0 0 24px ${orb.color}50, inset 0 1px 0 rgba(255,255,255,0.2)`
                      : isLight
                        ? '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)'
                        : '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Icon size={20} color={isActive ? orb.color : isLight ? '#6b7280' : 'rgba(255,255,255,0.5)'} />
                </div>

                {/* Label */}
                <span
                  className="text-[11px] font-black tracking-wide whitespace-nowrap transition-all duration-300"
                  style={{
                    color: isActive ? orb.color : 'var(--text-secondary)',
                    textShadow: isActive ? `0 0 12px ${orb.color}80` : 'none',
                  }}
                >
                  {t(orb.key)}
                </span>
              </div>
            </motion.button>
          </motion.div>
        )
      })}

      {/* ── Energy Link Line (SVG) ── */}
      <AnimatePresence>
        {activeOrb !== null && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 5 }}>
            <defs>
              <linearGradient id="energy-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={activeColor} stopOpacity="0" />
                <stop offset={`${energyProgress}%`} stopColor={activeColor} stopOpacity="1" />
                <stop offset="100%" stopColor={activeColor} stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <motion.line
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              x1="50%" y1="15%"
              x2="50%" y2="50%"
              stroke={`url(#energy-line)`}
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          </svg>
        )}
      </AnimatePresence>

      {/* ── CENTER PLANET ── */}
      <motion.div
        className="relative z-10"
        animate={prefersReduced ? {} : {
          scale: [1, 1.025, 1],
          filter: [
            `drop-shadow(0 0 20px ${activeColor}30)`,
            `drop-shadow(0 0 40px ${activeColor}50)`,
            `drop-shadow(0 0 20px ${activeColor}30)`,
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 148, height: 148 }}
      >
        {/* Outer glow ring */}
        <div
          className="absolute inset-[-16px] rounded-full pointer-events-none transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${activeColor}20 0%, transparent 65%)`,
            filter: 'blur(16px)',
          }}
        />

        {/* Planet sphere */}
        <div
          className="w-full h-full rounded-full relative overflow-hidden transition-all duration-1000"
          style={{
            background: isLight
              ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), ${activeColor}18 50%, rgba(240,235,255,0.9))`
              : `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12), ${activeColor}22 50%, #0d0d2e)`,
            border: isLight
              ? `1px solid rgba(255,255,255,0.9)`
              : `1px solid rgba(255,255,255,0.1)`,
            boxShadow: isLight
              ? `0 8px 40px ${activeColor}25, inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -4px 16px ${activeColor}15`
              : `0 8px 40px ${activeColor}30, inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -4px 16px rgba(0,0,0,0.4)`,
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Internal animated gradient */}
          <motion.div
            className="absolute inset-0 rounded-full opacity-60"
            animate={prefersReduced ? {} : { rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              background: `conic-gradient(from 0deg, ${activeColor}35, transparent 40%, #EC489920 60%, transparent 80%, ${activeColor}20)`,
            }}
          />

          {/* Shimmer highlight */}
          <div
            className="absolute top-[12%] left-[18%] w-[35%] h-[22%] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 70%)',
              transform: 'rotate(-20deg)',
            }}
          />

          {/* Center mark */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={prefersReduced ? {} : { opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: isLight ? activeColor : 'rgba(255,255,255,0.3)',
                boxShadow: `0 0 12px ${activeColor}80`,
              }}
            />
          </div>
        </div>

        {/* Rim glow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700"
          style={{
            boxShadow: `0 0 0 1px ${activeColor}40, 0 0 32px ${activeColor}25`,
          }}
        />
      </motion.div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          33%       { transform: translateY(-12px) translateX(6px); opacity: 0.6; }
          66%       { transform: translateY(8px) translateX(-8px); opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────
// VERTICAL ROADMAP
// ─────────────────────────────────────────────
function VerticalRoadmap() {
  const { roadmapNodes, accentColor } = useFeedbackStore()
  const t = useTranslator()

  return (
    <section className="relative z-10 px-6 md:px-16 py-28">
      <div className="text-center mb-20">
        <p className="text-xs font-black tracking-[0.35em] uppercase mb-4" style={{ color: accentColor }}>
          {t('roadmap_sub')}
        </p>
        <h2 className="text-4xl md:text-6xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
          {t('roadmap_title')}{' '}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, #EC4899)` }}>
            {t('roadmap_title2')}
          </span>
        </h2>
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Connecting line */}
        <div
          className="absolute right-[28px] top-8 bottom-8 w-[2px] md:right-1/2 md:translate-x-px"
          style={{ background: `linear-gradient(to bottom, transparent, ${accentColor}50, transparent)` }}
        />

        {roadmapNodes.map((node, i) => {
          const isRight = i % 2 === 0
          const label = t(`roadmap_node${i+1}_label` as any) || node.label
          const desc = t(`roadmap_node${i+1}_desc` as any) || node.desc
          
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isRight ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-start gap-6 mb-12 last:mb-0"
              style={{ flexDirection: isRight ? 'row' : 'row-reverse', textAlign: isRight ? 'right' : 'left' }}
            >
              {/* Node dot */}
              <div className="relative flex-shrink-0 z-10" style={{ width: 56, height: 56 }}>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700"
                  style={{
                    background: node.completed
                      ? `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`
                      : 'var(--bg-card)',
                    border: `1.5px solid ${node.completed ? accentColor + '50' : 'var(--border-card)'}`,
                    boxShadow: node.completed ? `0 0 20px ${accentColor}30` : 'none',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {node.completed ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-3 h-3 rounded-full"
                      style={{ background: accentColor, boxShadow: `0 0 10px ${accentColor}` }}
                    />
                  ) : (
                    <span className="text-lg font-black" style={{ color: 'var(--text-tertiary)' }}>
                      {i + 1}
                    </span>
                  )}
                </div>
              </div>

              {/* Content card */}
              <div
                className="flex-1 rounded-2xl p-6 glass-card group hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3" style={{ flexDirection: isRight ? 'row-reverse' : 'row', justifyContent: isRight ? 'flex-end' : 'flex-start' }}>
                  <h3
                    className="text-base font-black transition-all"
                    style={{ color: node.completed ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {label}
                  </h3>
                  {node.completed && (
                    <span
                      className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
                      style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
                    >
                      {t('roadmap_done')}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {desc}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// QUIZ
// ─────────────────────────────────────────────
function InteractiveQuiz() {
  const { mounted, accentColor, lang } = useFeedbackStore()
  const t = useTranslator()
  const [index] = useState(() => Math.floor(Math.random() * QUIZ_QUESTIONS.length))
  const [selected, setSelected] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [shake, setShake] = useState(false)

  if (!mounted) return null
  const q = QUIZ_QUESTIONS[index]
  const question = q[lang].question
  const answers  = q[lang].answers

  const handleAnswer = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      setIsCorrect(i === q.correct)
      if (i !== q.correct) setShake(true)
      setTimeout(() => setShake(false), 500)
      setTimeout(() => setIsDone(true), 1500)
    }, 1000)
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {!isDone ? (
          <motion.div
            key="quiz"
            exit={{ height: 0, opacity: 0, scale: 0.95, marginBottom: 0 }}
            className="w-full max-w-2xl mx-auto mt-10 p-8 md:p-10 rounded-3xl glass-card relative overflow-hidden"
            style={{ borderColor: selected !== null ? (isCorrect ? '#10B98140' : (isScanning ? accentColor + '50' : '#EF444440')) : undefined }}
          >
            <div className="absolute top-0 right-0 p-6 font-black text-7xl opacity-[0.04]" style={{ color: accentColor }}>؟</div>

            <motion.div animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}} transition={{ duration: 0.35 }}>
              <h3 className="text-xl md:text-2xl font-black mb-8 text-center leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {question}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {answers.map((opt, i) => {
                  const isSel = selected === i
                  const isCorrectOpt = i === q.correct
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(i)}
                      className="relative p-4 rounded-2xl border text-sm font-bold transition-all overflow-hidden text-right"
                      style={{
                        background: selected === null ? 'var(--bg-input)' :
                          (isScanning && isSel) ? 'rgba(255,255,255,0.08)' :
                          (!isScanning && isCorrectOpt) ? 'rgba(16,185,129,0.12)' :
                          (!isScanning && isSel) ? 'rgba(239,68,68,0.12)' :
                          'var(--bg-card)',
                        borderColor: selected === null ? 'var(--border-card)' :
                          (isScanning && isSel) ? accentColor + '60' :
                          (!isScanning && isCorrectOpt) ? '#10B98150' :
                          (!isScanning && isSel) ? '#EF444450' :
                          'var(--border-subtle)',
                        color: selected === null ? 'var(--text-primary)' :
                          (!isScanning && isCorrectOpt) ? '#10B981' :
                          (!isScanning && isSel) ? '#EF4444' :
                          'var(--text-tertiary)',
                        opacity: !isScanning && selected !== null && !isSel && i !== q.correct ? 0.35 : 1,
                      }}
                    >
                      {isScanning && isSel && (
                        <motion.div
                          initial={{ left: '-100%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                        />
                      )}
                      {opt}
                    </button>
                  )
                })}
              </div>
            </motion.div>

            {selected !== null && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex flex-col items-center gap-3 border-t pt-8"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <p className="text-lg font-black" style={{ color: isScanning ? 'var(--text-tertiary)' : (isCorrect ? '#10B981' : '#EF4444') }}>
                  {isScanning ? t('quiz_scanning') : (isCorrect ? t('quiz_correct') : t('quiz_wrong'))}
                </p>
                {!isScanning && (
                  <p className="text-xs animate-pulse" style={{ color: 'var(--text-tertiary)' }}>
                    {t('quiz_redirect')}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex flex-col items-center justify-center p-10 md:p-14 rounded-3xl glass-card relative overflow-hidden"
            style={{ borderColor: accentColor + '40', background: 'var(--glass-card-bg)' }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: `radial-gradient(circle at 50% -20%, ${accentColor}, transparent 70%)` }} />
            
            <motion.div
              animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${accentColor}40, transparent)`, border: `1px solid ${accentColor}50` }}
            >
              ✨
            </motion.div>
            
            <h3 className="text-2xl md:text-3xl font-black mb-3 text-center" style={{ color: 'var(--text-primary)' }}>
              {lang === 'AR' ? 'مستعد للتحدي الحقيقي؟' : 'Ready for the real challenge?'}
            </h3>
            <p className="text-sm text-center max-w-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {lang === 'AR' ? 'قم بإنشاء حسابك الآن وانضم إلى آلاف اللاعبين في تجربة العُريف السينمائية.' : 'Create your account now and join thousands of players in Al-Arif\'s cinematic experience.'}
            </p>
            
            <Link
              href="/auth/register"
              className="px-8 py-3.5 rounded-2xl font-black text-white text-sm transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #EC4899)`, boxShadow: `0 8px 25px ${accentColor}40` }}
            >
              <span>{lang === 'AR' ? 'ابدأ رحلتك الآن' : 'Start Your Journey Now'}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={lang === 'AR' ? 'rotate-180' : ''}>
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────
// BACKGROUND
// ─────────────────────────────────────────────
function Background() {
  const { accentColor, mounted, themeMode } = useFeedbackStore()
  const [mouse, setMouse] = useState({ x: 50, y: 50 })
  const isLight = themeMode === 'light'

  useEffect(() => {
    const h = (e: MouseEvent) => setMouse({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 })
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-700" style={{ background: 'var(--bg-primary)' }}>

      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${isLight ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.03)'} 1px, transparent 1px), linear-gradient(to bottom, ${isLight ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.03)'} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 80% 60% at center, black, transparent)',
        }}
      />

      {/* Aurora blobs */}
      <div className="absolute inset-0" style={{ filter: 'blur(120px)' }}>
        <motion.div
          animate={{ x: [0, 120, -80, 0], y: [0, -80, 120, 0], scale: [1, 1.3, 0.85, 1] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[-15%] left-[-8%] w-[70%] h-[70%] rounded-full"
          style={{ background: `radial-gradient(circle, ${accentColor}${isLight ? '18' : '22'}, transparent 65%)` }}
        />
        <motion.div
          animate={{ x: [0, -100, 60, 0], y: [0, 100, -50, 0], scale: [1, 0.75, 1.15, 1] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] rounded-full"
          style={{ background: `radial-gradient(circle, #3B82F6${isLight ? '14' : '18'}, transparent 65%)` }}
        />
        {isLight && (
          <div
            className="absolute top-[10%] right-[15%] w-[40%] h-[40%] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.08), transparent 65%)' }}
          />
        )}
      </div>

      {/* Mouse follower */}
      <div
        className="absolute w-[35%] h-[35%] rounded-full pointer-events-none transition-all duration-[1200ms] ease-out"
        style={{
          background: `radial-gradient(circle, ${accentColor}${isLight ? '0c' : '10'}, transparent 70%)`,
          filter: 'blur(80px)',
          left: `${mouse.x}%`,
          top: `${mouse.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Vignette */}
      {!isLight && (
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 250px rgba(7,7,26,0.85)' }} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────
function Logo({ className = 'w-9 h-9' }: { className?: string }) {
  const { logoUrl } = useFeedbackStore()
  const [err, setErr] = useState(false)

  if (logoUrl && !err) {
    return (
      <div className={`${className} relative`}>
        <img src={logoUrl} alt="Logo" onError={() => setErr(true)} className="w-full h-full object-contain" />
      </div>
    )
  }
  return (
    <div
      className={`${className} rounded-xl flex items-center justify-center text-sm font-black text-white relative overflow-hidden`}
      style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
    >
      <span>A</span>
    </div>
  )
}

// ─────────────────────────────────────────────
// THEME TOGGLE
// ─────────────────────────────────────────────
function ThemeToggle() {
  const { themeMode, setThemeMode, mounted } = useFeedbackStore()
  if (!mounted) return <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: 'var(--bg-card)' }} />

  const modes: ThemeMode[] = ['dark', 'light', 'system']
  const icons = { dark: '🌙', light: '☀️', system: '💻' }

  return (
    <button
      onClick={() => setThemeMode(modes[(modes.indexOf(themeMode as ThemeMode) + 1) % 3])}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 focus:outline-none"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
    >
      <motion.span key={themeMode} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {icons[themeMode as ThemeMode] ?? '🌙'}
      </motion.span>
    </button>
  )
}

// ─────────────────────────────────────────────
// AMBIENT SOUND
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getYouTubeId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/)
  return m?.[1] ?? null
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function HomePage() {
  const {
    comments, videoUrl, addComment,
    accentColor, themeMode, lang,
    mounted, setMounted,
  } = useFeedbackStore()

  const [isSocialsOpen, setIsSocialsOpen] = useState(false)
  const [isLoginHovered, setIsLoginHovered] = useState(false)
  const [flagIndex, setFlagIndex] = useState(0)
  const [feedbackPage, setFeedbackPage] = useState(0)
  const [newFeedback, setNewFeedback] = useState('')
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const t = useTranslator()
  const dir = lang === 'AR' ? 'rtl' : 'ltr'
  const isLight = themeMode === 'light'

  useEffect(() => { setMounted(true) }, [setMounted])

  useEffect(() => {
    const id = setInterval(() => setFlagIndex(p => (p + 1) % ARABIC_FLAGS.length), 4500)
    return () => clearInterval(id)
  }, [])

  const visibleComments = comments.filter(c => c.visible)
  const totalPages = Math.ceil(visibleComments.length / 3)

  useEffect(() => {
    if (!mounted || totalPages <= 1) return
    const id = setInterval(() => setFeedbackPage(p => (p + 1) % totalPages), 7000)
    return () => clearInterval(id)
  }, [totalPages, mounted])

  const handleSend = useCallback(() => {
    if (!newFeedback.trim()) return
    addComment({ name: lang === 'AR' ? 'أنت (لاعب ضيف)' : 'You (Guest)', text: newFeedback, date: lang === 'AR' ? 'الآن' : 'Now' })
    setNewFeedback('')
    setFeedbackPage(0)
  }, [newFeedback, addComment, lang])

  const handleToggleVideo = useCallback(() => {
    const ytId = getYouTubeId(videoUrl)
    if (ytId && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: isVideoPlaying ? 'pauseVideo' : 'playVideo' }), '*')
    } else if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
    setIsVideoPlaying(p => !p)
  }, [videoUrl, isVideoPlaying])

  if (!mounted) return null

  const features = [
    { icon: '⚡', title: t('feat1_title'), desc: t('feat1_desc'), color: '#8B5CF6' },
    { icon: '🧠', title: t('feat2_title'), desc: t('feat2_desc'), color: '#EC4899' },
    { icon: '🏆', title: t('feat3_title'), desc: t('feat3_desc'), color: '#F59E0B' },
    { icon: '🎁', title: t('feat4_title'), desc: t('feat4_desc'), color: '#3B82F6', comingSoon: true },
  ]

  return (
    <main
      className="relative min-h-screen overflow-x-hidden transition-colors duration-700"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', direction: dir, fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif' }}
    >
      <Background />

      {/* ── CSS variable injection ── */}
      <style>{`
        :root {
          --accent: ${accentColor};
          --accent-glow: ${accentColor}40;
          --accent-subtle: ${accentColor}15;
        }
        .glass-card {
          background: var(--glass-card-bg);
          border: 1px solid var(--glass-card-border);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          box-shadow: var(--shadow-card);
        }
        .light .glass-card {
          box-shadow: 0 4px 20px rgba(139,92,246,0.07), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95);
        }
      `}</style>

      {/* ════════════════════ NAV ════════════════════ */}
      <nav
        className="relative z-30 flex items-center justify-between px-6 md:px-16 py-5"
        style={{ backdropFilter: 'blur(24px)', background: 'var(--nav-bg)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo className="w-9 h-9" />
          <span className="font-black text-xl tracking-tight transition-colors group-hover:opacity-70" style={{ color: 'var(--text-primary)' }}>
            العُريف
          </span>
        </Link>

        <div className="flex items-center gap-1 p-1 rounded-full glass-card">
          {/* Login hover card */}
          <div className="relative" onMouseEnter={() => setIsLoginHovered(true)} onMouseLeave={() => setIsLoginHovered(false)}>
            <Link
              href="/auth/login"
              className="px-5 py-2 rounded-2xl text-sm font-bold transition-all hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('nav_login')}
            </Link>
            <AnimatePresence>
              {isLoginHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute top-full mt-2 w-56 rounded-3xl p-3 z-50 glass-card overflow-hidden"
                  style={{ [dir === 'rtl' ? 'right' : 'left']: 0 }}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3 px-3" style={{ color: 'var(--text-tertiary)' }}>
                    {t('accounts_title')}
                  </p>
                  {[{ name: 'كرم حيدر', color: accentColor }, { name: 'أبو العريف', color: '#EC4899' }].map(p => (
                    <Link key={p.name} href="/admin" className="flex items-center gap-3 p-3 rounded-2xl mb-1 transition-all hover:scale-[1.02]" style={{ background: 'var(--bg-input)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white" style={{ background: `linear-gradient(135deg, ${p.color}, #3B82F6)` }}>
                        {p.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                        <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{t('accounts_ready')}</p>
                      </div>
                    </Link>
                  ))}
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <Link href="/auth/register" className="block text-center py-2 text-[10px] font-bold transition-all hover:opacity-70" style={{ color: 'var(--text-tertiary)' }}>
                      {t('accounts_add')}
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ThemeToggle />
          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }} />
          <Link
            href="/auth/register"
            className="px-6 py-2.5 rounded-full text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95 ml-1"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #EC4899)`, boxShadow: `0 6px 20px ${accentColor}35` }}
          >
            {t('nav_register')}
          </Link>
        </div>
      </nav>

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="relative z-10 px-6 md:px-16 pt-14 pb-16 min-h-[88vh] flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30`, color: isLight ? accentColor : '#a78bfa' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
              {t('hero_badge')}
            </div>

            <h1 className="leading-[1.1] mb-12" style={{ fontSize: 'clamp(56px, 8vw, 102px)', fontFamily: "'Aref Ruqaa', serif" }}>
              <motion.span
                initial={{ opacity: 0, x: dir === 'rtl' ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="block mb-2"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                {t('hero_line1')}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="block mb-2"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${accentColor}, #EC4899)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: `drop-shadow(0 0 35px ${accentColor}50)`,
                  letterSpacing: '-0.01em'
                }}
              >
                {t('hero_line2')}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: dir === 'rtl' ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="block"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                {t('hero_line3')}
              </motion.span>
            </h1>

            <p className="text-lg mb-8 max-w-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t('hero_sub')}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/auth/register"
                className="px-8 py-4 rounded-2xl font-black text-base text-white transition-all hover:scale-[1.02] hover:shadow-2xl flex items-center gap-2"
                style={{ background: `linear-gradient(135deg, ${accentColor}, #3B82F6)`, boxShadow: `0 8px 28px ${accentColor}30` }}
              >
                {t('hero_cta_main')}
              </Link>
              <Link
                href="/join"
                className="px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] hover:opacity-80 flex items-center gap-2"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', backdropFilter: 'blur(12px)' }}
              >
                {t('hero_cta_join')}
              </Link>
            </div>

            {/* Flags */}
            <div className="mt-12 flex items-center gap-4">
              <div className="flex items-center gap-2 h-7 overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {[0,1,2,3].map(offset => {
                    const code = ARABIC_FLAGS[(flagIndex + offset) % ARABIC_FLAGS.length]
                    return (
                      <motion.div
                        key={`${code}-${flagIndex + offset}`}
                        initial={{ x: dir === 'rtl' ? -16 : 16, opacity: 0, filter: 'blur(4px)' }}
                        animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
                        exit={{ x: dir === 'rtl' ? 16 : -16, opacity: 0, filter: 'blur(4px)' }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="w-11 h-6 rounded-sm overflow-hidden flex-shrink-0"
                        style={{ border: '1px solid var(--border-card)' }}
                      >
                        <img src={`https://flagcdn.com/w80/${code}.png`} alt={code} className="w-full h-full object-cover" />
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {t('hero_tagline')}{' '}
                  <span className="font-black" style={{ color: 'var(--text-secondary)' }}>{t('hero_tagline_bold')}</span>{' '}
                  {t('hero_tagline_end')}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10B981]" />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{t('hero_live')}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Living Planet */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: mounted ? 1 : 0, scale: mounted ? 1 : 0.95 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            <LivingPlanet />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════ FEATURES ════════════════════ */}
      <section className="relative z-10 px-6 md:px-16 pb-24">
        <div className="text-center mb-14">
          <p className="text-xs font-black tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>
            {t('features_sub')}
          </p>
          <h2 className="text-3xl md:text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
            {t('features_title')}{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, #F59E0B)` }}
            >
              {t('features_title2')}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="group relative p-6 rounded-3xl glass-card cursor-default overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 30%, ${f.color}10 0%, transparent 65%)` }}
              />
              <div
                className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${f.color}45, transparent)` }}
              />

              <div className="relative z-10">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}28` }}
                >
                  {f.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                  {f.comingSoon && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: `${accentColor}18`, color: isLight ? accentColor : '#a78bfa', border: `1px solid ${accentColor}28` }}>
                      {t('coming_soon')}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════ VIDEO + COMMENTS ════════════════════ */}
      <section className="relative z-10 px-6 md:px-16 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">

          {/* Video */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={handleToggleVideo}
            className="group relative h-[420px] rounded-3xl overflow-hidden glass-card flex items-center justify-center cursor-pointer"
          >
            <div className="absolute inset-0 z-0 overflow-hidden">
              {mounted && (() => {
                const ytId = getYouTubeId(videoUrl)
                if (ytId) return (
                  <div className="absolute inset-0 pointer-events-none">
                    <iframe
                      ref={iframeRef}
                      src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=0&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&rel=0&disablekb=1`}
                      className="absolute w-[150%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35 group-hover:opacity-55 transition-opacity duration-700 grayscale group-hover:grayscale-0 pointer-events-none"
                      allow="autoplay"
                    />
                  </div>
                )
                return (
                  <video
                    ref={videoRef}
                    loop muted playsInline
                    src={videoUrl}
                    className="w-full h-full object-cover opacity-35 group-hover:opacity-55 transition-opacity duration-700 grayscale group-hover:grayscale-0"
                  />
                )
              })()}
              {!isVideoPlaying && (
                <div className="absolute inset-0" style={{ background: isLight ? 'linear-gradient(to top, rgba(248,247,252,0.7), transparent)' : 'linear-gradient(to top, rgba(7,7,26,0.75), transparent)' }} />
              )}
            </div>

            <AnimatePresence>
              {!isVideoPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="relative z-10 flex flex-col items-center gap-5 text-center px-8 pointer-events-none"
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover:scale-105"
                    style={{ background: 'var(--glass-card-bg)', border: '1px solid var(--glass-card-border)', backdropFilter: 'blur(16px)', boxShadow: '0 0 40px rgba(255,255,255,0.08)' }}
                  >
                    <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-b-[10px] border-b-transparent ml-1" style={{ borderLeftColor: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{t('video_title')}</h3>
                    <p className="text-sm max-w-[260px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('video_sub')}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Comments */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col h-[420px] rounded-3xl glass-card p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}28` }}
                >
                  💬
                </div>
                <div>
                  <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{t('comments_title')}</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('comments_sub')}</p>
                </div>
              </div>
              <div className="flex -space-x-1.5">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--bg-primary)' }} />
                ))}
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden mb-5 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={feedbackPage}
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex flex-col gap-2.5"
                >
                  {visibleComments.slice(feedbackPage * 3, feedbackPage * 3 + 3).map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="px-4 py-3 rounded-xl transition-all h-[75px] flex flex-col justify-center"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold" style={{ color: f.name.includes('أنت') || f.name.includes('You') ? '#10B981' : isLight ? accentColor : '#a78bfa' }}>
                          {f.name}
                        </span>
                        <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{f.date}</span>
                      </div>
                      <p className="text-[11px] leading-snug line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{f.text}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative shrink-0">
              <input
                type="text"
                value={newFeedback}
                onChange={e => setNewFeedback(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={t('comments_ph')}
                className="w-full py-3 pr-4 pl-20 rounded-xl text-xs outline-none transition-all"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={handleSend}
                className="absolute left-1.5 top-1.5 bottom-1.5 px-4 rounded-lg text-[10px] font-black text-white transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: `linear-gradient(135deg, ${accentColor}, #3B82F6)`, boxShadow: `0 4px 14px ${accentColor}35` }}
              >
                {t('comments_send')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════ ROADMAP ════════════════════ */}
      <VerticalRoadmap />

      {/* ════════════════════ CTA ════════════════════ */}
      <section className="relative z-10 px-6 md:px-16 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl p-12 md:p-20 text-center max-w-5xl mx-auto glass-card"
          style={{
            background: isLight
              ? `linear-gradient(135deg, ${accentColor}08, rgba(236,72,153,0.06))`
              : `linear-gradient(135deg, ${accentColor}10, rgba(59,130,246,0.08), rgba(236,72,153,0.08))`,
          }}
        >
          <div className="absolute top-0 left-0 w-52 h-52 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${accentColor}20, transparent 65%)`, filter: 'blur(50px)', transform: 'translate(-30%,-30%)' }} />
          <div className="absolute bottom-0 right-0 w-52 h-52 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2), transparent 65%)', filter: 'blur(50px)', transform: 'translate(30%,30%)' }} />

          <div className="relative z-10">
            <div className="text-5xl mb-5">🏆</div>
            <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>{t('cta_title')}</h2>
            <p className="text-lg mb-10 font-light" style={{ color: 'var(--text-secondary)' }}>{t('cta_sub')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="px-10 py-4 rounded-2xl font-black text-base text-white transition-all hover:scale-[1.02] flex items-center gap-2"
                style={{ background: `linear-gradient(135deg, ${accentColor}, #EC4899)`, boxShadow: `0 8px 28px ${accentColor}30` }}
              >
                {t('cta_main')}
              </Link>
              <Link
                href="/join"
                className="px-10 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] flex items-center gap-2"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}
              >
                {t('cta_join')}
              </Link>
            </div>
            <InteractiveQuiz />
          </div>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer
        className="relative z-10 px-6 md:px-16 py-10 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group transition-all hover:opacity-70">
          <Logo className="w-8 h-8" />
          <span className="font-black text-base" style={{ color: 'var(--text-primary)' }}>العُريف</span>
        </button>

        <div className="flex gap-6 text-sm font-bold">
          <button onClick={() => setIsSocialsOpen(true)} className="flex items-center gap-1.5 transition-all hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
            {t('footer_social')}
          </button>
          {[t('footer_index'), t('footer_legal')].map(l => (
            <a key={l} href="#" className="transition-all hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>{l}</a>
          ))}
        </div>
      </footer>

      {/* ════════════════════ SOCIALS MODAL ════════════════════ */}
      <AnimatePresence>
        {isSocialsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{ background: isLight ? 'rgba(240,235,255,0.6)' : 'rgba(0,0,0,0.65)', backdropFilter: 'blur(20px)' }}
            onClick={() => setIsSocialsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-8 glass-card relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full pointer-events-none" style={{ background: `${accentColor}12`, filter: 'blur(60px)' }} />

              <div className="relative z-10 text-center mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-card)' }}>📱</div>
                <h2 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{t('social_title')}</h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('social_sub')}</p>
              </div>

              <div className="flex flex-col gap-2 relative z-10">
                {SOCIALS.map((s, i) => (
                  <motion.a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 rounded-2xl transition-all group"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{s.icon}</span>
                      <span className="font-bold text-sm transition-all group-hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>{t(s.key)}</span>
                    </div>
                    <span style={{ color: 'var(--text-tertiary)' }}>{dir === 'rtl' ? '←' : '→'}</span>
                  </motion.a>
                ))}
              </div>

              <button
                onClick={() => setIsSocialsOpen(false)}
                className="mt-6 w-full py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-70"
                style={{ background: 'var(--bg-input)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}
              >
                {t('social_close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  )
}