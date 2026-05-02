'use client'

import { useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { createClient } from '@/lib/supabaseClient'
import QuestionModal from './QuestionModal'
import Mascot, { TEAM_PALETTE } from './Mascot'
import toast from 'react-hot-toast'
import { useMascotBehavior } from '@/hooks/useMascotBehavior'
import Fireworks from './Fireworks'

const DIFF_ORDER = ['easy', 'medium', 'hard'] as const
const DIFF_LABELS = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }
const DIFF_COLORS = {
  easy:   { color: '#10b981', glow: '0 0 16px rgba(16,185,129,0.5)',  border: 'rgba(16,185,129,0.4)',  bg: 'rgba(16,185,129,0.08)' },
  medium: { color: '#f59e0b', glow: '0 0 16px rgba(245,158,11,0.5)',  border: 'rgba(245,158,11,0.4)',  bg: 'rgba(245,158,11,0.08)' },
  hard:   { color: '#ef4444', glow: '0 0 16px rgba(239,68,68,0.5)',   border: 'rgba(239,68,68,0.4)',   bg: 'rgba(239,68,68,0.08)'  },
}

export default function GameBoard() {
  const router = useRouter()
  const supabase = createClient()
  const store = useGameStore()
  const {
    sessionId, phase, sessionQuestions, categories,
    teams, selectedQuestion, scoringConfig, mascotState, isTalking, currentTeamIndex
  } = store
  
  const { triggerReaction, settings } = useMascotBehavior()
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastActivityRef = useRef(Date.now())
  const introPlayedRef = useRef(false)

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

  const handleEndGame = async () => {
    store.setPhase('finished') // Update UI instantly
    if (sessionId) {
      await (supabase.from('sessions') as any).update({ state: 'finished' }).eq('id', sessionId)
    }
  }

  const handleTileClick = (sq: any) => {
    store.setSelectedQuestion(sq)
    
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

  const handleModalClose = async () => {
    const freshStore = useGameStore.getState()
    const currentQuestions = freshStore.sessionQuestions
    const isAllUsed = currentQuestions.length > 0 && currentQuestions.every(q => q.used)
    
    if (isAllUsed) {
      handleEndGame()
      freshStore.setSelectedQuestion(null)
      return
    }

    freshStore.setSelectedQuestion(null)
    triggerReaction('idle' as any)

    const nextTeamIndex = (freshStore.currentTeamIndex + 1) % freshStore.teams.length
    freshStore.setCurrentTeam(nextTeamIndex)
    
    // Fire-and-forget Supabase update to prevent UI lag
    if (sessionId) {
      (supabase.from('sessions') as any).update({ current_team_index: nextTeamIndex }).eq('id', sessionId).then(({ error }: any) => {
        if (error) console.error('Failed to update turn:', error)
      })
    }
  }

  // --- GAME EFFECTS & TRIGGERS (Moved to top level) ---
  useEffect(() => {
    // 1. Intro Voice: Play once when player first sees the gameboard
    if (settings && !introPlayedRef.current) {
      triggerReaction('intro')
      introPlayedRef.current = true
    }

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

  if (phase === 'finished') {
    const sorted = [...teams].sort((a, b) => b.score - a.score)
    const winner = sorted[0]
    const medals = ['🥇','🥈','🥉']
    const vibrantColor = winner?.color || '#FF3B3B'
    const palette = TEAM_PALETTE.find(p => p.color.toLowerCase() === vibrantColor.toLowerCase())
    const deepColor = palette?.dark || '#1a0000'

    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: deepColor }}
      >
        {/* Layer 1: Massive vivid central bloom */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 100% 80% at 50% 35%, ${vibrantColor} 0%, ${vibrantColor}99 30%, ${vibrantColor}22 65%, transparent 85%)`
          }}
        />

        {/* Layer 2: Rotating conic sweep — gives a "spotlight spinning" feel */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${vibrantColor}30 60deg, transparent 120deg, ${vibrantColor}18 200deg, transparent 280deg)`,
            transformOrigin: 'center center'
          }}
        />

        {/* Layer 3: Top-left orb - fast and bright */}
        <motion.div
          className="absolute z-0 pointer-events-none rounded-full"
          style={{
            width: '55vw', height: '55vw',
            top: '-15%', left: '-12%',
            background: `radial-gradient(circle, ${vibrantColor}88 0%, ${vibrantColor}22 50%, transparent 75%)`,
            filter: 'blur(30px)'
          }}
          animate={{ x: [0, 50, 10, 0], y: [0, 30, 10, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />

        {/* Layer 4: Bottom-right orb - bright accent */}
        <motion.div
          className="absolute z-0 pointer-events-none rounded-full"
          style={{
            width: '50vw', height: '50vw',
            bottom: '-15%', right: '-10%',
            background: `radial-gradient(circle, ${vibrantColor}77 0%, ${vibrantColor}22 50%, transparent 75%)`,
            filter: 'blur(35px)'
          }}
          animate={{ x: [0, -40, -10, 0], y: [0, -25, -5, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut', delay: 1.5 }}
        />

        {/* Layer 5: Top-center pulsing shimmer */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(255,255,255,0.35) 0%, transparent 100%)'
          }}
        />

        {/* Layer 6: Mid-screen accent pulse */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          animate={{ opacity: [0, 0.25, 0], scale: [0.8, 1.1, 0.8] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 2 }}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${vibrantColor}55 0%, transparent 60%)`,
            transformOrigin: 'center'
          }}
        />

        {/* Layer 7: Noise texture grain */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.06] noise" />

        {/* Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="relative z-10 w-full max-w-md px-6 py-12 flex flex-col items-center gap-6 text-center"
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/50">
              انتهت اللعبة
            </p>
            <h1 className="text-5xl font-black text-white leading-tight"
              style={{ textShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              {winner?.name}
            </h1>
          </div>

          {/* Divider */}
          <div className="w-16 h-0.5 rounded-full bg-white/20" />

          {/* Leaderboard */}
          <div
            className="w-full rounded-3xl overflow-hidden border border-white/15"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {/* Label */}
            <div className="px-6 pt-5 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 text-center">
                الترتيب النهائي
              </p>
            </div>
            {/* Rows */}
            <div className="px-4 pb-4 flex flex-col gap-2">
              {sorted.map((team, i) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background: i === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
                    border: i === 0 ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <span className="text-xl w-7 text-center shrink-0">{medals[i] || '🎖️'}</span>
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ background: team.color, boxShadow: `0 0 10px ${team.color}99` }}
                  />
                  <span className="flex-1 font-semibold text-lg text-white text-right">{team.name}</span>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-white">{team.score}</span>
                    <span className="text-[10px] text-white/40 font-bold mr-1">نقطة</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="w-full flex gap-3 mt-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="group flex-1 py-3.5 rounded-xl text-sm font-semibold uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-[0.97] border border-white/10"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)' }}
            >
              <span className="group-hover:text-white transition-colors">اللوحة</span>
            </button>
            <button
              onClick={() => router.push(`/game/setup/${sessionId}`)}
              className="group flex-1 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg border border-white/25"
              style={{ background: vibrantColor, color: 'white' }}
            >
              <span className="relative z-10 drop-shadow">إعادة</span>
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Adjust positioning for a smaller grid-based card
  const getTeamPositionClasses = (count: number, index: number) => {
    if (count === 2) {
      if (index === 0) return 'left-4 top-1/2 -translate-y-1/2'
      if (index === 1) return 'right-4 top-1/2 -translate-y-1/2'
    }
    if (count === 3) {
      if (index === 0) return 'left-4 top-4'
      if (index === 1) return 'right-4 top-4'
      if (index === 2) return 'left-4 bottom-4'
    }
    if (count >= 4) {
      if (index === 0) return 'left-4 top-4'
      if (index === 1) return 'right-4 top-4'
      if (index === 2) return 'left-4 bottom-4'
      if (index === 3) return 'right-4 bottom-4'
    }
    return ''
  }

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

                {/* Category Centerpiece */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="absolute inset-y-0 left-[90px] right-[90px] md:left-[140px] md:right-[140px] z-20 flex flex-col items-center justify-end overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-white/10 bg-black/40 backdrop-blur-md"
                >
                  <div className="absolute inset-0 w-full h-full">
                    <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center overflow-hidden">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover opacity-90" />
                      ) : cat.icon ? (
                        <span className="text-8xl filter saturate-150 drop-shadow-lg">{cat.icon}</span>
                      ) : (
                        <span className="text-8xl">🎮</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Gradient to make name readable at the bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent z-10" />

                  {/* Category Name Overlay */}
                  <h2 className="relative z-20 text-lg md:text-2xl font-black tracking-widest text-white/90 uppercase px-2 pb-4 md:pb-6 w-full text-center break-words leading-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">{cat.name}</h2>
                </motion.div>

                {/* Dynamic Team Cards around the Category */}
                {teams.map((team, tIndex) => {
                  const isActive = currentTeamIndex === tIndex
                  const posClass = getTeamPositionClasses(teams.length, tIndex)
                  
                  return (
                    <motion.div 
                      key={team.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className={`absolute z-10 flex flex-col gap-2 p-1 transition-all duration-500 w-[110px] md:w-[130px] ${posClass}`}
                      style={{
                        background: 'transparent',
                        opacity: isActive ? 1 : 0.3,
                        filter: isActive ? 'none' : 'grayscale(80%)',
                        transform: isActive ? 'scale(1.05)' : 'scale(0.95)'
                      }}
                    >
                      <div className="flex flex-col rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md"
                           style={{ background: 'transparent' }}>
                        {DIFF_ORDER.map((diff, i) => {
                          const sq = boardMap[cat.id]?.[team.id]?.[diff]
                          if (!sq) return null

                          const used = sq.used
                          const disabled = used || !isActive

                          return (
                            <motion.button
                              key={sq.id}
                              disabled={disabled}
                              onClick={() => handleTileClick(sq)}
                              className={`relative flex items-center justify-center py-3 md:py-4 transition-all w-full ${i < 2 ? 'border-b border-white/10' : ''}`}
                              style={{
                                background: 'transparent',
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                opacity: disabled ? 0.4 : 1
                              }}
                              whileHover={!disabled && isActive ? "hover" : ""}
                              initial="default"
                              animate="default"
                            >
                              {used ? (
                                <span className="text-sm font-bold relative z-10 text-white/30">✓</span>
                              ) : (
                                <motion.span className="text-3xl md:text-4xl tabular-nums relative z-10" 
                                  variants={{
                                    hover: { 
                                      color: team.color, 
                                      textShadow: `0 0 25px ${team.color}`,
                                      scale: 1.1 
                                    },
                                    default: { 
                                      color: '#ffffff', 
                                      textShadow: '0 0 10px rgba(255,255,255,0.3)',
                                      scale: 1 
                                    }
                                  }}
                                  transition={{ duration: 0.2 }}
                                  style={{ 
                                    fontFamily: 'var(--font-latin), serif', 
                                    fontStyle: 'italic', 
                                    fontWeight: 900
                                  }}>
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
                    await (supabase.from('teams') as any).update({ score: newScore }).eq('id', team.id)
                    store.updateScore(team.id, newScore)
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
                    await (supabase.from('teams') as any).update({ score: newScore }).eq('id', team.id)
                    store.updateScore(team.id, newScore)
                  }}
                  className="w-7 h-7 rounded-full font-black text-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-green-500/10 text-green-500"
                >+</button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── QUESTION MODAL ── */}
      <AnimatePresence>
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
