'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import { useSession } from '@/hooks/useSession'
import FightingParticles from '@/components/FightingParticles'
import Mascot from '@/components/Mascot'
import toast from 'react-hot-toast'
import { useFeedbackStore } from '@/store/feedbackStore'
import { createTranslator, type TranslationKey } from '@/lib/i18n'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface CropConfig {
  cat_setup?: { zoom?: number; x?: number; y?: number }
}

interface Category {
  id:           string
  name:         string
  topic_id:     string
  image_url?:   string
  description?: string
  crop_config?: CropConfig
}

interface Topic {
  id:              string
  name:            string
  icon?:           string
  color?:          string
  order_index?:    number
  created_at?:     string
  /** Admin field: full-bleed blurred page background */
  background_url?: string
  /** Admin field: banner image behind topic title */
  banner_url?:     string
  categories:      Category[]
}

interface Team {
  name:  string
  color: string
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const TEAM_COLORS = [
  '#8B5CF6', '#EC4899', '#3B82F6',
  '#10B981', '#F59E0B', '#EF4444',
] as const

const MAX_CATS = 6

// Stable asteroid SVG paths (irregular rock shapes)
const ASTEROID_PATHS = [
  'M28,4 L62,2 L88,20 L96,50 L82,74 L52,80 L20,76 L4,55 L6,26 Z',
  'M18,10 L50,3 L80,12 L94,38 L88,65 L62,80 L28,78 L8,58 L5,30 Z',
  'M35,6 L68,4 L90,28 L92,56 L74,78 L44,82 L16,68 L5,40 L18,18 Z',
  'M22,8 L58,2 L84,22 L95,52 L80,76 L48,82 L18,70 L3,44 L10,18 Z',
]

// ─────────────────────────────────────────────
// ProgressRing
// ─────────────────────────────────────────────
function ProgressRing({ count, max, color }: { count: number; max: number; color: string }) {
  const r         = 22
  const circ      = 2 * Math.PI * r
  const isMax     = count === max
  const ringColor = isMax         ? '#ef4444'
                  : count >= max - 1 ? '#f59e0b'
                  : color

  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
        <motion.circle
          cx="28" cy="28" r={r} fill="none" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={circ}
          animate={{
            stroke:           ringColor,
            strokeDashoffset: circ - (count / max) * circ,
          }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      {/* Red pulse when at cap */}
      <AnimatePresence>
        {isMax && (
          <motion.div key="cap-pulse"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 rounded-full border-2 border-red-500 pointer-events-none"
          />
        )}
      </AnimatePresence>
      <div className="text-center leading-none z-10">
        <motion.span key={count}
          initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-sm font-black block"
          style={{ color: isMax ? '#ef4444' : 'white' }}>
          {count}
        </motion.span>
        <span className="text-[8px] text-white/25 font-bold">/{max}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SpaceBackground  — Teams modal only
// ─────────────────────────────────────────────
function SpaceBackground({ teams }: { teams: Team[] }) {
  // ✅ Fix: fully deterministic (no Math.random) — no hydration mismatch, no re-render on teams ref change.
  const stars = useMemo(() =>
    Array.from({ length: 160 }, (_, i) => ({
      id:   i,
      x:    (i * 137.508) % 100,
      y:    (i * 97.631)  % 100,
      size: (i % 5) * 0.5 + 0.5,
      del:  (i % 7) * 0.9,
      dur:  (i % 4) * 0.8 + 2,
    })), []
  )

  // ✅ Fix: dep is the color string, not the teams array reference
  const colorKey = teams.map(t => t.color).join(',')

  const asteroids = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const team = teams[i % Math.max(teams.length, 1)]
      const edge = i % 4
      const frac = ((i * 73) % 80) + 10
      return {
        id:    i,
        color: team?.color ?? '#8B5CF6',
        size:  (i % 4) * 12 + 18,
        sx:    edge === 3 ? -6  : edge === 1 ? 106 : frac,
        sy:    edge === 0 ? -6  : edge === 2 ? 106 : frac,
        ex:    edge === 3 ? 110 : edge === 1 ? -10 : 100 - frac,
        ey:    edge === 0 ? 110 : edge === 2 ? -10 : 100 - frac,
        dur:   (i % 5) * 5 + 24,
        del:   -((i * 11) % 40),
        rot:   (i % 3) * 180 + 90,
        path:  ASTEROID_PATHS[i % ASTEROID_PATHS.length],
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colorKey]
  )

  const shootingStars = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i, top: i * 18 + 5, delay: i * 5 + 1, repeatDl: i * 4 + 8,
    })), []
  )

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#07071A]">
      {/* Nebula blobs per team */}
      {teams.map((team, i) => (
        <motion.div key={i}
          animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 9 + i * 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full blur-[140px] pointer-events-none"
          style={{
            width: '60vw', height: '60vw', background: team.color,
            ...(i % 2 === 0 ? { top: '-25%', left: '-15%' } : { bottom: '-25%', right: '-15%' }),
          }}
        />
      ))}

      {/* Stars */}
      {stars.map(s => (
        <motion.div key={s.id}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.1, 0.9, 0.1], scale: [1, 1.6, 1] }}
          transition={{ duration: s.dur, delay: s.del, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Asteroids */}
      {asteroids.map(ast => (
        <motion.div key={ast.id}
          className="absolute pointer-events-none"
          style={{ width: ast.size, height: ast.size * 0.85 }}
          animate={{
            left:   [`${ast.sx}%`, `${ast.ex}%`],
            top:    [`${ast.sy}%`, `${ast.ey}%`],
            rotate: [0, ast.rot],
          }}
          transition={{ duration: ast.dur, delay: ast.del, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 100 85" className="w-full h-full"
            style={{ filter: `drop-shadow(0 0 8px ${ast.color}99)` }}>
            <path d={ast.path} fill={ast.color} opacity={0.45} />
            <circle cx="32" cy="32" r="9"  fill="rgba(0,0,0,0.28)" />
            <circle cx="62" cy="55" r="5"  fill="rgba(0,0,0,0.22)" />
            <circle cx="48" cy="22" r="4"  fill="rgba(255,255,255,0.08)" />
          </svg>
        </motion.div>
      ))}

      {/* Shooting stars */}
      {shootingStars.map(s => (
        <motion.div key={s.id}
          className="absolute h-px rounded-full bg-white pointer-events-none"
          style={{ top: `${s.top}%`, width: 60, boxShadow: '0 0 6px white, 30px 0 30px rgba(255,255,255,0.25)' }}
          animate={{ left: ['110%', '-10%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, delay: s.delay, repeat: Infinity, repeatDelay: s.repeatDl, ease: 'easeIn' }}
        />
      ))}

      <div className="absolute inset-0">
        <FightingParticles teams={teams} mode="setup" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TeamsModal
// ─────────────────────────────────────────────
function TeamsModal({
  teams, setTeams, sessionName, setSessionName,
  onClose, onStart, isStarting, accentColor, tr,
}: {
  teams:          Team[]
  setTeams:       React.Dispatch<React.SetStateAction<Team[]>>
  sessionName:    string
  setSessionName: React.Dispatch<React.SetStateAction<string>>
  onClose:        () => void
  onStart:        () => void
  isStarting:     boolean
  accentColor:    string
  tr:             (k: TranslationKey) => string
}) {
  // ✅ Fix: immutable updates — was mutating object refs directly before
  const updateName  = (i: number, name:  string) => setTeams(p => p.map((t, j) => j === i ? { ...t, name  } : t))
  const updateColor = (i: number, color: string) => setTeams(p => p.map((t, j) => j === i ? { ...t, color } : t))
  const removeTeam  = (i: number)                => setTeams(p => p.filter((_, j) => j !== i))
  const addTeam = () => {
    const used = new Set(teams.map(t => t.color))
    // ✅ Fix: scans full palette to avoid color collisions (was % 4, now finds first unused)
    const next = TEAM_COLORS.find(c => !used.has(c)) ?? TEAM_COLORS[0]
    setTeams(p => [...p, { name: `Team ${p.length + 1}`, color: next }])
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      <SpaceBackground teams={teams} />

      <button onClick={onClose}
        className="absolute top-6 end-6 z-20 w-10 h-10 rounded-full bg-white/5 border border-white/10
          flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
        ✕
      </button>

      <motion.div
        initial={{ y: 50, scale: 0.94, opacity: 0 }}
        animate={{ y: 0,  scale: 1,    opacity: 1 }}
        exit={{   y: 50, scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-4xl px-6"
      >
        <div className="bg-white/[0.04] backdrop-blur-[50px] border border-white/[0.08] rounded-[40px] p-10
          shadow-[0_0_100px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]">

          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">
              {tr('setup_step_final')}
            </p>
            <input type="text" value={sessionName} onChange={e => setSessionName(e.target.value)}
              className="bg-transparent text-4xl md:text-5xl font-black text-center w-full
                outline-none placeholder-white/10 text-white"
              placeholder={tr('setup_session_ph')} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {teams.map((team, idx) => (
              <motion.div key={idx}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-5 relative group"
                style={{ borderTopColor: team.color, borderTopWidth: 3 }}
              >
                {teams.length > 2 && (
                  <button onClick={() => removeTeam(idx)}
                    className="absolute top-2 start-2 w-6 h-6 rounded-lg bg-red-500/10 text-red-400 text-xs
                      opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500/20">
                    ✕
                  </button>
                )}
                <div className="flex justify-center mb-3">
                  <Mascot state="idle" size={60} color={team.color} />
                </div>
                <input value={team.name} onChange={e => updateName(idx, e.target.value)}
                  className="w-full bg-transparent text-center font-bold text-sm mb-4 outline-none
                    border-b border-white/10 pb-1.5 text-white focus:border-white/25 transition-colors" />
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {TEAM_COLORS.map(c => (
                    <button key={c} onClick={() => updateColor(idx, c)}
                      className="w-5 h-5 rounded-full flex-shrink-0 transition-all hover:scale-110"
                      style={{
                        background:    c,
                        opacity:       team.color === c ? 1 : 0.35,
                        transform:     team.color === c ? 'scale(1.25)' : undefined,
                        outline:       team.color === c ? '2px solid white' : 'none',
                        outlineOffset: 2,
                        boxShadow:     team.color === c ? `0 0 10px ${c}` : 'none',
                      }} />
                  ))}
                </div>
              </motion.div>
            ))}

            {/* ✅ Fix: cap at TEAM_COLORS.length (6), not hardcoded 8 */}
            {teams.length < TEAM_COLORS.length && (
              <motion.button onClick={addTeam}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="rounded-3xl border-2 border-dashed border-white/[0.07] flex flex-col
                  items-center justify-center gap-2 text-white/20 hover:text-white/50
                  hover:border-white/20 transition-all min-h-[170px]">
                <span className="text-3xl font-thin">+</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{tr('setup_add_team')}</span>
              </motion.button>
            )}
          </div>

          <div className="flex justify-center">
            <motion.button onClick={onStart} disabled={isStarting}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="group relative px-16 py-5 rounded-2xl overflow-hidden bg-white
                transition-all disabled:opacity-50 disabled:pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent
                -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative text-black font-black uppercase tracking-[0.25em] text-sm flex items-center gap-3">
                {isStarting
                  ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : <>{tr('setup_launch')} 🚀</>
                }
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function GameSetupPage() {
  const params = useParams()
  // ✅ Fix: sessionId safely typed — useParams returns string | string[]
  const sessionId = useMemo(
    () => Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId,
    [params.sessionId]
  )

  const router = useRouter()
  const { selectCategories, generateQuestions } = useSession()
  const { accentColor, lang, mounted } = useFeedbackStore()

  // ✅ Fix: memoized — prevents infinite useEffect loop from new reference each render
  const supabase = useMemo(() => createClient(), [])
  const tr       = useMemo(() => createTranslator(lang), [lang])

  // ── State ──
  const [sessionName,        setSessionName]        = useState('جلسة الأصدقاء')
  const [topics,             setTopics]             = useState<Topic[]>([])
  const [activeTopic,        setActiveTopic]        = useState<Topic | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [teams,              setTeams]              = useState<Team[]>([
    { name: lang === 'AR' ? 'الفريق الأول' : 'Team Alpha', color: '#8B5CF6' },
    { name: lang === 'AR' ? 'الفريق الثاني' : 'Team Beta', color: '#EC4899' },
  ])
  const [isLoading,   setIsLoading]   = useState(true)
  const [isStarting,  setIsStarting]  = useState(false)
  const [showTeams,   setShowTeams]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy,      setSortBy]      = useState<'admin'|'alpha'|'popular'|'new'>('admin')

  // ── Load data ──
  useEffect(() => {
    if (!sessionId) return
    async function loadData() {
      try {
        const [topicsRes, catsRes, sessionRes] = await Promise.all([
          (supabase.from('topics')     as any).select('*').order('order_index'),
          (supabase.from('categories') as any).select('*'),
          (supabase.from('sessions')   as any).select('*').eq('id', sessionId).single(),
        ])
        if (topicsRes.error) throw topicsRes.error
        if (catsRes.error)   throw catsRes.error

        const rawTopics: any[] = topicsRes.data ?? []
        const rawCats:   any[] = catsRes.data   ?? []
        if (sessionRes.data?.name) setSessionName(sessionRes.data.name)

        const merged: Topic[] = rawTopics.map(topic => ({
          ...topic,
          categories: rawCats.filter((c: any) => c.topic_id === topic.id),
        }))
        setTopics(merged)
        setActiveTopic(merged[0] ?? null)
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to load topics')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [sessionId, supabase])

  // ── Filtered + sorted topics ──
  const filteredTopics = useMemo<Topic[]>(() => {
    const q      = searchQuery.toLowerCase()
    const result = q
      ? topics.filter(topic =>
          topic.name.toLowerCase().includes(q) ||
          topic.categories.some(c => c.name.toLowerCase().includes(q)))
      : topics

    switch (sortBy) {
      case 'alpha':   return [...result].sort((a, b) => a.name.localeCompare(b.name, lang === 'AR' ? 'ar' : 'en'))
      case 'new':     return [...result].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      case 'popular': return [...result].sort((a, b) => b.categories.length - a.categories.length)
      default:        return [...result].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    }
  }, [topics, searchQuery, sortBy, lang])

  // ✅ Fix: removed `activeTopic` from deps — was causing potential loop.
  // Uses functional setState to read current value without depending on it.
  useEffect(() => {
    if (filteredTopics.length === 0) return
    setActiveTopic(prev =>
      prev && filteredTopics.find(t => t.id === prev.id) ? prev : filteredTopics[0]
    )
  }, [filteredTopics])

  // ✅ Fix: MAX_CATS enforced silently — ring indicator shows red at cap
  const toggleCategory = useCallback((catId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(catId)) return prev.filter(id => id !== catId)
      if (prev.length >= MAX_CATS) return prev
      return [...prev, catId]
    })
  }, [])

  // ✅ Fix: Select All respects MAX_CATS cap
  const handleSelectAll = useCallback(() => {
    if (!activeTopic) return
    const allIds   = activeTopic.categories.map(c => c.id)
    const alreadySel = allIds.filter(id => selectedCategories.includes(id))
    setSelectedCategories(prev => {
      const outside = prev.filter(id => !allIds.includes(id))
      if (alreadySel.length === allIds.length) return outside       // all → deselect
      const slots = MAX_CATS - outside.length
      const toAdd = allIds.filter(id => !prev.includes(id)).slice(0, slots)
      return [...outside, ...alreadySel, ...toAdd]
    })
  }, [activeTopic, selectedCategories])

  // ── Start game ──
  const handleStartGame = async () => {
    if (!sessionId) return
    if (selectedCategories.length === 0) { toast.error(tr('setup_error_cat')); return }
    setIsStarting(true)
    try {
      await Promise.all([
        (supabase.from('sessions') as any).update({ name: sessionName }).eq('id', sessionId),
        (supabase.from('teams')    as any).delete().eq('session_id', sessionId),
      ])
      const { error: teamErr } = await (supabase.from('teams') as any).insert(
        teams.map(t => ({ session_id: sessionId, name: t.name, color: t.color, score: 0 }))
      )
      if (teamErr) throw teamErr

      await selectCategories(sessionId, selectedCategories)
      await generateQuestions(sessionId)
      await (supabase.from('sessions') as any).update({ state: 'playing' }).eq('id', sessionId)
      await gameEngine.startGame(sessionId)

      toast.success(tr('setup_success'))
      router.push(`/game/${sessionId}`)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to launch game')
      setIsStarting(false)
    }
  }

  // ── Derived ──
  const selectedCount = selectedCategories.length
  const atMax         = selectedCount >= MAX_CATS
  const activeColor   = activeTopic?.color ?? accentColor
  const activeIndex   = activeTopic ? filteredTopics.findIndex(t => t.id === activeTopic.id) : -1
  const dir           = lang === 'AR' ? 'rtl' : 'ltr'
  const allCategories = useMemo(() => topics.flatMap(t => t.categories), [topics])

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (!mounted || isLoading) return (
    <div className="min-h-screen bg-[#07071A] flex items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
        <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07071A] text-white flex flex-col overflow-hidden"
      style={{ direction: dir, fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif' }}>

      {/* ── Dynamic full-page background: topic.background_url (admin field) ── */}
      <AnimatePresence mode="sync">
        {activeTopic?.background_url ? (
          <motion.div key={`bg-${activeTopic.id}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="fixed inset-0 pointer-events-none z-0">
            <img src={activeTopic.background_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#07071A]/85" />
          </motion.div>
        ) : (
          <motion.div key={`glow-${activeTopic?.id ?? 'empty'}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: `radial-gradient(ellipse at 65% 20%, ${activeColor}18 0%, transparent 60%)` }}
          />
        )}
      </AnimatePresence>

      {/* ────────────────── HEADER ────────────────── */}
      <header className="relative z-10 px-8 h-[64px] flex items-center justify-between flex-shrink-0
        backdrop-blur-md bg-black/25 border-b border-white/[0.05]">

        <div className="flex items-center gap-5">
          <button onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center
              justify-center hover:bg-white/10 transition-all text-sm">
            {dir === 'rtl' ? '→' : '←'}
          </button>
          <div>
            <h1 className="text-base font-black tracking-tight">{tr('setup_title')}</h1>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
              {tr('setup_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:block relative">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={tr('setup_search_ph')}
              className="bg-white/[0.05] border border-white/[0.08] rounded-2xl py-2 px-4 text-sm
                outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all
                placeholder:text-white/20 w-52" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Progress ring — amber at 5/6, red+pulse at 6/6 */}
          <ProgressRing count={selectedCount} max={MAX_CATS} color={activeColor} />

          {/* Cap label */}
          <AnimatePresence>
            {atMax && (
              <motion.span
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="hidden md:block text-[10px] font-black text-red-400
                  bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full whitespace-nowrap">
                {lang === 'AR' ? 'وصلت للحد الأقصى' : 'Max reached'}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Next step */}
          <motion.button onClick={() => setShowTeams(true)}
            whileHover={selectedCount > 0 ? { scale: 1.04 } : undefined}
            whileTap={selectedCount  > 0 ? { scale: 0.96 } : undefined}
            disabled={selectedCount === 0}
            className="px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest
              transition-all duration-300 disabled:cursor-not-allowed"
            style={{
              background: selectedCount > 0 ? 'white'                         : 'rgba(255,255,255,0.05)',
              color:      selectedCount > 0 ? 'black'                         : 'rgba(255,255,255,0.2)',
              boxShadow:  selectedCount > 0 ? '0 0 30px rgba(255,255,255,0.2)' : 'none',
            }}>
            {tr('setup_next_step')}
          </motion.button>
        </div>
      </header>

      {/* ────────────────── MAIN LAYOUT ────────────────── */}
      <div className="flex flex-1 overflow-hidden relative z-10">

        {/* ── Topic Sidebar ── */}
        <aside className="w-72 flex-shrink-0 border-e border-white/[0.05] bg-black/20
          backdrop-blur-xl flex flex-col overflow-hidden">

          <div className="px-4 pt-4 pb-2">
            <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/5">
              {(['admin', 'alpha', 'popular', 'new'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight
                    transition-all ${sortBy === s ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}>
                  {tr(`setup_sort_${s}` as TranslationKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 no-scrollbar">
            {filteredTopics.map(topic => {
              const isActive = activeTopic?.id === topic.id
              const selCount = topic.categories.filter(c => selectedCategories.includes(c.id)).length
              return (
                <button key={topic.id} onClick={() => setActiveTopic(topic)}
                  className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                    transition-all duration-200 text-start group overflow-hidden
                    ${isActive ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]'}`}>
                  {isActive && (
                    <motion.div layoutId="sidebar-active-bar"
                      className="absolute inset-y-2 start-0 w-0.5 rounded-full"
                      style={{ background: topic.color ?? accentColor }} />
                  )}
                  <span className={`text-xl transition-transform duration-300
                    ${isActive ? 'scale-125' : 'group-hover:scale-110'}`}>
                    {topic.icon ?? '📚'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate transition-colors
                      ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/65'}`}>
                      {topic.name}
                    </p>
                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-wider mt-0.5">
                      {topic.categories.length} {tr('setup_cats')}
                    </p>
                  </div>
                  <AnimatePresence>
                    {selCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                        style={{ background: topic.color ?? accentColor }}>
                        {selCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ── Categories Panel ── */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          <AnimatePresence mode="wait">
            {activeTopic && (
              <motion.div key={activeTopic.id}
                initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>

                {/* ── Topic banner: banner_url (admin) or color gradient fallback ── */}
                <div className="relative overflow-hidden" style={{ minHeight: 180 }}>
                  <AnimatePresence>
                    {activeTopic.banner_url ? (
                      <motion.div key={`banner-${activeTopic.id}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0">
                        <img src={activeTopic.banner_url} alt=""
                          className="w-full h-full object-cover opacity-40" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07071A]/60 to-[#07071A]" />
                      </motion.div>
                    ) : (
                      <motion.div key={`banner-glow-${activeTopic.id}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(135deg, ${activeTopic.color ?? accentColor}20 0%, transparent 60%)` }} />
                    )}
                  </AnimatePresence>

                  <div className="relative z-10 px-10 py-8 flex items-end justify-between gap-6">
                    <div>
                      <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-black uppercase tracking-[0.35em] mb-1.5 block"
                        style={{ color: activeTopic.color ?? accentColor }}>
                        {String(activeIndex + 1).padStart(2, '0')} / {String(filteredTopics.length).padStart(2, '0')}
                      </motion.span>
                      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4">
                        <span>{activeTopic.icon ?? '📚'}</span>
                        <span>{activeTopic.name}</span>
                      </motion.h2>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        className="text-white/30 text-sm mt-1.5 font-medium">
                        {activeTopic.categories.length} {tr('setup_cats')} •{' '}
                        {activeTopic.categories.filter(c => selectedCategories.includes(c.id)).length}{' '}
                        {lang === 'AR' ? 'محددة' : 'selected'}
                      </motion.p>
                    </div>

                    {/* Prev / Next */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => activeIndex > 0 && setActiveTopic(filteredTopics[activeIndex - 1])}
                        disabled={activeIndex <= 0}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/[0.08] flex items-center
                          justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all
                          disabled:opacity-20 disabled:cursor-not-allowed">
                        {dir === 'rtl' ? '→' : '←'}
                      </button>
                      <button onClick={() => activeIndex < filteredTopics.length - 1 && setActiveTopic(filteredTopics[activeIndex + 1])}
                        disabled={activeIndex >= filteredTopics.length - 1}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/[0.08] flex items-center
                          justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all
                          disabled:opacity-20 disabled:cursor-not-allowed">
                        {dir === 'rtl' ? '←' : '→'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Categories grid ── */}
                <div className="px-10 pt-2 pb-28">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                      {tr('setup_step_cats')}
                    </h3>
                    <button onClick={handleSelectAll}
                      className="text-[10px] font-black uppercase tracking-widest text-white/25 hover:text-white/60 transition-colors">
                      {activeTopic.categories.every(c => selectedCategories.includes(c.id))
                        ? tr('setup_unselect_all')
                        : tr('setup_select_all')}
                    </button>
                  </div>

                  {activeTopic.categories.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-white/20 text-sm font-bold">
                      {lang === 'AR' ? 'لا توجد فئات لهذا الموضوع' : 'No categories'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {activeTopic.categories.map((cat, i) => {
                        const selected = selectedCategories.includes(cat.id)
                        const blocked  = atMax && !selected
                        const crop     = cat.crop_config?.cat_setup ?? { zoom: 1, x: 50, y: 50 }

                        return (
                          <motion.button key={cat.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            whileHover={blocked ? {} : { y: -5 }}
                            whileTap={blocked   ? {} : { scale: 0.97 }}
                            onClick={() => toggleCategory(cat.id)}
                            className="group relative rounded-[28px] overflow-hidden border transition-all duration-500"
                            style={{
                              aspectRatio: '4/5',
                              cursor:      blocked ? 'not-allowed' : 'pointer',
                              opacity:     blocked ? 0.3 : 1,
                              filter:      blocked ? 'grayscale(0.6)' : 'none',
                              border:      selected ? '2px solid white' : '2px solid rgba(255,255,255,0.06)',
                              boxShadow:   selected ? '0 0 40px rgba(255,255,255,0.12)' : undefined,
                            }}>

                            <div className="absolute inset-0 overflow-hidden">
                              {cat.image_url ? (
                                <img src={cat.image_url} alt={cat.name}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                  style={{ transform: `scale(${crop.zoom ?? 1})`, objectPosition: `${crop.x ?? 50}% ${crop.y ?? 50}%` }} />
                              ) : (
                                <div className="w-full h-full bg-white/[0.02]" />
                              )}
                            </div>

                            <div className={`absolute inset-0 transition-colors duration-500
                              ${selected ? 'bg-black/55' : 'bg-gradient-to-t from-black/90 via-black/20 to-transparent'}`} />

                            <AnimatePresence>
                              {selected && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                                  className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2
                                    w-14 h-14 rounded-full bg-white flex items-center justify-center text-black text-xl z-10 shadow-xl">
                                  ✓
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="absolute bottom-0 inset-x-0 p-5 z-10">
                              <h4 className={`text-lg font-black tracking-tight transition-all duration-300
                                ${selected ? 'opacity-40' : 'group-hover:-translate-y-1'}`}>
                                {cat.name}
                              </h4>
                              {cat.description && (
                                <p className="text-[10px] text-white/40 mt-1 leading-relaxed
                                  opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                                  {cat.description}
                                </p>
                              )}
                            </div>

                            <div className={`absolute top-4 end-4 w-6 h-6 rounded-full border-2 transition-all
                              ${selected ? 'bg-white border-white' : 'border-white/10 group-hover:border-white/30'}`} />
                          </motion.button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Selected chip strip ── */}
          <AnimatePresence>
            {selectedCount > 0 && (
              <motion.div
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="fixed bottom-0 start-72 end-0 z-20 px-10 py-4
                  bg-gradient-to-t from-[#07071A]/90 via-[#07071A]/60 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCategories.map(id => {
                    const cat   = allCategories.find(c => c.id === id)
                    const owner = topics.find(t => t.id === cat?.topic_id)
                    return (
                      <motion.div key={id}
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold"
                        style={{
                          borderColor: `${owner?.color ?? accentColor}50`,
                          background:  `${owner?.color ?? accentColor}18`,
                          color:        owner?.color ?? accentColor,
                        }}>
                        <span className="text-white/70">{cat?.name ?? id}</span>
                        <button onClick={() => toggleCategory(id)}
                          className="text-white/25 hover:text-white/70 transition-colors leading-none">✕</button>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ────────────────── TEAMS MODAL ────────────────── */}
      <AnimatePresence>
        {showTeams && (
          <TeamsModal
            teams={teams} setTeams={setTeams}
            sessionName={sessionName} setSessionName={setSessionName}
            onClose={() => setShowTeams(false)}
            onStart={handleStartGame}
            isStarting={isStarting}
            accentColor={activeColor}
            tr={tr}
          />
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}
