'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'

interface Stats {
  totalSessions: number
  activeSessions: number
  totalQuestions: number
  totalCategories: number
  recentSessions: any[]
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [sessions, questions, categories, recent] = await Promise.all([
        (supabase.from('sessions') as any).select('id, state', { count: 'exact' }),
        (supabase.from('questions') as any).select('id', { count: 'exact' }),
        (supabase.from('categories') as any).select('id', { count: 'exact' }),
        (supabase.from('sessions') as any).select('*, teams(name,score)').order('created_at', { ascending: false }).limit(8),
      ])
      setStats({
        totalSessions: sessions.count ?? 0,
        activeSessions: ((sessions.data ?? []) as any[]).filter((s: any) => s.state === 'playing').length,
        totalQuestions: questions.count ?? 0,
        totalCategories: categories.count ?? 0,
        recentSessions: recent.data ?? [],
      })
    }
    load()
  }, [])

  const cards = stats ? [
    { label: 'إجمالي الجلسات',   value: stats.totalSessions,   icon: '🎮', color: 'var(--color-primary)' },
    { label: 'جلسات نشطة',       value: stats.activeSessions,  icon: '⚡', color: '#10b981' },
    { label: 'إجمالي الأسئلة',   value: stats.totalQuestions,  icon: '❓', color: 'var(--color-accent)' },
    { label: 'الفئات',            value: stats.totalCategories, icon: '📚', color: '#a855f7' },
  ] : []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black gradient-text-primary">لوحة الإدارة</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>نظرة عامة على المنصة</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {!stats ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="card-glass h-32 animate-shimmer" />
          ))
        ) : cards.map(({ label, value, icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card-glass flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{icon}</span>
              <span className="text-3xl font-black" style={{ color }}>{value}</span>
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>آخر الجلسات</h2>
        <div className="card rounded-2xl overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                {['المعرّف', 'النوع', 'الحالة', 'الفرق', 'وقت الإنشاء'].map(h => (
                  <th key={h} className="px-4 py-3 text-right font-bold" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats?.recentSessions ?? []).map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                  }}
                >
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {s.id}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                      background: s.mode === 'remote' ? 'rgba(245,158,11,0.1)' : 'rgba(109,40,217,0.1)',
                      color: s.mode === 'remote' ? 'var(--color-accent)' : 'var(--color-primary-light)'
                    }}>
                      {s.mode === 'remote' ? '🌐 عن بُعد' : '🏠 محلي'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                      background: s.state === 'playing' ? 'rgba(16,185,129,0.1)' : s.state === 'finished' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                      color: s.state === 'playing' ? '#10b981' : s.state === 'finished' ? '#ef4444' : 'var(--color-text-muted)'
                    }}>
                      {s.state === 'playing' ? '⚡ يلعب' : s.state === 'finished' ? '✓ منتهي' : '⏳ انتظار'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>
                    {(s.teams ?? []).length} فرق
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString('ar-SA')}
                  </td>
                </tr>
              ))}
              {stats && stats.recentSessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                    لا توجد جلسات بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
