'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import { useGameStore } from '@/store/gameStore'
import GameBoard from '@/components/GameBoard'
import FightingParticles from '@/components/FightingParticles'
import { useMascotBehavior } from '@/hooks/useMascotBehavior'
import Mascot from '@/components/Mascot'

const LOADING_LINES = [
  'جاري تحضير الأسئلة...',
  'راقي الأسئلة قادم 😎',
  'نختار لك الأصعب فقط...',
  'تحمّل، يستاهل الانتظار!',
  'تجهيز الساحة للمعركة...',
  'المعرفة تنتظرك...',
]

function CinematicLoader({ teams }: { teams: { color: string; name: string }[] }) {
  const [lineIndex, setLineIndex] = useState(0)
  const primaryColor = teams[0]?.color || '#8B5CF6'

  useEffect(() => {
    const id = setInterval(() => {
      setLineIndex(p => (p + 1) % LOADING_LINES.length)
    }, 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#07071A' }}>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute rounded-full"
          style={{ width: '60vw', height: '60vw', top: '50%', left: '50%', x: '-50%', y: '-50%', background: `radial-gradient(circle,${primaryColor}15 0%,transparent 70%)`, filter: 'blur(60px)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Teams shown at top */}
      {teams.length > 0 && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          {teams.map((t, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
              style={{ background: `${t.color}15`, border: `1px solid ${t.color}30`, color: t.color }}>
              <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
              {t.name}
            </div>
          ))}
        </div>
      )}

      {/* Center: Mascot + text */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          <Mascot state="hype" size={110} color={primaryColor} isTalking />
        </motion.div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: primaryColor }} />
            <span className="text-xs font-mono tracking-[0.3em] uppercase text-white/30">
              تحميل اللعبة
            </span>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: primaryColor }} />
          </div>

          <AnimatePresence mode="wait">
            <motion.p key={lineIndex}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-xl md:text-2xl font-black text-white min-h-[36px]"
              dir="rtl">
              {LOADING_LINES[lineIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full"
              style={{ background: primaryColor }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/20 text-xs">
        <span>العفريف</span>
        <span>•</span>
        <span>تجربة التحدي</span>
      </div>
    </div>
  )
}

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const supabase = createClient()
  
  // Extract stable actions & state to avoid effect loops
  const setSession = useGameStore(s => s.setSession)
  const setPhase = useGameStore(s => s.setPhase)
  const setTeams = useGameStore(s => s.setTeams)
  const setQuestions = useGameStore(s => s.setQuestions)
  const setCurrentQuestion = useGameStore(s => s.setCurrentQuestion)
  const setCurrentTeam = useGameStore(s => s.setCurrentTeam)
  const setCategories = useGameStore(s => s.setCategories)
  const setScoringConfig = useGameStore(s => s.setScoringConfig)
  const setTimer = useGameStore(s => s.setTimer)
  const updateScore = useGameStore(s => s.updateScore)
  const markQuestionUsed = useGameStore(s => s.markQuestionUsed)
  
  const teams = useGameStore(s => s.teams) // Used for CinematicLoader
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGame, setShowGame] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const { settings } = useMascotBehavior()

  // Load game data
  useEffect(() => {
    setError(null)
    setLoading(true)
    setShowGame(false)

    // Hard failsafe: always show game after 5s even if queries hang
    const failsafe = setTimeout(() => {
      setLoading(false)
      setShowGame(true)
    }, 5000)

    async function load() {
      if (!sessionId) { clearTimeout(failsafe); return }

      // Retry session fetch up to 3 times
      let session: any = null
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await (supabase.from('sessions') as any)
          .select('*').eq('id', sessionId).single()
        if (result.data) { session = result.data; break }
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
      }

      if (!session) {
        clearTimeout(failsafe)
        setError('لم يتم العثور على الجلسة')
        setLoading(false)
        return
      }

      setSession(session.id, session.mode as any)
      setPhase(session.state as any)

      // Fetch all remaining data in parallel
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
        } else if (questionsRes.data) {
          const catIds = [...new Set(questionsRes.data.map((sq: any) => sq.question?.category_id).filter(Boolean))] as string[]
          if (catIds.length > 0) {
            const { data: catData } = await (supabase.from('categories') as any).select('id, name, icon, image_url').in('id', catIds)
            if (catData) setCategories(catData)
          }
        }

        if (configRes.data) {
          const c = configRes.data
          setScoringConfig({
            easy_points: c.easy_points,
            medium_points: c.medium_points,
            hard_points: c.hard_points,
            default_timer_seconds: c.default_timer_seconds,
            time_adjustment_seconds: c.time_adjustment_seconds ?? 5,
            glow_enabled: c.glow_enabled ?? true,
            glow_intensity: c.glow_intensity ?? 40,
            flash_start_seconds: c.flash_start_seconds ?? 15,
          })
          setTimer(c.default_timer_seconds)
        }
      } catch (err) {
        console.warn('Some game data failed to load, continuing anyway:', err)
      }

      clearTimeout(failsafe)
      setLoading(false)
      setShowGame(true)
    }

    load()
    return () => clearTimeout(failsafe)
  }, [sessionId, supabase, retryCount, setSession, setPhase, setTeams, setQuestions, setCurrentQuestion, setCurrentTeam, setCategories, setScoringConfig, setTimer])

  // Realtime sync
  useEffect(() => {
    if (!sessionId) return
    const ch = supabase.channel(`session:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        payload => {
          const u = payload.new as any
          if (u.state) setPhase(u.state)
          if (u.current_question_index !== undefined) setCurrentQuestion(u.current_question_index)
          // Only sync turn from DB if the modal is NOT open — prevents flickering when DB lags
          if (u.current_team_index !== undefined && !useGameStore.getState().selectedQuestion) {
            setCurrentTeam(u.current_team_index)
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams', filter: `session_id=eq.${sessionId}` },
        payload => { const u = payload.new as any; updateScore(u.id, u.score) })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_questions', filter: `session_id=eq.${sessionId}` },
        payload => {
          const u = payload.new as any
          if (u.used) markQuestionUsed(u.id)
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [sessionId, supabase, setPhase, setCurrentQuestion, setCurrentTeam, updateScore, markQuestionUsed])

  // Error state
  if (error) return (
    <div className="min-h-screen bg-[#07071A] flex flex-col items-center justify-center gap-5 text-center p-8">
      <div className="text-5xl">⚠️</div>
      <h1 className="text-2xl font-black text-white">{error}</h1>
      <p className="text-white/40 text-sm">تحقق من اتصالك بالإنترنت وحاول مجدداً</p>
      <div className="flex gap-3">
        <button onClick={() => { setRetryCount(c => c + 1) }}
          className="px-6 py-3 rounded-2xl font-bold text-white transition-all hover:scale-[1.02]"
          style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }}>
          إعادة المحاولة ↺
        </button>
        <button onClick={() => router.push('/dashboard')}
          className="px-6 py-3 rounded-2xl font-bold text-white transition-all hover:scale-[1.02]"
          style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
          العودة للوحة
        </button>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#07071A] text-white"
      style={{ fontFamily: "'Cairo','Tajawal',sans-serif" }}>

      {/* Loader → Game crossfade (single AnimatePresence prevents black gap) */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-50">
            <CinematicLoader teams={teams} />
          </motion.div>
        ) : showGame ? (
          <motion.div key="game"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full h-full min-h-screen">
            <FightingParticles teams={teams} />
            <GameBoard />
          </motion.div>
        ) : null}
      </AnimatePresence>

    </main>
  )
}
