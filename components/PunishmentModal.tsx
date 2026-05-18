'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useSoundSystem } from '@/hooks/useSoundSystem'
import Mascot from './Mascot'
import { ActivePunishment, Punishment } from '@/types/game'

interface Props {
  active: ActivePunishment
  onClose: () => void
}

export default function PunishmentModal({ active, onClose }: Props) {
  const { team, punishment, mode } = active
  const { lang } = useFeedbackStore()
  const store = useGameStore()
  const { playTick, playFanfare } = useSoundSystem()

  const [phase, setPhase] = useState<'intro' | 'interacting' | 'revealed'>(
    mode === 'escalating' ? 'revealed' : 'interacting'
  )
  const [spinning, setSpinning] = useState(false)
  const [wheelRot, setWheelRot] = useState(0)

  // Voted mode state
  const [cards, setCards] = useState<{ id: string; p: Punishment; flipped: boolean }[]>([])

  useEffect(() => {
    if (mode === 'voted' && store.punishments.length > 0) {
      const activePool = store.punishments.filter(x => x.enabled)
      const pool = activePool.length > 0 ? activePool : store.punishments
      const decoys = pool.filter(x => x.id !== punishment.id)
      const shuffledDecoys = [...decoys].sort(() => Math.random() - 0.5)
      const selectedDecoys = shuffledDecoys.slice(0, 2)
      const combined = [punishment, ...selectedDecoys].sort(() => Math.random() - 0.5)
      setCards(combined.map((p, idx) => ({ id: `${p.id}-${idx}`, p, flipped: false })))
    }
    if (mode === 'escalating' || mode === 'mixed') {
      const timer = setTimeout(() => {
        setPhase('revealed')
        playFanfare()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [mode, store.punishments, punishment, playFanfare])

  // Wheel Spin logic
  const spinWheel = () => {
    if (spinning) return
    setSpinning(true)
    playTick()

    const ticks = setInterval(() => playTick(), 200)
    const extraSpins = 360 * 4
    const targetDeg = extraSpins + Math.floor(Math.random() * 360)

    setWheelRot(targetDeg)

    setTimeout(() => {
      clearInterval(ticks)
      setSpinning(false)
      setPhase('revealed')
      playFanfare()
    }, 3500)
  }

  // Card Flip logic
  const flipCard = (cardIndex: number) => {
    if (phase === 'revealed') return
    playFanfare()
    setCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, p: punishment, flipped: true } : c))
    setPhase('revealed')
  }

  const levelMeta = {
    1: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', name: lang === 'EN' ? 'Easy Level ⚡' : 'المستوى السهل ⚡' },
    2: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', name: lang === 'EN' ? 'Medium Level 🔥' : 'المستوى المتوسط 🔥' },
    3: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', name: lang === 'EN' ? 'Hard Level 💥' : 'المستوى الحماسي 💥' },
  }[punishment?.level ?? 1] ?? { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', name: lang === 'EN' ? 'Easy Level ⚡' : 'المستوى السهل ⚡' }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-md bg-[#07071A]/75 select-none overflow-hidden"
      style={{ direction: lang === 'AR' ? 'rtl' : 'ltr', fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif' }}>
      
      {/* Ambient background bloom */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full blur-[100px]"
          style={{ background: `radial-gradient(circle, ${team.color}60 0%, transparent 70%)` }}
        />
      </div>

      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative z-10 w-full max-w-lg flex flex-col items-center gap-6 bg-[#0E0E24]/90 border border-white/15 p-6 md:p-8 rounded-[2.5rem] shadow-[0_20px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <Mascot state="punishment" size={90} color={team.color} />
          </motion.div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-black tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            {lang === 'EN' ? 'PUNISHMENT TIME' : 'عقوبة إجبارية'}
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: team.color, textShadow: `0 0 25px ${team.color}90` }}>
            {lang === 'EN' ? `Team ${team.name}` : `فريق ${team.name}`}
          </h2>
        </div>

        {/* Dynamic Mode UI */}
        <div className="w-full flex flex-col items-center justify-center min-h-[180px] relative py-2">
          
          {/* MODE 1: WHEEL OF FORTUNE */}
          {mode === 'wheel' && (
            <div className="flex flex-col items-center gap-5 w-full">
              {phase === 'interacting' && (
                <div className="relative flex items-center justify-center w-48 h-48 md:w-56 md:h-56">
                  <div className="absolute -top-3 z-20 text-3xl filter drop-shadow-md animate-bounce">👇</div>
                  <motion.div
                    className="w-full h-full rounded-full border-[3px] border-white/20 shadow-[0_0_35px_rgba(139,92,246,0.3)] relative overflow-hidden flex items-center justify-center font-black text-xl md:text-2xl"
                    style={{ background: `conic-gradient(#8b5cf6 0deg 90deg, #ec4899 90deg 180deg, #3b82f6 180deg 270deg, #f59e0b 270deg 360deg)` }}
                    animate={{ rotate: wheelRot }}
                    transition={{ duration: 3.5, ease: [0.2, 0.8, 0.1, 1] }}
                  >
                    <div className="absolute inset-2 rounded-full bg-[#0E0E24]/95 border border-white/10 flex items-center justify-center p-3 text-center">
                      <span className="text-xs md:text-sm font-black text-white/80 tracking-wider uppercase">
                        {spinning ? (lang === 'EN' ? 'SPINNING...' : 'جاري التدوير...') : (lang === 'EN' ? 'WHEEL OF FATE' : 'عجلة الحظ')}
                      </span>
                    </div>
                  </motion.div>
                </div>
              )}

              {phase === 'interacting' && !spinning && (
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={spinWheel}
                  className="px-8 py-3.5 rounded-2xl font-black text-base bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] cursor-pointer">
                  {lang === 'EN' ? '🎡 SPIN THE WHEEL!' : '🎡 تدوير عجلة العقوبة!'}
                </motion.button>
              )}
            </div>
          )}

          {/* MODE 2: VOTED / MYSTERY CARDS */}
          {mode === 'voted' && phase === 'interacting' && (
            <div className="flex flex-col items-center gap-4 w-full">
              <p className="text-xs font-bold text-white/70 tracking-wide">
                {lang === 'EN' ? 'Pick a mystery card to reveal your fate:' : 'اختر بطاقة غامضة لتكشف عقوبتك:'}
              </p>
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs md:max-w-sm">
                {cards.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}
                    onClick={() => flipCard(idx)}
                    className="aspect-[3/4] rounded-xl bg-gradient-to-tr from-purple-900/30 via-indigo-900/30 to-pink-900/30 border border-white/15 shadow-xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group backdrop-blur-sm">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl md:text-4xl filter drop-shadow group-hover:scale-110 transition-transform">
                      🃏
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50 mt-2">
                      {lang === 'EN' ? `CARD ${idx + 1}` : `بطاقة ${idx + 1}`}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* MODE 3: ESCALATING OR MIXED / MYSTERY REVEAL */}
          {phase === 'interacting' && (mode === 'escalating' || mode === 'mixed') && (
            <div className="flex flex-col items-center justify-center gap-4 py-6">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-500/15 via-red-500/15 to-purple-500/15 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-md">
                <span className="text-5xl animate-pulse">🎲</span>
              </motion.div>
              <p className="text-xs font-black text-amber-400 tracking-wider uppercase animate-pulse">
                {lang === 'EN' ? 'REVEALING PUNISHMENT...' : 'جاري كشف العقوبة...'}
              </p>
            </div>
          )}

          {/* REVEALED PUNISHMENT CARD */}
          {phase === 'revealed' && (
            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="w-full flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-white/[0.04] border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-lg">
              
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] pointer-events-none opacity-40" style={{ background: levelMeta.color }} />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-[50px] pointer-events-none opacity-40" style={{ background: team.color }} />

              <span className="text-xs font-black px-4 py-1 rounded-full border tracking-widest uppercase shadow-sm"
                style={{ color: levelMeta.color, background: levelMeta.bg, borderColor: `${levelMeta.color}60` }}>
                {levelMeta.name}
              </span>

              <p className="text-xl md:text-2xl font-black text-white leading-normal md:leading-relaxed px-2 tracking-wide drop-shadow">
                {punishment.text}
              </p>

              <div className="w-16 h-1 rounded-full my-1" style={{ background: `linear-gradient(90deg, transparent, ${team.color}, transparent)` }} />

              <p className="text-[11px] font-bold text-white/50 max-w-sm">
                {lang === 'EN'
                  ? 'The team must complete this punishment before continuing the trivia match!'
                  : 'على الفريق تنفيذ هذه العقوبة بالكامل قبل استكمال أسئلة التحدي!'}
              </p>
            </motion.div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="w-full pt-3 border-t border-white/10 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full max-w-sm py-3.5 rounded-2xl font-black text-base bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30">
            <span>✓ {lang === 'EN' ? 'Completed & Resume' : 'تم التنفيذ، أكمل اللعبة'}</span>
          </motion.button>
        </div>

      </motion.div>

    </motion.div>
  )
}
