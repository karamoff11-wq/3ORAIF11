'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface SessionRow {
  id: string
  state: string
  mode: string
  join_code: string | null
  created_at: string
  name: string | null
  teams: { id: string; name: string; score: number; color: string }[]
  profiles: { email: string } | null
}

const stateColor = (s: string) =>
  s === 'playing' ? '#10b981' : s === 'finished' ? '#6b7280' : '#f59e0b'
const stateLabel = (s: string) =>
  s === 'playing' ? '⚡ يلعب الآن' : s === 'finished' ? '✓ منتهي' : '⏳ لوبي'

export default function AdminSessionsPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLive, setActiveLive] = useState(0)

  const load = useCallback(async () => {
    const { data } = await (supabase
      .from('sessions') as any)
      .select('*, teams(id,name,score,color), profiles(email)')
      .order('created_at', { ascending: false })
      .limit(50)
    const rows: SessionRow[] = data ?? []
    setSessions(rows)
    setActiveLive(rows.filter(s => s.state === 'playing').length)
    setLoading(false)
  }, [supabase])

  // Initial load
  useEffect(() => { load() }, [load])

  // ── 2.1 REAL-TIME LIVE SESSION MONITOR ──────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel('admin-sessions-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions',
      }, () => {
        // Refresh the list on any session change
        load()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'teams',
      }, () => {
        load()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, load])

  const forceEnd = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في إنهاء هذه الجلسة فوراً؟')) return
    const { error } = await (supabase.from('sessions') as any).update({ state: 'finished' }).eq('id', id)
    if (error) toast.error('خطأ: ' + error.message)
    else { toast.success('تم إنهاء الجلسة بنجاح'); load() }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text-primary">الجلسات</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>آخر 50 جلسة</p>
        </div>

        {/* ── Live Counter Badge ── */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm"
            style={{
              background: activeLive > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${activeLive > 0 ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,
              color: activeLive > 0 ? '#10b981' : 'var(--color-text-muted)',
            }}
          >
            {activeLive > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {activeLive > 0 ? `${activeLive} جلسة حية` : 'لا توجد جلسات نشطة'}
          </div>
          <button onClick={load}
            className="px-4 py-2 rounded-2xl text-sm font-bold transition-all"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            ↻ تحديث
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(8).fill(0).map((_, i) => <div key={i} className="h-20 card-glass animate-shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {sessions.map((s, idx) => {
              const topTeam = [...(s.teams ?? [])].sort((a, b) => b.score - a.score)[0]
              const isLive = s.state === 'playing'
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="card-glass flex items-center gap-6 p-4 cursor-pointer group relative overflow-hidden"
                  style={{
                    borderColor: isLive ? 'rgba(16,185,129,0.25)' : 'var(--color-border)',
                    transition: 'border-color 0.3s',
                  }}
                  onClick={() => router.push(`/admin/sessions/${s.id}`)}
                >
                  {/* Live pulse line */}
                  {isLive && (
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: 'linear-gradient(90deg, transparent, #10b981, transparent)', animation: 'shimmer 2s linear infinite' }} />
                  )}

                  {/* Mode icon */}
                  <div className="text-2xl shrink-0">{s.mode === 'remote' ? '🌐' : '🏠'}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {s.name || 'جلسة بدون اسم'}
                      </span>
                      {s.join_code && (
                        <span className="font-mono text-xs px-2 py-0.5 rounded"
                          style={{ background: 'var(--color-surface-3)', color: 'var(--color-accent)' }}>
                          {s.join_code}
                        </span>
                      )}
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${stateColor(s.state)}15`, color: stateColor(s.state) }}>
                        {stateLabel(s.state)}
                      </span>
                    </div>
                    <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {s.id.slice(0, 8)}… · {s.profiles?.email ?? 'مجهول'} · {new Date(s.created_at).toLocaleString('ar-SA')}
                    </p>
                  </div>

                  {/* Teams */}
                  <div className="flex gap-2 shrink-0">
                    {(s.teams ?? []).map((t: any) => (
                      <div key={t.id} className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2"
                          style={{ background: t.color + '22', color: t.color, borderColor: t.color + '55' }}>
                          {t.name.charAt(0)}
                        </div>
                        <span className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>{t.score}</span>
                      </div>
                    ))}
                  </div>

                  {/* Winner */}
                  {s.state === 'finished' && topTeam && (
                    <div className="shrink-0 text-right min-w-[90px]">
                      <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>🏆 الفائز</p>
                      <p className="font-bold text-sm gradient-text-accent">{topTeam.name}</p>
                      <p className="text-xs font-black" style={{ color: topTeam.color }}>{topTeam.score} نقطة</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--color-text-muted)' }}>
                      عرض التفاصيل ←
                    </span>
                    {s.state !== 'finished' && (
                      <button
                        onClick={e => { e.stopPropagation(); forceEnd(s.id) }}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        إنهاء
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {sessions.length === 0 && (
            <div className="py-20 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <p className="text-4xl mb-3">🎮</p>
              <p>لا توجد جلسات بعد</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
