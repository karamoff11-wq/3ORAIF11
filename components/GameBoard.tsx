'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import dynamic from 'next/dynamic'
import Mascot, { TEAM_PALETTE } from './Mascot'
import toast from 'react-hot-toast'
import { useMascotBehavior } from '@/hooks/useMascotBehavior'
import { track } from '@/lib/analytics'

// ── Lazy-loaded: only fetched when a question is selected or game ends ──
const QuestionModal = dynamic(() => import('./QuestionModal'), { ssr: false })
const Fireworks    = dynamic(() => import('./Fireworks'),     { ssr: false })

const DIFF_ORDER = ['easy', 'medium', 'hard'] as const
const DIFF_LABELS = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }
const DIFF_COLORS = {
  easy:   { color: '#10b981', glow: '0 0 16px rgba(16,185,129,0.5)',  border: 'rgba(16,185,129,0.4)',  bg: 'rgba(16,185,129,0.08)' },
  medium: { color: '#f59e0b', glow: '0 0 16px rgba(245,158,11,0.5)',  border: 'rgba(245,158,11,0.4)',  bg: 'rgba(245,158,11,0.08)' },
  hard:   { color: '#ef4444', glow: '0 0 16px rgba(239,68,68,0.5)',   border: 'rgba(239,68,68,0.4)',   bg: 'rgba(239,68,68,0.08)'  },
}

export default function GameBoard() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const store = useGameStore()
  const {
    sessionId, phase, sessionQuestions, categories,
    teams, selectedQuestion, scoringConfig, mascotState, isTalking, currentTeamIndex
  } = store
  
  const { lang } = useFeedbackStore()
  
  const { triggerReaction, settings } = useMascotBehavior()
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastActivityRef = useRef(Date.now())
  const introPlayedRef = useRef(false)
  const gameCompletedTrackedRef = useRef(false)

  const boardMap = useMemo(() => {
    const map: Record<string, Record<string, Record<string, any>>> = {}
    for (const sq of sessionQuestions) {
      const catId = sq.question?.category_id
      const diff  = sq.question?.difficulty
      const tId = sq.team_id
      if (!catId || !diff || !tId) continue
      
      if (!map[catId]) map[catId] = {}
      if (!map[catId][tId]) map[catId][tId] = {}
      map[catId][tId][diff] = sq
    }
    return map
  }, [sessionQuestions])

  const pts = (diff: string) => ({
    easy: scoringConfig.easy_points,
    medium: scoringConfig.medium_points,
    hard: scoringConfig.hard_points,
  }[diff] ?? 100)

  const allUsed = sessionQuestions.length > 0 && sessionQuestions.every(q => q.used)
  const activeTeam = teams[currentTeamIndex]

  // ── Team card position helper — MUST be above any conditional returns ──
  const getTeamPositionClasses = (count: number, index: number): string => {
    const base = 'top-1/2 -translate-y-1/2'
    if (count === 2) {
      if (index === 0) return `left-2 md:left-4 ${base}`
      if (index === 1) return `right-2 md:right-4 ${base}`
    }
    if (count === 3) {
      if (index === 0) return `left-1 md:left-3 ${base}`
      if (index === 1) return `right-1 md:right-3 ${base}`
      if (index === 2) return `left-[65px] md:left-[95px] ${base}`
    }
    if (count >= 4) {
      if (index === 0) return `left-1 md:left-3 ${base}`
      if (index === 1) return `right-1 md:right-3 ${base}`
      if (index === 2) return `left-[65px] md:left-[95px] ${base}`
      if (index === 3) return `right-[65px] md:right-[95px] ${base}`
    }
    return ''
  }

  const handleEndGame = async () => {
    store.setPhase('finished') // Update UI instantly
    if (sessionId) {
      try {
        const { error } = await (supabase.from('sessions') as any).update({ state: 'finished' }).eq('id', sessionId)
        if (error) {
          console.warn('Failed to end game session in database:', error)
        }
      } catch (err) {
        console.warn('Network issue ending game session:', err)
      }
    }
  }

  const handleTileClick = (sq: any) => {
    if (!store.isHost) {
      toast('فقط المضيف يمكنه اختيار السؤال!', { icon: '🔒' })
      return
    }
    
    store.setSelectedQuestion(sq)
    store.setBuzzedTeamId(null) // Reset buzzer

    // Broadcast question to players
    if (store.broadcastChannel) {
      store.broadcastChannel.send({
        type: 'broadcast',
        event: 'open_question',
        payload: { sq }
      })
    }
    
    // Thinking Voice Logic:
    // Only on "Hard" difficulty, and only for a specific count per game based on teams.
    const isHard = sq.question?.difficulty === 'hard'
    const teamCount = teams.length
    const maxThinking = teamCount === 2 ? 3 : teamCount === 3 ? 9 : 12
    
    if (isHard && store.thinkingCount < maxThinking) {
      if (Math.random() < 0.6) { // Add some randomness as requested
        triggerReaction('thinking')
        store.incrementThinkingCount()
      }
    }
  }

  const handleModalClose = () => {
    const s = useGameStore.getState()
    if (!s.isHost) return

    s.setSelectedQuestion(null)
    s.setBuzzedTeamId(null)

    // Broadcast close to players
    if (s.broadcastChannel) {
      s.broadcastChannel.send({
        type: 'broadcast',
        event: 'close_question',
        payload: {}
      })
    }

    // Check for end of game after modal is closed
    const after = useGameStore.getState()
    const allUsed = after.sessionQuestions.length > 0 && after.sessionQuestions.every(q => q.used)
    if (allUsed) {
      handleEndGame()
    }
  }

  // --- GAME EFFECTS & TRIGGERS (Moved to top level) ---
  useEffect(() => {

    // 2. Idle Activity Tracker
    const handleActivity = () => { lastActivityRef.current = Date.now() }
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('keydown', handleActivity)

    const idleCheck = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityRef.current
      if (inactiveTime >= 180000) { // 3 minutes
        if (Math.random() < 0.5) triggerReaction('idle' as any)
        handleActivity()
      }
    }, 10000)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      clearInterval(idleCheck)
    }
  }, [triggerReaction, settings])

  // ── Track game_completed once when the phase transitions to 'finished' ──
  useEffect(() => {
    if (phase === 'finished' && !gameCompletedTrackedRef.current) {
      gameCompletedTrackedRef.current = true
      const sorted = [...teams].sort((a, b) => b.score - a.score)
      const winner = sorted[0]
      track('game_completed', {
        session_id:   sessionId ?? '',
        winner_name:  winner?.name ?? '',
        winner_score: winner?.score ?? 0,
        team_count:   teams.length,
      })
    }
  }, [phase, teams, sessionId])

  if (phase === 'finished') {

  // ── Sort & derive ──
  const sorted      = [...teams].sort((a, b) => b.score - a.score)
  const winner      = sorted[0]
  const medals      = ['🥇', '🥈', '🥉']
  const winnerColor = winner?.color ?? '#8B5CF6'

  // ── Share score handler ──
  const handleShare = () => {
    const text = sorted
      .map((t, i) => `${medals[i] ?? '🎖️'} ${t.name}: ${t.score} ${lang === 'AR' ? 'نقطة' : 'pts'}`)
      .join('\n')
    const message = lang === 'AR'
      ? `🏆 نتائج جلسة العُريف!\n\n${text}\n\nالعب معنا على العُريف`
      : `🏆 Al-Arif Game Results!\n\n${text}\n\nPlay with us on Al-Arif`

    if (navigator.share) {
      navigator.share({ title: 'العُريف', text: message }).catch(() => {})
    } else {
      navigator.clipboard.writeText(message).then(() => {
        // toast is already imported in GameBoard.tsx
        toast.success(lang === 'AR' ? 'تم النسخ!' : 'Copied!')
      }).catch(() => {})
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden select-none"
      style={{
        background: '#050510',
        direction: lang === 'AR' ? 'rtl' : 'ltr',
        fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif',
      }}
    >

      {/* ══════════════ BACKGROUND SYSTEM ══════════════ */}

      {/* Layer 1 — Deep radial base bloom */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 120% 70% at 50% 20%,
            ${winnerColor}55 0%,
            ${winnerColor}22 40%,
            transparent 70%)`,
        }}
      />

      {/* Layer 2 — Slow rotating conic spotlight */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
        style={{
          background: `conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            ${winnerColor}28 55deg,
            transparent 110deg,
            ${winnerColor}14 190deg,
            transparent 270deg
          )`,
          transformOrigin: 'center center',
        }}
      />

      {/* Layer 3 — Secondary counter-rotating sweep */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        animate={{ rotate: [360, 0] }}
        transition={{ repeat: Infinity, duration: 34, ease: 'linear' }}
        style={{
          background: `conic-gradient(
            from 180deg at 50% 50%,
            transparent 0deg,
            rgba(236,72,153,0.10) 40deg,
            transparent 100deg
          )`,
          transformOrigin: 'center center',
        }}
      />

      {/* Layer 4 — Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 z-0 pointer-events-none"
        style={{ height: '40%', background: 'linear-gradient(to top, #050510, transparent)' }}
      />

      {/* ══════════════ CONFETTI PARTICLES ══════════════ */}
      <FinishedParticles color={winnerColor} />

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div className="relative z-10 w-full max-w-sm px-5 flex flex-col items-center gap-5">

        {/* ── Winner crown burst ── */}
        <motion.div
          initial={{ scale: 0, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
          className="flex flex-col items-center gap-3"
        >
          {/* Trophy glow orb */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 140, height: 140,
                background: `radial-gradient(circle, ${winnerColor} 0%, transparent 70%)`,
                filter: 'blur(30px)',
              }}
            />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 text-7xl"
            >
              🏆
            </motion.div>
          </div>

          {/* Game over label */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-[10px] font-black uppercase tracking-[0.4em]"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {lang === 'AR' ? 'انتهت اللعبة' : 'Game Over'}
          </motion.p>

          {/* Winner name */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.45 }}
            className="text-4xl md:text-5xl font-black text-center leading-tight text-white"
            style={{ textShadow: `0 0 40px ${winnerColor}80, 0 4px 20px rgba(0,0,0,0.5)` }}
          >
            {winner?.name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm font-bold"
            style={{ color: winnerColor }}
          >
            {lang === 'AR' ? `${winner?.score} نقطة` : `${winner?.score} pts`}
          </motion.p>
        </motion.div>

        {/* ── Ranking list ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div className="px-5 pt-5 pb-3">
            <p
              className="text-[9px] font-black uppercase tracking-[0.35em] text-center"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {lang === 'AR' ? 'الترتيب النهائي' : 'Final Rankings'}
            </p>
          </div>

          <div className="px-3 pb-3 flex flex-col gap-2">
            {sorted.map((team, i) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: lang === 'AR' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: i === 0
                    ? `${winnerColor}20`
                    : 'rgba(255,255,255,0.03)',
                  border: i === 0
                    ? `1px solid ${winnerColor}45`
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Medal */}
                <span className="text-xl w-7 text-center shrink-0 leading-none">
                  {medals[i] ?? '🎖️'}
                </span>

                {/* Team color dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    background: team.color,
                    boxShadow: `0 0 8px ${team.color}90`,
                  }}
                />

                {/* Name */}
                <span className="flex-1 font-bold text-base text-white truncate">
                  {team.name}
                </span>

                {/* Score */}
                <div className="shrink-0 flex items-baseline gap-1">
                  <span className="text-lg font-black text-white">{team.score}</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {lang === 'AR' ? 'نقطة' : 'pts'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Action buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col gap-3"
        >
          {/* Play Again — primary */}
          <button
            onClick={() => router.push(`/game/setup/${sessionId}`)}
            className="w-full py-4 rounded-2xl font-black text-base text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${winnerColor}, #EC4899)`,
              boxShadow: `0 8px 30px ${winnerColor}40`,
            }}
          >
            {lang === 'AR' ? '🎮 إعادة اللعب' : '🎮 Play Again'}
          </button>

          {/* Share + Dashboard — secondary row */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              {lang === 'AR' ? 'مشاركة' : 'Share'}
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              {lang === 'AR' ? 'اللوحة' : 'Dashboard'}
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

  // getTeamPositionClasses has been moved above the finished-screen early return

  return (
    <div className="h-screen flex flex-col overflow-hidden relative" style={{ background: 'var(--color-bg)' }}>
      
      {/* TV LED Edge Pulsating Background */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-0"
        animate={{ 
          boxShadow: [
            `inset 0 0 10px 2px ${activeTeam?.color}30`,
            `inset 0 0 30px 5px ${activeTeam?.color}60`,
            `inset 0 0 10px 2px ${activeTeam?.color}30`,
          ],
          background: [
            `radial-gradient(circle at center, ${activeTeam?.color}05 0%, transparent 60%)`,
            `radial-gradient(circle at center, ${activeTeam?.color}15 0%, transparent 50%)`,
            `radial-gradient(circle at center, ${activeTeam?.color}05 0%, transparent 60%)`,
          ]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* ── TOP NAV ── */}
      <div className="relative z-50 flex items-center justify-between px-5 py-3 shrink-0 backdrop-blur-md bg-black/40 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Mascot state={mascotState as any} size={44} isTalking={isTalking} color={activeTeam?.color || '#6B9FD4'} />
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: activeTeam?.color }} />
              <p className="text-sm font-bold tracking-widest uppercase text-white/90">
                دور فريق: <span style={{ color: activeTeam?.color }}>{activeTeam?.name}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm">← الرئيسية</button>
          <button onClick={handleEndGame} className="btn btn-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
            إنهاء اللعبة
          </button>
        </div>
      </div>

      {/* ── CATEGORY GRID VIEW (ONE PAGE) ── */}
      <div className="flex-1 overflow-hidden relative z-10 p-4 md:p-6" ref={scrollRef}>
        
        {categories.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/50">لا توجد فئات.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4 max-w-[1800px] mx-auto h-full">
            {categories.map((cat, ci) => (
              <div key={cat.id} className="w-full h-full min-h-0 relative flex items-center justify-center bg-black/20 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
                
                {/* Background Full-Cell Glow */}
                {cat.image_url && (
                  <motion.img 
                    src={cat.image_url} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover blur-[50px] opacity-40 z-0 pointer-events-none" 
                    animate={{ scale: [1.2, 1.4, 1.2], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 4 + (ci % 2), repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                <div className="absolute inset-0 z-20 flex p-2 md:p-3 gap-2 md:gap-3 items-center justify-between">
                  
                  {/* First Group Teams */}
                  <div className="flex gap-1.5 md:gap-2 shrink-0 z-30">
                    {(teams.length === 2 ? [0] : [0, 1]).map(tIndex => {
                      const team = teams[tIndex]
                      if (!team) return null
                      const isActive = currentTeamIndex === tIndex
                      const isDense = teams.length > 2
                      const widthClass = isDense ? 'w-[60px] md:w-[75px]' : 'w-[90px] md:w-[120px]'
                      
                      return (
                        <motion.div key={team.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                          className={`flex flex-col gap-2 transition-all duration-500 ${widthClass}`}
                          style={{ opacity: isActive ? 1 : 0.3, filter: isActive ? 'none' : 'grayscale(80%)', transform: isActive ? 'scale(1.05)' : 'scale(0.95)' }}>
                          <div className="flex flex-col rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
                            {DIFF_ORDER.map((diff, i) => {
                              const sq = boardMap[cat.id]?.[team.id]?.[diff]
                              if (!sq) return null
                              const disabled = sq.used || !isActive
                              return (
                                <motion.button key={sq.id} disabled={disabled} onClick={() => handleTileClick(sq)}
                                  className={`relative flex items-center justify-center ${isDense ? 'py-1.5 md:py-2.5' : 'py-3 md:py-4'} transition-all w-full ${i < 2 ? 'border-b border-white/10' : ''}`}
                                  style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}
                                  whileHover={!disabled && isActive ? "hover" : ""} initial="default" animate="default">
                                  {sq.used ? ( <span className="text-sm font-bold relative z-10 text-white/30">✓</span> ) : (
                                    <motion.span className={`${isDense ? 'text-base md:text-xl' : 'text-3xl md:text-4xl'} tabular-nums relative z-10`} 
                                      variants={{ hover: { color: team.color, textShadow: `0 0 25px ${team.color}`, scale: 1.1 }, default: { color: '#ffffff', textShadow: '0 0 10px rgba(255,255,255,0.3)', scale: 1 } }}
                                      transition={{ duration: 0.2 }} style={{ fontFamily: 'var(--font-latin), serif', fontStyle: 'italic', fontWeight: 900 }}>
                                      {pts(diff)}
                                    </motion.span>
                                  )}
                                </motion.button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Category Centerpiece (Flex-1 allows it to take remaining space smoothly) */}
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    className="relative h-full flex-1 flex flex-col items-center justify-end overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-white/10 bg-black/40 backdrop-blur-md rounded-xl z-20"
                  >
                    <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center overflow-hidden">
                      {cat.image_url ? ( <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover opacity-90" /> ) : 
                       cat.icon ? ( <span className="text-6xl md:text-8xl filter saturate-150 drop-shadow-lg">{cat.icon}</span> ) : 
                       ( <span className="text-6xl md:text-8xl">🎮</span> )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/90 to-transparent z-10" />
                    <h2 className="relative z-20 text-sm md:text-2xl font-black tracking-widest text-white/90 uppercase px-2 pb-3 md:pb-6 w-full text-center break-words leading-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">{cat.name}</h2>
                  </motion.div>

                  {/* Second Group Teams */}
                  <div className="flex gap-1.5 md:gap-2 shrink-0 z-30">
                    {(teams.length === 2 ? [1] : [2, 3]).map(tIndex => {
                      const team = teams[tIndex]
                      if (!team) return null
                      const isActive = currentTeamIndex === tIndex
                      const isDense = teams.length > 2
                      const widthClass = isDense ? 'w-[60px] md:w-[75px]' : 'w-[90px] md:w-[120px]'
                      
                      return (
                        <motion.div key={team.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                          className={`flex flex-col gap-2 transition-all duration-500 ${widthClass}`}
                          style={{ opacity: isActive ? 1 : 0.3, filter: isActive ? 'none' : 'grayscale(80%)', transform: isActive ? 'scale(1.05)' : 'scale(0.95)' }}>
                          <div className="flex flex-col rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
                            {DIFF_ORDER.map((diff, i) => {
                              const sq = boardMap[cat.id]?.[team.id]?.[diff]
                              if (!sq) return null
                              const disabled = sq.used || !isActive
                              return (
                                <motion.button key={sq.id} disabled={disabled} onClick={() => handleTileClick(sq)}
                                  className={`relative flex items-center justify-center ${isDense ? 'py-1.5 md:py-2.5' : 'py-3 md:py-4'} transition-all w-full ${i < 2 ? 'border-b border-white/10' : ''}`}
                                  style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}
                                  whileHover={!disabled && isActive ? "hover" : ""} initial="default" animate="default">
                                  {sq.used ? ( <span className="text-sm font-bold relative z-10 text-white/30">✓</span> ) : (
                                    <motion.span className={`${isDense ? 'text-base md:text-xl' : 'text-3xl md:text-4xl'} tabular-nums relative z-10`} 
                                      variants={{ hover: { color: team.color, textShadow: `0 0 25px ${team.color}`, scale: 1.1 }, default: { color: '#ffffff', textShadow: '0 0 10px rgba(255,255,255,0.3)', scale: 1 } }}
                                      transition={{ duration: 0.2 }} style={{ fontFamily: 'var(--font-latin), serif', fontStyle: 'italic', fontWeight: 900 }}>
                                      {pts(diff)}
                                    </motion.span>
                                  )}
                                </motion.button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BOTTOM SCOREBOARD ── */}
      <div className="relative z-50 shrink-0 px-4 py-3 backdrop-blur-md bg-black/40 border-t border-white/5">
        <div className="flex gap-3 items-center justify-center flex-wrap">
          {teams.map((team, tIndex) => {
            const isTurn = currentTeamIndex === tIndex;
            return (
              <div key={team.id}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl relative transition-all duration-300 ${isTurn ? 'scale-105' : 'scale-95 opacity-60'}`}
                style={{ 
                  background: isTurn ? `${team.color}25` : `${team.color}05`, 
                  border: `1px solid ${team.color}${isTurn ? '50' : '20'}`,
                  boxShadow: isTurn ? `0 0 20px ${team.color}30` : 'none'
                }}>
                
                {store.streaks[team.id] > 1 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 text-xs font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 z-10"
                    style={{ background: '#f59e0b', color: '#fff', boxShadow: '0 0 10px rgba(245,158,11,0.5)' }}
                  >
                    🔥 {store.streaks[team.id]}
                  </motion.div>
                )}

                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: team.color }} />
                <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{team.name}</span>
                <button
                  onClick={async () => {
                    const newScore = Math.max(0, team.score - scoringConfig.easy_points)
                    store.updateScore(team.id, newScore)
                    try {
                      await (supabase.from('teams') as any).update({ score: newScore }).eq('id', team.id)
                    } catch (e) {
                      console.warn('Network issue syncing score')
                    }
                  }}
                  className="w-7 h-7 rounded-full font-black text-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-red-500/10 text-red-500"
                >−</button>
                <span className="text-xl font-black tabular-nums min-w-[3ch] text-center"
                  style={{ color: team.color, fontFamily: 'var(--font-latin)' }}>
                  {team.score}
                </span>
                <button
                  onClick={async () => {
                    const newScore = team.score + scoringConfig.easy_points
                    store.updateScore(team.id, newScore)
                    try {
                      await (supabase.from('teams') as any).update({ score: newScore }).eq('id', team.id)
                    } catch (e) {
                      console.warn('Network issue syncing score')
                    }
                  }}
                  className="w-7 h-7 rounded-full font-black text-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-green-500/10 text-green-500"
                >+</button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── QUESTION MODAL ── */}
      <AnimatePresence mode="wait">
        {selectedQuestion && (
          <QuestionModal
            key={selectedQuestion.id}
            sq={selectedQuestion}
            points={pts(selectedQuestion.question?.difficulty)}
            teams={teams}
            onClose={handleModalClose}
            triggerReaction={triggerReaction}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE COMPONENT
// Place this OUTSIDE GameBoard (e.g. at the bottom of GameBoard.tsx before
// the closing export, or in a separate file and import it).
// Uses only React + framer-motion — no extra deps.
// ─────────────────────────────────────────────────────────────────────────────

function FinishedParticles({ color }: { color: string }) {
  // Generate stable particles once on mount
  const particles = useState(() =>
    Array.from({ length: 38 }, (_, i) => ({
      id:       i,
      x:        Math.random() * 100,          // vw %
      size:     Math.random() * 7 + 3,        // px
      delay:    Math.random() * 2,
      duration: Math.random() * 3 + 3,        // fall duration
      wobble:   (Math.random() - 0.5) * 40,   // horizontal drift px
      // Alternate between winner color, white, and pink
      hue:      i % 3 === 0 ? color : i % 3 === 1 ? '#ffffff' : '#EC4899',
      shape:    i % 4,                        // 0=circle 1=square 2=diamond 3=line
      spin:     Math.random() * 720 - 360,
    }))
  )[0]

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left:   `${p.x}%`,
            top:    '-20px',
            width:  p.size,
            height: p.shape === 3 ? 2 : p.size,
            background: p.hue,
            borderRadius:
              p.shape === 0 ? '50%' :
              p.shape === 1 ? '2px' :
              p.shape === 2 ? '2px' : '99px',
            transform: p.shape === 2 ? 'rotate(45deg)' : undefined,
            opacity: 0.75,
          }}
          animate={{
            y:       ['0vh', '110vh'],
            x:       [0, p.wobble, -p.wobble / 2, p.wobble / 3],
            rotate:  [0, p.spin],
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration:    p.duration,
            delay:       p.delay,
            repeat:      Infinity,
            repeatDelay: Math.random() * 4 + 2,
            ease:        'easeIn',
          }}
        />
      ))}
    </div>
  )
}
