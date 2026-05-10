'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { SessionWithDetails } from '@/types/admin'

export default function AdminSessionsPage() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sessions')
        .select(`*, teams(id,name,score,color), profiles(email)`)
        .order('created_at', { ascending: false })
        .limit(50)
      setSessions(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const stateColor = (s: string) =>
    s === 'playing' ? '#10b981' : s === 'finished' ? 'var(--color-text-muted)' : 'var(--color-accent)'
  const stateLabel = (s: string) =>
    s === 'playing' ? '⚡ يلعب' : s === 'finished' ? '✓ منتهي' : '⏳ لوبي'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black gradient-text-primary">الجلسات</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>آخر 50 جلسة</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(8).fill(0).map((_, i) => <div key={i} className="h-20 card-glass animate-shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => {
            const topTeam = [...(s.teams ?? [])].sort((a, b) => b.score - a.score)[0]
            return (
              <div key={s.id} className="card-glass flex items-center gap-6 p-4">
                {/* Mode */}
                <div className="text-2xl shrink-0">{s.mode === 'remote' ? '🌐' : '🏠'}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {s.id}
                    </span>
                    {s.join_code && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--color-surface-3)', color: 'var(--color-accent)' }}>
                        {s.join_code}
                      </span>
                    )}
                    <span className="text-xs font-bold" style={{ color: stateColor(s.state) }}>
                      {stateLabel(s.state)}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {s.profiles?.email ?? 'مجهول'} · {new Date(s.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>

                {/* Teams */}
                <div className="flex gap-2 shrink-0">
                  {(s.teams ?? []).map((t: any) => (
                    <div key={t.id} className="flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: t.color, color: '#000' }}>
                        {t.name.charAt(0)}
                      </div>
                      <span className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>{t.score}</span>
                    </div>
                  ))}
                </div>

                {/* Winner */}
                {s.state === 'finished' && topTeam && (
                  <div className="shrink-0 text-right min-w-[80px]">
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>الفائز</p>
                    <p className="font-bold text-xs gradient-text-accent">{topTeam.name}</p>
                  </div>
                )}

                {/* Actions */}
                {s.state !== 'finished' && (
                  <button
                    onClick={async () => {
                      if (!confirm('هل أنت متأكد من رغبتك في إنهاء هذه الجلسة فوراً؟')) return
                      const { error } = await (supabase.from('sessions') as any).update({ state: 'finished' }).eq('id', s.id)
                      if (error) toast.error('خطأ: ' + error.message)
                      else {
                        toast.success('تم إنهاء الجلسة بنجاح')
                        // Reload data
                        const { data } = await (supabase.from('sessions') as any).select(`*, teams(id,name,score,color), profiles(email)`).order('created_at', { ascending: false }).limit(50)
                        setSessions(data ?? [])
                      }
                    }}
                    className="shrink-0 p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all text-[10px] font-bold"
                  >
                    إنهاء الجلسة
                  </button>
                )}
              </div>
            )
          })}
          {sessions.length === 0 && (
            <div className="py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>لا توجد جلسات</div>
          )}
        </div>
      )}
    </div>
  )
}
