'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface SessionDetail {
  id: string
  state: string
  mode: string
  join_code: string | null
  name: string | null
  created_at: string
  current_question_index: number
  punishment_mode: string | null
  teams: { id: string; name: string; score: number; color: string }[]
  profiles: { email: string } | null
}

interface SessionQuestion {
  id: string
  order_index: number
  used: boolean
  team_id: string | null
  question: {
    id: string
    question: string
    answer: string
    difficulty: 'easy' | 'medium' | 'hard'
    categories: { name: string } | null
  } | null
}

const DIFF_COLOR: Record<string, string> = {
  easy: '#10b981', medium: '#f59e0b', hard: '#ef4444',
}
const DIFF_LABEL: Record<string, string> = {
  easy: 'سهل', medium: 'متوسط', hard: 'صعب',
}

export default function SessionInspectorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [questions, setQuestions] = useState<SessionQuestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      const [sesRes, qRes] = await Promise.all([
        (supabase.from('sessions') as any)
          .select('*, teams(id,name,score,color), profiles(email)')
          .eq('id', id)
          .single(),
        (supabase.from('session_questions') as any)
          .select('*, question:questions(id,question,answer,difficulty,categories(name))')
          .eq('session_id', id)
          .order('order_index', { ascending: true }),
      ])
      setSession(sesRes.data)
      setQuestions(qRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [id, supabase])

  const forceEnd = async () => {
    if (!session) return
    if (!confirm('إنهاء الجلسة فوراً؟')) return
    const { error } = await (supabase.from('sessions') as any).update({ state: 'finished' }).eq('id', session.id)
    if (error) toast.error(error.message)
    else { toast.success('تم إنهاء الجلسة'); setSession(s => s ? { ...s, state: 'finished' } : s) }
  }

  if (loading) return (
    <div className="p-8 space-y-4">
      {Array(5).fill(0).map((_, i) => <div key={i} className="h-20 card-glass animate-shimmer rounded-2xl" />)}
    </div>
  )

  if (!session) return (
    <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
      <p className="text-4xl mb-3">🔍</p>
      <p>الجلسة غير موجودة</p>
      <button onClick={() => router.back()} className="btn btn-ghost mt-4">← رجوع</button>
    </div>
  )

  const usedCount = questions.filter(q => q.used).length
  const totalQ = questions.length
  const winnerTeam = [...(session.teams ?? [])].sort((a, b) => b.score - a.score)[0]
  const isLive = session.state === 'playing'

  return (
    <div className="p-8 max-w-5xl" dir="rtl">
      {/* Back */}
      <button onClick={() => router.push('/admin/sessions')}
        className="flex items-center gap-2 text-sm font-semibold mb-6 transition-all"
        style={{ color: 'var(--color-text-muted)' }}>
        ← الجلسات
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black gradient-text-primary">
              {session.name || 'جلسة بدون اسم'}
            </h1>
            <span className="px-3 py-1 rounded-full text-sm font-bold"
              style={{
                background: isLive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                color: isLive ? '#10b981' : 'var(--color-text-muted)',
                border: `1px solid ${isLive ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,
              }}>
              {isLive ? '⚡ يلعب الآن' : session.state === 'finished' ? '✓ منتهي' : '⏳ لوبي'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
            <span>{session.id}</span>
            {session.join_code && (
              <span className="px-2 py-0.5 rounded"
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-accent)' }}>
                كود: {session.join_code}
              </span>
            )}
            <span>{session.mode === 'remote' ? '🌐 عن بُعد' : '🏠 محلي'}</span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            المضيف: {session.profiles?.email ?? 'مجهول'} · {new Date(session.created_at).toLocaleString('ar-SA')}
          </p>
        </div>
        {session.state !== 'finished' && (
          <button onClick={forceEnd}
            className="px-4 py-2 rounded-2xl font-bold text-sm border transition-all"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            ⏹ إنهاء الجلسة
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'الفرق', value: session.teams?.length ?? 0, icon: '👥', color: '#8b5cf6' },
          { label: 'الأسئلة المُستخدمة', value: `${usedCount}/${totalQ}`, icon: '❓', color: '#3b82f6' },
          { label: 'السؤال الحالي', value: session.current_question_index + 1, icon: '🎯', color: '#f59e0b' },
          { label: 'وضع العقوبة', value: session.punishment_mode ?? 'لا يوجد', icon: '⚡', color: '#10b981' },
        ].map(({ label, value, icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card-glass p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-lg">{icon}</span>
              <span className="text-xl font-black" style={{ color }}>{value}</span>
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teams Leaderboard */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>🏆 الفرق والنقاط</h2>
          <div className="space-y-3">
            {[...session.teams].sort((a, b) => b.score - a.score).map((team, i) => {
              const isWinner = winnerTeam?.id === team.id && session.state === 'finished'
              return (
                <motion.div key={team.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-glass p-4 flex items-center gap-4"
                  style={{ borderColor: isWinner ? team.color + '60' : 'var(--color-border)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2"
                    style={{ background: team.color + '22', color: team.color, borderColor: team.color }}>
                    {i === 0 ? '🥇' : team.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{team.name}</p>
                    {isWinner && <p className="text-[10px] font-bold" style={{ color: team.color }}>الفائز 🏆</p>}
                  </div>
                  <span className="text-2xl font-black" style={{ color: team.color }}>{team.score}</span>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Questions List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            ❓ الأسئلة ({usedCount} مستخدم من {totalQ})
          </h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pl-1">
            {questions.map((sq, i) => {
              const q = sq.question
              if (!q) return null
              return (
                <motion.div key={sq.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="card-glass p-3 flex items-start gap-3"
                  style={{ opacity: sq.used ? 1 : 0.5 }}>
                  <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-black"
                    style={{ background: sq.used ? DIFF_COLOR[q.difficulty] + '20' : 'var(--color-surface-2)', color: sq.used ? DIFF_COLOR[q.difficulty] : 'var(--color-text-muted)', border: `1px solid ${DIFF_COLOR[q.difficulty]}40` }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: DIFF_COLOR[q.difficulty] + '15', color: DIFF_COLOR[q.difficulty] }}>
                        {DIFF_LABEL[q.difficulty]}
                      </span>
                      {q.categories?.name && (
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          {q.categories.name}
                        </span>
                      )}
                      {sq.used && <span className="text-[10px] text-emerald-500">✓ مستخدم</span>}
                    </div>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{q.question}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>→ {q.answer}</p>
                  </div>
                </motion.div>
              )
            })}
            {questions.length === 0 && (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                لم تُولَّد أسئلة بعد
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
