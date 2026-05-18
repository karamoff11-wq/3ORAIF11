'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Mascot from './Mascot'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import { useGameStore } from '@/store/gameStore'
import { useSoundSystem } from '@/hooks/useSoundSystem'
import { getRandomHumor } from '@/utils/humor'
import { track } from '@/lib/analytics'
import { useDriftFreeTimer, usePreflightWarmup, useAntiCheatBuzzer, useOptimisticQuestionQueue } from '@/hooks/useElitePerformance'

interface Team { id: string; name: string; color: string; score: number }
interface Question {
  id: string; question: string; answer: string
  difficulty: 'easy' | 'medium' | 'hard'; image_url?: string | null
  category_id?: string | null
}
interface SessionQuestion { id: string; question: Question; used: boolean }
interface Props {
  sq: SessionQuestion
  points: number
  teams: Team[]
  onClose: () => void
  triggerReaction: (type: 'correct' | 'wrong' | 'hype' | 'punishment' | 'thinking' | 'intro', overrideText?: string) => string | void
}

const DIFF = {
  easy: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', label: 'سهل' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'متوسط' },
  hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', label: 'صعب' },
}

export default function QuestionModal({ sq, points, teams, onClose, triggerReaction }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const store = useGameStore()
  const { scoringConfig } = store
  const { playTick } = useSoundSystem()

  const [phase, setPhase] = useState<'idle' | 'revealing' | 'revealed'>('idle')
  const [awarded, setAwarded] = useState(false)
  const [timeLeft, setTimeLeft] = useState(scoringConfig.default_timer_seconds)
  const [timerRunning, setTimerRunning] = useState(true)
  const [humorMessage, setHumorMessage] = useState('')
  const [humorType, setHumorType] = useState<'correct' | 'wrong'>('correct')
  const [answerPhrases, setAnswerPhrases] = useState<{ correct: string[]; wrong: string[] }>({ correct: [], wrong: [] })
  const [mediaVisible, setMediaVisible] = useState(store.mediaRevealed)

  // Sync with store for player views
  useEffect(() => {
    if (store.mediaRevealed) setMediaVisible(true)
  }, [store.mediaRevealed])

  const q = sq.question
  const diff = DIFF[q.difficulty] ?? DIFF.easy
  const activeTeam = teams[store.currentTeamIndex]
  const [teamColor] = useState(activeTeam?.color || '#8B5CF6')
  const categoryName = store.categories?.find(c =>
    c.id === (sq as any).category_id || c.id === q.category_id
  )?.name || ''

  const isTense = phase === 'idle' && timeLeft <= (scoringConfig.flash_start_seconds ?? 15) && timeLeft > 0
  const flashDuration = isTense ? Math.max(0.15, timeLeft / (scoringConfig.flash_start_seconds ?? 15)) : 1

  // Load answer phrases
  useEffect(() => {
    supabase.channel('game_events')
      .on('broadcast', { event: 'reveal_media' }, () => {
        useGameStore.getState().setMediaRevealed(true)
      })
      .subscribe()

    supabase.from('answer_phrases')
      .select('category, text').eq('is_active', true)
      .then(({ data }) => {
        if (data) setAnswerPhrases({
          correct: data.filter((p: any) => p.category === 'correct').map((p: any) => p.text),
          wrong: data.filter((p: any) => p.category === 'wrong').map((p: any) => p.text),
        })
      })
  }, [supabase])

  // Preflight Warmup & Optimistic Pre-fetcher
  usePreflightWarmup(store.sessionQuestions)
  useOptimisticQuestionQueue(store.sessionQuestions, sq.id)

  // Dedicated Web Worker Drift-Free Timer
  const { adjustTimer } = useDriftFreeTimer({
    initialSeconds: scoringConfig.default_timer_seconds,
    running: timerRunning && phase === 'idle' && !store.buzzedTeamId && !awarded,
    onTick: useCallback((sec: number) => {
      setTimeLeft(sec)
      if (sec <= 4 && sec > 0) playTick()
    }, [playTick]),
    onExpire: useCallback(() => {
      setTimeLeft(0)
      setTimerRunning(false)
    }, []),
  })

  const handleReveal = useCallback(() => {
    if (phase !== 'idle' || !store.isHost) return
    setPhase('revealing')
    setTimerRunning(false)
    setTimeout(() => setPhase('revealed'), 600)
  }, [phase, store.isHost])

  const rawBuzz = useCallback(() => {
    if (store.isHost || !store.playerTeamId || store.buzzedTeamId) return

    store.setBuzzedTeamId(store.playerTeamId)
    playTick()

    if (store.broadcastChannel) {
      store.broadcastChannel.send({
        type: 'broadcast',
        event: 'buzz',
        payload: { teamId: store.playerTeamId }
      })
    }
  }, [store, playTick])

  const { triggerBuzz: handleBuzz } = useAntiCheatBuzzer(rawBuzz)

  const finishQuestion = useCallback(async (team: Team | null) => {
    if (awarded) return
    setAwarded(true)

    const isActiveTeam = team?.id === activeTeam?.id
    let spokenText = ''

    if (team) {
      store.updateStreak(team.id, false)
      const isHype = (store.streaks[team.id] || 0) + 1 === 9
      teams.forEach(t => { if (t.id !== team.id) store.updateStreak(t.id, true) })

      spokenText = (triggerReaction(isHype ? 'hype' : isActiveTeam ? 'correct' : 'wrong') as string) || ''
      if (!spokenText) {
        const pool = isActiveTeam ? answerPhrases.correct : answerPhrases.wrong
        spokenText = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : getRandomHumor(isActiveTeam ? 'correct' : 'wrong')
      }
      setHumorType(isActiveTeam ? 'correct' : 'wrong')
    } else {
      teams.forEach(t => store.updateStreak(t.id, true))
      spokenText = (triggerReaction('wrong') as string) || ''
      if (!spokenText) {
        const pool = answerPhrases.wrong
        spokenText = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : getRandomHumor('noOne')
      }
      setHumorType('wrong')
    }

    setHumorMessage(spokenText)

    if (!team || team.id !== activeTeam?.id) {
      if (store.punishmentMode && store.punishments && store.punishments.length > 0 && activeTeam) {
        store.triggerPunishmentPopup(activeTeam)
      }
    }

    // ── MARK QUESTION USED (sync local, then async DB) ──
    store.markQuestionUsed(sq.id)

    // ── ADVANCE TURN NOW (sync, before any awaits) ──
    // Use getState() for guaranteed fresh values — not the stale closure
    const liveStore = useGameStore.getState()
    const totalTeams = liveStore.teams.length
    const nextTeam = totalTeams > 0 ? (liveStore.currentTeamIndex + 1) % totalTeams : 0
    liveStore.setCurrentTeam(nextTeam)

    // Check end-of-game (use fresh state after marking used)
    const liveQuestions = liveStore.sessionQuestions
    const remaining = liveQuestions.filter(q => !q.used).length
    const isLastQuestion = remaining === 0

    // ── Analytics: track every question resolution ──
    track('question_answered', {
      session_id: liveStore.sessionId ?? '',
      correct: !!team && team.id === activeTeam?.id,
      difficulty: q.difficulty ?? 'easy',
    })

    // ── SERVER-AUTHORITATIVE SCORING ──────────────────────────────────────
    // Optimistic local update to fix race conditions with Leaderboard showing old scores
    if (team) {
      store.updateScore(team.id, (team.score || 0) + points)

      fetch('/api/game/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionQuestionId: sq.id, teamId: team.id }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Update local UI with the server-confirmed points
            store.updateScore(team.id, (team.score || 0) + data.pointsAwarded)
          } else {
            console.warn('[submit-answer] Server rejected:', data.error)
            // Fallback: mark used locally at least
            gameEngine.markQuestionUsed(sq.id).catch(() => { })
          }
        })
        .catch(() => {
          // Network failure fallback: keep local state, attempt legacy ops
          console.warn('[submit-answer] Network error — falling back to legacy ops')
          gameEngine.updateTeamScore(team.id, points)
            .then(() => store.updateScore(team.id, (team.score || 0) + points))
            .catch(() => { })
          gameEngine.markQuestionUsed(sq.id).catch(() => { })
          if (liveStore.sessionId) gameEngine.updateSessionTurn(liveStore.sessionId, nextTeam).catch(() => { })
        })
    } else {
      // No winner — still mark question used and advance turn
      gameEngine.markQuestionUsed(sq.id).catch(() => console.warn('Network issue marking question used'))
      if (liveStore.sessionId) {
        gameEngine.updateSessionTurn(liveStore.sessionId, nextTeam)
          .catch(() => console.warn('Network issue updating turn'))
      }
    }

    if (isLastQuestion) {
      // Fluid transition: Let the players see the points added, then smoothly fade to leaderboard
      setTimeout(() => onClose(), 2500)
    }
  }, [awarded, activeTeam, store, teams, triggerReaction, answerPhrases, points, sq.id, onClose])

  // Timer percentage for arc
  const maxTime = scoringConfig.default_timer_seconds
  const pct = timeLeft / maxTime
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  const timerColor = timeLeft > 10 ? teamColor : timeLeft > 5 ? '#f59e0b' : '#ef4444'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6"
      style={{ backdropFilter: 'blur(20px)', background: 'rgba(3,3,8,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget && awarded) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 32, opacity: 0 }}
        animate={{
          scale: 1, y: 0, opacity: 1,
          boxShadow: isTense
            ? [`-20px 0 60px -10px ${teamColor}`, `20px 0 60px -10px ${teamColor}`, `-20px 0 60px -10px ${teamColor}`]
            : `0 0 80px -20px ${teamColor}60`
        }}
        exit={{ scale: 0.92, y: 32, opacity: 0 }}
        transition={isTense
          ? { boxShadow: { repeat: Infinity, duration: flashDuration } }
          : { type: 'spring', stiffness: 300, damping: 28 }
        }
        onClick={e => e.stopPropagation()}
        className="relative w-full flex flex-col overflow-hidden shadow-2xl"
        style={{
          maxWidth: '94vw',
          height: '92vh',
          background: 'rgba(5, 5, 12, 0.96)',
          backdropFilter: 'blur(60px)',
          borderRadius: 40,
          border: `1px solid rgba(255,255,255,0.08)`,
          willChange: 'transform, opacity, box-shadow',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        {/* Cinematic Glowing Side Strips (LED Effect - Outward Glow Only) */}
        <motion.div
          className="absolute inset-y-0 left-0 w-1.5 z-50"
          animate={{ opacity: [0.3, 1, 0.3], background: [`${teamColor}30`, teamColor, `${teamColor}30`] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ boxShadow: `-15px 0 30px ${teamColor}` }}
        />
        <motion.div
          className="absolute inset-y-0 right-0 w-1.5 z-50"
          animate={{ opacity: [0.3, 1, 0.3], background: [`${teamColor}30`, teamColor, `${teamColor}30`] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ boxShadow: `15px 0 30px ${teamColor}` }}
        />

        {/* Ambient Corner Glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20" style={{ background: teamColor }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20" style={{ background: teamColor }} />
        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0"
          style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>

          {/* Points */}
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black" style={{ color: teamColor }}>+{points}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>
              {diff.label}
            </span>
          </div>

          {/* Category */}
          {categoryName && (
            <span className="text-sm font-bold text-white/40 tracking-widest uppercase hidden sm:block">
              {categoryName}
            </span>
          )}

          {/* Timer */}
          {phase === 'idle' && (
            <div className="flex items-center gap-3">
              {/* Adjust time */}
              <div className="flex items-center gap-1">
                <button onClick={() => adjustTimer(Math.max(0, timeLeft - (scoringConfig.time_adjustment_seconds || 5)))}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all text-lg font-black">−</button>
                <button onClick={() => setTimerRunning(r => !r)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
                  {timerRunning
                    ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                    : <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  }
                </button>
                <button onClick={() => adjustTimer(timeLeft + (scoringConfig.time_adjustment_seconds || 5))}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all text-lg font-black">+</button>
              </div>

              {/* Arc timer */}
              <div className="relative flex items-center justify-center">
                <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="34" cy="34" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
                  <motion.circle cx="34" cy="34" r={r}
                    stroke={timerColor}
                    strokeWidth="4" fill="none"
                    strokeDasharray={circ}
                    animate={{ strokeDashoffset: circ - dash }}
                    transition={{ duration: 0.9, ease: 'linear' }}
                    strokeLinecap="round"
                  />
                </svg>
                <motion.span
                  className="absolute text-xl font-black tabular-nums"
                  animate={isTense ? { scale: [1, 1.12, 1] } : {}}
                  transition={{ repeat: Infinity, duration: flashDuration }}
                  style={{ color: timerColor }}
                >
                  {timeLeft}
                </motion.span>
              </div>
            </div>
          )}
        </div>

        {/* ── MASCOT ── */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <Mascot state={store.mascotState} size={64} isTalking={store.isTalking} color={teamColor} />
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 px-6 pb-6 flex flex-col gap-4">

          {/* Question Section */}
          <div className="text-center px-4 py-4 relative z-10 w-full flex items-center justify-center min-h-[120px]">
            <motion.h2
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={`font-black text-white tracking-tight ${
                q.question.length > 180 ? 'text-lg md:text-2xl leading-snug' :
                q.question.length > 100 ? 'text-2xl md:text-4xl leading-snug' :
                q.question.length > 50  ? 'text-3xl md:text-5xl leading-tight' :
                'text-4xl md:text-6xl leading-[1.15]'
              }`}
              style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)', wordBreak: 'break-word' }}
            >
              {q.question}
            </motion.h2>
          </div>

          {/* Image with Reveal Logic */}
          <AnimatePresence>
            {q.image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex-1 min-h-[350px] w-full rounded-[2.5rem] overflow-hidden bg-black/40 border border-white/10 shadow-2xl group"
              >
                {/* Scanning Effect if Hidden */}
                {!mediaVisible && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-3xl bg-black/60">
                    <motion.div
                      animate={{ y: [-100, 300] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent shadow-[0_0_20px_white]"
                    />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <span className="text-5xl opacity-40">🖼️</span>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Media Encrypted</p>
                    </div>
                  </div>
                )}

                <img
                  src={q.image_url}
                  alt=""
                  className={`w-full h-full object-contain p-6 transition-all duration-1000 ${mediaVisible ? 'blur-0 scale-100 opacity-100' : 'blur-3xl scale-110 opacity-30'}`}
                />

                {/* Reveal Media Button (Host Only) */}
                {store.isHost && !mediaVisible && (
                  <button
                    onClick={() => {
                      setMediaVisible(true)
                      store.setMediaRevealed(true)
                      if (store.broadcastChannel) {
                        store.broadcastChannel.send({
                          type: 'broadcast',
                          event: 'reveal_media',
                          payload: {}
                        })
                      }
                    }}
                    className="absolute inset-0 z-40 flex items-center justify-center group/btn"
                  >
                    <div className="px-6 py-3 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest shadow-2xl scale-90 group-hover/btn:scale-100 transition-all">
                      Show Media
                    </div>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PHASE: idle → reveal button or buzz UI ── */}
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.div key="idle-ui"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex justify-center mt-2 flex-col gap-4">

                {/* For Host */}
                {store.isHost ? (
                  <>
                    {store.buzzedTeamId && (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-3 rounded-2xl mb-2" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <p className="text-sm font-bold uppercase text-amber-500/70 mb-1">فريق ضغط الزر!</p>
                        <p className="text-2xl font-black text-amber-400">
                          {teams.find(t => t.id === store.buzzedTeamId)?.name} 🎤
                        </p>
                      </motion.div>
                    )}
                    <button onClick={handleReveal}
                      className="group relative px-10 py-4 rounded-2xl font-black text-lg tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] overflow-hidden mx-auto"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', color: 'white' }}>
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: `radial-gradient(circle at center, ${teamColor}20, transparent)` }} />
                      <span className="relative flex items-center gap-2.5">
                        <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        كشف الإجابة
                      </span>
                    </button>
                  </>
                ) : (
                  /* For Players */
                  <div className="flex flex-col items-center">
                    {store.buzzedTeamId ? (
                      <div className="text-center p-6 rounded-3xl w-full border-2" style={{
                        background: store.buzzedTeamId === store.playerTeamId ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderColor: store.buzzedTeamId === store.playerTeamId ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                      }}>
                        {store.buzzedTeamId === store.playerTeamId ? (
                          <div className="text-2xl font-black text-emerald-400">فريقك ضغط الزر! 🎤</div>
                        ) : (
                          <div className="text-2xl font-black text-rose-400">فريق آخر ضغط الزر! 🛑</div>
                        )}
                        <div className="text-sm text-white/50 mt-2 font-bold">في انتظار المضيف...</div>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBuzz}
                        className="w-48 h-48 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl relative overflow-hidden group"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #991b1b)', borderColor: '#fca5a5' }}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-all"></div>
                        <span className="text-5xl mb-2 relative z-10">🔴</span>
                        <span className="text-3xl font-black relative z-10">إضغط!</span>
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PHASE: revealing → spinner ── */}
            {phase === 'revealing' && (
              <motion.div key="spinner"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex justify-center py-6">
                <div className="w-10 h-10 rounded-full border-2 animate-spin"
                  style={{ borderColor: `${teamColor}40`, borderTopColor: teamColor }} />
              </motion.div>
            )}

            {/* ── PHASE: revealed ── */}
            {phase === 'revealed' && (
              <motion.div key="revealed"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-5">

                {/* Answer box */}
                <div className="rounded-2xl p-4 text-center"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3 text-emerald-500/60">الإجابة الصحيحة</p>
                  <motion.p initial={{ scale: 0.85 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 320, delay: 0.05 }}
                    className="text-3xl md:text-4xl font-black"
                    style={{ color: '#10b981', textShadow: '0 0 24px rgba(16,185,129,0.4)' }}>
                    {q.answer}
                  </motion.p>
                </div>

                {/* Humor message */}
                <AnimatePresence>
                  {humorMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-3 px-5 rounded-2xl font-bold text-lg"
                      style={{
                        background: humorType === 'correct' ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
                        border: `1px solid ${humorType === 'correct' ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}`,
                        color: humorType === 'correct' ? '#10b981' : '#f87171',
                      }}>
                      {humorMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Award section - ONLY HOST */}
                {store.isHost && (
                  !awarded ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-center text-sm font-bold uppercase tracking-widest text-white/35">
                        من أجاب صحيح؟
                      </p>

                      {/* Team buttons */}
                      <div className={`grid gap-3 ${teams.length === 2 ? 'grid-cols-2' : teams.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        {teams.map(team => (
                          <motion.button key={team.id}
                            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                            onClick={() => finishQuestion(team)}
                            className="py-3 px-3 rounded-2xl font-black text-xl transition-all relative overflow-hidden group"
                            style={{
                              background: `${team.color}12`,
                              border: `2px solid ${team.color}35`,
                              color: team.color,
                            }}>
                            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: `${team.color}15` }} />
                            <span className="relative flex flex-col items-center gap-1">
                              <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ background: team.color }} />
                                {team.name}
                              </span>
                              <span className="text-xs font-semibold opacity-50">{team.score} نقطة</span>
                            </span>
                          </motion.button>
                        ))}
                      </div>

                      {/* No one button */}
                      <button onClick={() => finishQuestion(null)}
                        className="w-full py-3 rounded-2xl font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.22)',
                        }}>
                        لا أحد أجاب ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <motion.button
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          background: `${teamColor}15`,
                          border: `1px solid ${teamColor}30`,
                          color: teamColor,
                        }}>
                        العودة للوحة ←
                      </motion.button>
                      {store.punishmentMode && store.punishments && store.punishments.length > 0 && activeTeam && (
                        <motion.button
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                          onClick={() => store.triggerPunishmentPopup(activeTeam)}
                          className="w-full py-3.5 rounded-2xl font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                          style={{
                            background: 'rgba(239,68,68,0.12)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444',
                            boxShadow: '0 0 20px rgba(239,68,68,0.15)'
                          }}>
                          <span>⚡ تطبيق عقوبة على {activeTeam.name} ✕</span>
                        </motion.button>
                      )}
                    </div>
                  )
                )}

                {/* Player waiting state after reveal */}
                {!store.isHost && (
                  <div className="text-center py-6 text-white/40 font-bold border-t border-white/10 mt-2">
                    في انتظار المضيف لتسجيل النقاط... ⏳
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </motion.div>
  )
}
