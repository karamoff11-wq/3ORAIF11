'use client'

import { useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { createClient } from '@/lib/supabaseClient'
import QuestionModal from './QuestionModal'
import Mascot from './Mascot'
import toast from 'react-hot-toast'
import { useMascotBehavior } from '@/hooks/useMascotBehavior'

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
  
  const { triggerReaction, activeCustomMascot } = useMascotBehavior()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase === 'playing' && sessionQuestions.every(q => !q.used)) {
      triggerReaction('intro')
    }
  }, [phase, sessionQuestions, triggerReaction])

  // Map questions: categoryId -> teamId -> diff -> question
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
    if (sessionId) {
      await (supabase.from('sessions') as any).update({ state: 'finished' }).eq('id', sessionId)
    }
    store.setPhase('finished')
  }

  const handleTileClick = (sq: any) => {
    store.setSelectedQuestion(sq)
    triggerReaction('thinking')
  }

  const handleModalClose = async () => {
    store.setSelectedQuestion(null)
    triggerReaction('idle' as any)

    // Advance turn logic
    const nextTeamIndex = (currentTeamIndex + 1) % teams.length
    store.setCurrentTeam(nextTeamIndex)
    if (sessionId) {
      await (supabase.from('sessions') as any).update({ current_team_index: nextTeamIndex }).eq('id', sessionId)
    }

    if (allUsed) handleEndGame()
  }

  // ── WINNER SCREEN ──────────────────────────────────────────────────
  if (phase === 'finished') {
    // ... [WINNER SCREEN CODE REMAINS THE SAME]
    const sorted = [...teams].sort((a, b) => b.score - a.score)
    const winner = sorted[0]
    const medals = ['🥇','🥈','🥉']

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: ['#7c3aed','#f59e0b','#10b981','#ef4444','#06b6d4'][i % 5],
                left: `${(i / 24) * 100}%`, top: -20
              }}
              animate={{ y: ['0vh','110vh'], rotate: [0,360*2], opacity:[1,0] }}
              transition={{ duration: 2.5 + Math.random()*2, delay: Math.random()*1.5, repeat: Infinity }}
            />
          ))}
        </div>

        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="relative z-10 w-full max-w-lg text-center">
          <Mascot state="correct" size={140} isTalking={isTalking} customMascot={activeCustomMascot} className="mx-auto mb-6" />
          <h1 className="text-5xl font-black gradient-text-primary mb-2">انتهت اللعبة!</h1>
          <p className="text-xl mb-10" style={{ color: 'var(--color-text-secondary)' }}>
            الفائز: <span className="font-black gradient-text-accent">{winner?.name}</span> 🎉
          </p>

          <div className="card-glass p-6 mb-8 space-y-3">
            {sorted.map((team, i) => (
              <motion.div key={team.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className="flex items-center gap-4 p-3 rounded-2xl"
                style={{
                  background: i===0 ? 'rgba(234,179,8,0.12)' : 'var(--color-surface-2)',
                  border: i===0 ? '1px solid rgba(234,179,8,0.3)' : '1px solid var(--color-border)'
                }}>
                <span className="text-2xl">{medals[i]||'🎖️'}</span>
                <div className="w-4 h-4 rounded-full shrink-0" style={{ background: team.color }} />
                <span className="flex-1 font-bold" style={{ color: 'var(--color-text-primary)' }}>{team.name}</span>
                <span className="text-xl font-black" style={{ color: team.color }}>{team.score}</span>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>نقطة</span>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary btn-lg flex-1">لوحة التحكم</button>
            <button onClick={() => router.push(`/game/setup/${sessionId}`)} className="btn btn-ghost btn-lg flex-1">جلسة جديدة</button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Helper to determine spatial layout
  const getTeamPositionClasses = (count: number, index: number) => {
    if (count === 2) {
      if (index === 0) return 'left-8 top-1/2 -translate-y-1/2'
      if (index === 1) return 'right-8 top-1/2 -translate-y-1/2'
    }
    if (count === 3) {
      if (index === 0) return 'left-12 top-24'
      if (index === 1) return 'right-12 top-24'
      if (index === 2) return 'bottom-32 left-1/2 -translate-x-1/2'
    }
    if (count >= 4) {
      if (index === 0) return 'left-12 top-24'
      if (index === 1) return 'right-12 top-24'
      if (index === 2) return 'left-12 bottom-32'
      if (index === 3) return 'right-12 bottom-32'
    }
    return ''
  }

  // ── GAME BOARD (CINEMATIC) ──────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden relative" style={{ background: 'var(--color-bg)' }}>
      
      {/* Global Background Glow reflecting Active Team */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-0 transition-colors duration-1000"
        animate={{ background: `radial-gradient(circle at center, ${activeTeam?.color}15 0%, transparent 70%)` }}
      />

      {/* ── TOP NAV ── */}
      <div className="relative z-50 flex items-center justify-between px-5 py-3 shrink-0 backdrop-blur-md bg-black/40 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Mascot state={mascotState as any} size={44} isTalking={isTalking} customMascot={activeCustomMascot} />
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

      {/* ── CATEGORY SCROLL VIEW ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth relative z-10 hide-scrollbar" ref={scrollRef}>
        
        {categories.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/50">لا توجد فئات.</p>
          </div>
        ) : (
          categories.map((cat, ci) => (
            <div key={cat.id} className="w-full h-[calc(100vh-68px)] shrink-0 snap-center relative flex items-center justify-center">
              
              {/* Category Centerpiece */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.5 }}
                className="z-20 flex flex-col items-center justify-center text-center p-8 rounded-3xl"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
              >
                <div className="w-24 h-24 mb-6 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                  {cat.icon ? (
                    <img src={cat.icon} alt={cat.name} className="w-16 h-16 object-contain drop-shadow-lg" />
                  ) : (
                    <span className="text-4xl">🎮</span>
                  )}
                </div>
                <h2 className="text-4xl font-black tracking-tight text-white/90 uppercase">{cat.name}</h2>
                <p className="mt-2 text-sm text-white/40 font-mono tracking-widest uppercase">الفئة {ci + 1}</p>
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
                    viewport={{ once: false }}
                    className={`absolute z-10 flex flex-col gap-3 p-5 rounded-3xl transition-all duration-500 max-w-[200px] w-full ${posClass}`}
                    style={{
                      background: isActive ? `${team.color}15` : 'rgba(0,0,0,0.5)',
                      backdropFilter: isActive ? 'blur(12px)' : 'blur(4px)',
                      border: isActive ? `1px solid ${team.color}50` : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: isActive ? `0 0 30px ${team.color}20` : 'none',
                      opacity: isActive ? 1 : 0.4,
                      filter: isActive ? 'none' : 'grayscale(60%)',
                      transform: isActive ? 'scale(1.05)' : 'scale(0.95)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full shadow-lg" style={{ background: team.color, boxShadow: `0 0 10px ${team.color}` }} />
                      <h3 className="font-bold text-sm truncate" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.6)' }}>{team.name}</h3>
                    </div>

                    <div className="flex flex-col gap-2">
                      {DIFF_ORDER.map(diff => {
                        const sq = boardMap[cat.id]?.[team.id]?.[diff]
                        const dc = DIFF_COLORS[diff]
                        if (!sq) return null

                        const used = sq.used
                        const disabled = used || !isActive

                        return (
                          <button
                            key={sq.id}
                            disabled={disabled}
                            onClick={() => handleTileClick(sq)}
                            className="relative flex items-center justify-between p-3 rounded-xl transition-all w-full overflow-hidden group"
                            style={{
                              background: used ? 'rgba(255,255,255,0.02)' : dc.bg,
                              border: `1px solid ${used ? 'rgba(255,255,255,0.05)' : dc.border}`,
                              cursor: disabled ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {!used && isActive && (
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: `linear-gradient(90deg, ${dc.color}20, transparent)` }} />
                            )}
                            <span className="text-xs font-bold uppercase tracking-wider relative z-10" style={{ color: used ? '#666' : dc.color }}>
                              {used ? '✓' : DIFF_LABELS[diff]}
                            </span>
                            <span className="text-lg font-black tabular-nums relative z-10" style={{ color: used ? '#444' : '#fff' }}>
                              {pts(diff)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )
              })}

            </div>
          ))
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
            activeCustomMascot={activeCustomMascot}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
