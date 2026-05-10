'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import GameBoard from '@/components/GameBoard'
import dynamic from 'next/dynamic'
import { useMascotBehavior } from '@/hooks/useMascotBehavior'
import Mascot from '@/components/Mascot'
import { useTranslator } from '@/lib/i18n'

// Lazy-loaded: heavy canvas animation, only needed during active gameplay
const FightingParticles = dynamic(() => import('@/components/FightingParticles'), { ssr: false })

function CinematicLoader({ teams, lang }: { teams: { color: string; name: string }[], lang: 'AR' | 'EN' }) {
  const t = useTranslator()
  const { accentColor } = useFeedbackStore()
  const [lineIndex, setLineIndex] = useState(0)
  const primaryColor = teams[0]?.color || accentColor || '#8B5CF6'

  const lines = [
    t('game_prep_q'),
    t('game_prep_mascot'),
    t('game_prep_hard'),
    t('game_prep_wait'),
    t('game_prep_arena'),
    t('game_prep_know')
  ]

  useEffect(() => {
    const id = setInterval(() => setLineIndex(p => (p + 1) % lines.length), 1800)
    return () => clearInterval(id)
  }, [lines.length])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute rounded-full"
          style={{ width: '60vw', height: '60vw', top: '50%', left: '50%', x: '-50%', y: '-50%', background: `radial-gradient(circle,${primaryColor}15 0%,transparent 70%)`, filter: 'blur(100px)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="absolute inset-0 opacity-[0.025] grid-bg" />
      </div>

      {/* Teams shown at top */}
      {teams.length > 0 && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 px-6">
          {teams.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-5 py-2.5 rounded-2xl glass-card text-xs font-black uppercase tracking-wider"
              style={{ borderColor: `${t.color}30`, color: t.color }}>
              <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ background: t.color }} />
              {t.name}
            </motion.div>
          ))}
        </div>
      )}

      {/* Center: Mascot + text */}
      <div className="relative z-10 flex flex-col items-center gap-10 text-center px-8">
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <Mascot state="hype" size={140} color={primaryColor} isTalking />
        </motion.div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: primaryColor }} />
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white/20">
              {t('game_loading')}
            </span>
            <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: primaryColor }} />
          </div>

          <AnimatePresence mode="wait">
            <motion.p key={lineIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}
              className="text-2xl md:text-3xl font-black text-white min-h-[40px] tracking-tight">
              {lines[lineIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/10 text-[10px] font-black uppercase tracking-[0.5em]">
        <span>Al-Arif</span>
        <span>*</span>
        <span>{t('game_footer')}</span>
      </div>
    </div>
  )
}

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  
  const { lang, mounted } = useFeedbackStore()
  const t = useTranslator()

  const {
    setSession, setPhase, setTeams, setQuestions, setCurrentQuestion, setCurrentTeam,
    setCategories, setScoringConfig, setTimer, updateScore, markQuestionUsed, teams
  } = useGameStore()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGame, setShowGame] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useMascotBehavior()

  useEffect(() => {
    setError(null)
    setLoading(true)
    setShowGame(false)

    const failsafe = setTimeout(() => { setLoading(false); setShowGame(true) }, 6000)

    async function load() {
      if (!sessionId) return
      let session: any = null
      for (let i = 0; i < 3; i++) {
        const { data } = await (supabase.from('sessions') as any).select('*').eq('id', sessionId).single()
        if (data) { session = data; break }
        await new Promise(r => setTimeout(r, 1000))
      }

      if (!session) {
        setError(t('game_error_title'))
        setLoading(false)
        return
      }

      setSession(session.id, session.mode as any)
      setPhase(session.state as any)

      // Identify Host vs Player
      const { data: { user } } = await supabase.auth.getUser()
      const isHost = user?.id === session.host_id
      useGameStore.getState().setIsHost(isHost)

      if (!isHost) {
        const pTeam = sessionStorage.getItem(`trivia_team_${sessionId}`)
        if (pTeam) useGameStore.getState().setPlayerTeamId(pTeam)
      }

      try {
        const [teamsRes, questionsRes, sessionCatsRes, configRes] = await Promise.all([
          (supabase.from('teams') as any).select('*').eq('session_id', sessionId).order('created_at'),
          (supabase.from('session_questions') as any).select('*, question:questions(*)').eq('session_id', sessionId).order('order_index', { ascending: true }),
          (supabase.from('session_categories') as any).select('category_id, categories(id, name, icon, image_url)').eq('session_id', sessionId),
          (supabase.from('scoring_config') as any).select('*').single(),
        ])

        if (teamsRes.data) setTeams(teamsRes.data)
        if (questionsRes.data) {
          setQuestions(questionsRes.data)
          setCurrentQuestion(session.current_question_index ?? 0)
          setCurrentTeam(session.current_team_index ?? 0)
        }
        if (sessionCatsRes.data?.length > 0) {
          setCategories(sessionCatsRes.data.map((sc: any) => sc.categories).filter(Boolean))
        }
        if (configRes.data) {
          const c = configRes.data
          setScoringConfig({
            easy_points: c.easy_points, medium_points: c.medium_points, hard_points: c.hard_points,
            default_timer_seconds: c.default_timer_seconds, time_adjustment_seconds: c.time_adjustment_seconds ?? 5,
            glow_enabled: c.glow_enabled ?? true, glow_intensity: c.glow_intensity ?? 40, flash_start_seconds: c.flash_start_seconds ?? 15,
          })
          setTimer(c.default_timer_seconds)
        }
      } catch (err) { console.warn(err) }

      clearTimeout(failsafe)
      setLoading(false)
      setShowGame(true)
    }

    load()
    return () => clearTimeout(failsafe)
  }, [sessionId, supabase, retryCount, setSession, setPhase, setTeams, setQuestions, setCurrentQuestion, setCurrentTeam, setCategories, setScoringConfig, setTimer])

  useEffect(() => {
    if (!sessionId) return
    const ch = supabase.channel(`session:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        payload => {
          const u = payload.new as any
          if (u.state) setPhase(u.state)
          if (u.current_question_index !== undefined) setCurrentQuestion(u.current_question_index)
          if (u.current_team_index !== undefined && !useGameStore.getState().selectedQuestion) setCurrentTeam(u.current_team_index)
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams', filter: `session_id=eq.${sessionId}` },
        p => { updateScore((p.new as any).id, (p.new as any).score) })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_questions', filter: `session_id=eq.${sessionId}` },
        p => { markQuestionUsed((p.new as any).id) })
      // ── SUPABASE BROADCAST FOR REALTIME EVENTS ──
      .on('broadcast', { event: 'open_question' }, (payload) => {
        const st = useGameStore.getState()
        if (!st.isHost) {
          st.setSelectedQuestion(payload.payload.sq)
          st.setBuzzedTeamId(null)
        }
      })
      .on('broadcast', { event: 'close_question' }, () => {
        const st = useGameStore.getState()
        if (!st.isHost) {
          st.setSelectedQuestion(null)
          st.setBuzzedTeamId(null)
        }
      })
      .on('broadcast', { event: 'buzz' }, (payload) => {
        const st = useGameStore.getState()
        // First buzz wins!
        if (!st.buzzedTeamId) {
          st.setBuzzedTeamId(payload.payload.teamId)
        }
      })
      .subscribe()

    useGameStore.getState().setBroadcastChannel(ch)

    return () => { 
      supabase.removeChannel(ch)
      useGameStore.getState().setBroadcastChannel(null)
    }
  }, [sessionId, supabase, setPhase, setCurrentQuestion, setCurrentTeam, updateScore, markQuestionUsed])

  if (!mounted) return null
  const dir = lang === 'AR' ? 'rtl' : 'ltr'

  if (error) return (
    <div className="min-h-screen bg-[#07071A] flex flex-col items-center justify-center gap-8 text-center p-8" style={{ direction: dir }}>
      <Mascot state="sad" size={100} color="#EF4444" />
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white">{error}</h1>
        <p className="text-white/30 text-sm max-w-xs mx-auto">{t('game_error_sub')}</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-[240px]">
        <button onClick={() => setRetryCount(c => c + 1)} className="w-full py-4 rounded-2xl font-black text-white glass-card hover:bg-white/5 transition-all">
          {t('game_retry')}
        </button>
        <button onClick={() => router.push('/dashboard')} className="w-full py-4 rounded-2xl font-black text-white/50 hover:text-white transition-all">
          {t('game_back_dash')}
        </button>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#07071A] text-white" style={{ fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif' }}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 z-50">
            <CinematicLoader teams={teams} lang={lang} />
          </motion.div>
        ) : showGame ? (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="relative z-10 w-full h-full min-h-screen">
            <FightingParticles teams={teams} />
            <GameBoard />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  )
}
