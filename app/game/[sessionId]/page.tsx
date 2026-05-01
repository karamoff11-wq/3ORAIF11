'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useGameStore } from '@/store/gameStore'
import GameBoard from '@/components/GameBoard'
import FightingParticles from '@/components/FightingParticles'
import { useMascotBehavior } from '@/hooks/useMascotBehavior'

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const supabase = createClient()
  const store = useGameStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { triggerReaction, settings } = useMascotBehavior()
  const introPlayedRef = useRef(false)

  useEffect(() => {
    // Browsers block audio until a user interaction — wait for first click/touch/key
    if (settings === null || introPlayedRef.current) return

    const playIntro = () => {
      if (introPlayedRef.current) return
      introPlayedRef.current = true
      triggerReaction('intro')
      // Remove listeners after first interaction
      window.removeEventListener('click', playIntro)
      window.removeEventListener('touchstart', playIntro)
      window.removeEventListener('keydown', playIntro)
    }

    window.addEventListener('click', playIntro, { once: true })
    window.addEventListener('touchstart', playIntro, { once: true })
    window.addEventListener('keydown', playIntro, { once: true })

    return () => {
      window.removeEventListener('click', playIntro)
      window.removeEventListener('touchstart', playIntro)
      window.removeEventListener('keydown', playIntro)
    }
  }, [settings, triggerReaction])

  useEffect(() => {
    async function loadGameData() {
      if (!sessionId) return

      // 1. Fetch Session
      const { data: session, error: sessErr } = await (supabase
        .from('sessions') as any)
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessErr || !session) {
        setError('لم يتم العثور على الجلسة')
        setLoading(false)
        return
      }

      store.setSession(session.id, session.mode as any)
      store.setPhase(session.state as any)

      // 2. Fetch Teams
      const { data: teams } = await (supabase
        .from('teams') as any)
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at')

      if (teams) store.setTeams(teams)

      // 3. Fetch Session Questions (with nested question data)
      const { data: sQuestions } = await (supabase
        .from('session_questions') as any)
        .select('*, question:questions(*)')
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true })

      if (sQuestions) {
        store.setQuestions(sQuestions as any)
        // Resume from where we left off
        store.setCurrentQuestion(session.current_question_index ?? 0)
        store.setCurrentTeam(session.current_team_index ?? 0)
        // In board mode we don't auto-start a timer
      }

      // 4. Fetch categories for this session
      const { data: sessionCats } = await (supabase
        .from('session_categories') as any)
        .select('category_id, categories(id, name, icon, image_url)')
        .eq('session_id', sessionId)

      if (sessionCats && sessionCats.length > 0) {
        const cats = sessionCats
          .map((sc: any) => sc.categories)
          .filter(Boolean)
        store.setCategories(cats)
      } else {
        // Fallback: derive categories from questions themselves
        const catIds = [...new Set(
          sQuestions?.map((sq: any) => sq.question?.category_id).filter(Boolean)
        )] as string[]
        const { data: catData } = await (supabase
          .from('categories') as any)
          .select('id, name, icon, image_url')
          .in('id', catIds)
        if (catData) store.setCategories(catData)
      }

      // 4. Fetch Scoring Config
      const { data: config } = await (supabase
        .from('scoring_config') as any)
        .select('*')
        .single()

      if (config) {
        store.setScoringConfig({
          easy_points: config.easy_points,
          medium_points: config.medium_points,
          hard_points: config.hard_points,
          default_timer_seconds: config.default_timer_seconds,
          time_adjustment_seconds: config.time_adjustment_seconds,
          glow_enabled: config.glow_enabled,
          glow_intensity: config.glow_intensity,
          flash_start_seconds: config.flash_start_seconds
        })
        store.setTimer(config.default_timer_seconds)
      }

      setLoading(false)
    }

    loadGameData()
  }, [sessionId])

  // ── Realtime: sync session state changes (for remote mode) ──
  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as any
          // Sync phase
          if (updated.state) store.setPhase(updated.state)
          // Sync question/team index (for remote participants)
          if (updated.current_question_index !== undefined) {
            store.setCurrentQuestion(updated.current_question_index)
          }
          if (updated.current_team_index !== undefined) {
            store.setCurrentTeam(updated.current_team_index)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'teams', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as any
          // Sync score updates in real time
          store.updateScore(updated.id, updated.score)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--color-primary-light)', borderTopColor: 'transparent' }} />
      <p style={{ color: 'var(--color-text-secondary)' }}>جاري تحميل اللعبة...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <div className="text-6xl">⚠️</div>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{error}</h1>
      <button onClick={() => router.push('/dashboard')} className="btn btn-primary">
        العودة للوحة التحكم
      </button>
    </div>
  )

  return (
    <main className="min-h-screen relative overflow-hidden bg-black font-sans text-white">
      <div className="absolute inset-0 bg-grid noise opacity-30 z-0 pointer-events-none" />
      <FightingParticles teams={store.teams} />
      
      <div className="relative z-10 w-full h-full min-h-screen">
        <GameBoard />
      </div>
    </main>
  )
}
