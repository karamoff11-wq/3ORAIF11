'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'

interface Stats {
  totalSessions: number
  activeSessions: number
  totalQuestions: number
  totalCategories: number
  recentSessions: {
    id: string
    state: string
    created_at: string
    teams: {
      name: string
      score: number
    }[]
  }[]
  popularCategories: { name: string; count: number; color: string }[]
  playtimeDistribution: number[]
}

export default function AdminHomePage() {
  const supabase = useMemo(() => createClient(), [])
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function load() {
      // Fetch stats
      const [sessions, questions, categories, recent] = await Promise.all([
        (supabase.from('sessions') as any).select('id, state', { count: 'exact' }),
        (supabase.from('questions') as any).select('id', { count: 'exact' }),
        (supabase.from('categories') as any).select('id', { count: 'exact' }),
        (supabase.from('sessions') as any).select('*, teams(name,score)').order('created_at', { ascending: false }).limit(8),
      ])

      // Fetch popular categories (Join sessions and categories)
      const { data: popularData } = await (supabase
        .from('session_categories') as any)
        .select('category_id, categories(name, topics(color))')
      
      const counts: Record<string, { name: string, count: number, color: string }> = {}
      popularData?.forEach((item: any) => {
        const cat = item.categories as any
        if (!cat) return
        if (!counts[cat.name]) {
          counts[cat.name] = { name: cat.name, count: 0, color: cat.topics?.color || '#8b5cf6' }
        }
        counts[cat.name].count++
      })

      const sortedPopular = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)

      // Playtime Distribution (Sessions per day for last 7 days)
      const last7Days = Array(7).fill(0).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()

      const { data: sessionHistory } = await (supabase
        .from('sessions') as any)
        .select('created_at')
        .gte('created_at', last7Days[0])

      const distribution = last7Days.map(date => {
        return (sessionHistory as any[])?.filter((s: any) => s.created_at.startsWith(date)).length || 0
      })

      setStats({
        totalSessions: sessions.count ?? 0,
        activeSessions: ((sessions as any).data ?? []).filter((s: any) => s.state === 'playing').length,
        totalQuestions: questions.count ?? 0,
        totalCategories: categories.count ?? 0,
        recentSessions: recent.data ?? [],
        popularCategories: sortedPopular,
        playtimeDistribution: distribution
      })
    }
    load()
  }, [supabase])

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

      {/* Recent Sessions & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sessions Table */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>آخر الجلسات</h2>
          <div className="card rounded-2xl overflow-hidden" style={{ padding: 0 }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                  {['المعرّف', 'الحالة', 'الفرق', 'وقت الإنشاء'].map(h => (
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
                      {s.id.slice(0,8)}...
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold" style={{
                        background: s.state === 'playing' ? 'rgba(16,185,129,0.1)' : s.state === 'finished' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                        color: s.state === 'playing' ? '#10b981' : s.state === 'finished' ? '#ef4444' : 'var(--color-text-muted)'
                      }}>
                        {s.state === 'playing' ? '⚡ يلعب' : s.state === 'finished' ? '✓ منتهي' : '⏳ انتظار'}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>
                      {(s.teams ?? []).length} فرق
                    </td>
                    <td className="px-4 py-3 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(s.created_at).toLocaleDateString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics / Top Categories */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>الإحصائيات المتقدمة</h2>
          
          <div className="card-glass p-6 space-y-4">
            <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest">الفئات الأكثر شعبية</h3>
            <div className="space-y-3">
              {(stats?.popularCategories ?? []).map((c, i) => {
                const max = stats?.popularCategories[0]?.count || 1
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{c.name}</span>
                      <span style={{ color: c.color }}>{c.count} مرة</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(c.count/max)*100}%` }} 
                        className="h-full" 
                        style={{ background: c.color }} 
                      />
                    </div>
                  </div>
                )
              })}
              {stats?.popularCategories.length === 0 && (
                <p className="text-xs text-white/20 text-center py-4 italic">لا توجد بيانات كافية</p>
              )}
            </div>
          </div>

          <div className="card-glass p-6">
            <div className="flex items-end justify-between h-24 gap-1">
              {(stats?.playtimeDistribution ?? [0,0,0,0,0,0,0]).map((count, i) => {
                const max = Math.max(...(stats?.playtimeDistribution || [1])) || 1
                const height = (count / max) * 100
                return (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    className="flex-1 rounded-t-sm"
                    style={{ background: 'linear-gradient(to top, var(--color-primary), var(--color-primary-light))', opacity: 0.3 + (height/100)*0.7 }}
                  />
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] opacity-40 font-bold">
              <span>قبل ٦ أيام</span>
              <span>اليوم</span>
            </div>
          </div>
        </div>

      </div>

      {/* Theme Control Quick Access */}
      <div className="mt-12 mb-8">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>تجربة المستخدم والنمو</h2>
        <motion.div
          whileHover={{ scale: 1.005 }}
          className="card-glass relative overflow-hidden group cursor-pointer border"
          onClick={() => window.location.href = '/admin/themes'}
          style={{ borderColor: 'rgba(168,85,247,0.3)', background: 'linear-gradient(135deg, rgba(168,85,247,0.05), rgba(99,102,241,0.05))' }}
        >
          {/* Decorative Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] -mr-32 -mt-32" />
          
          <div className="flex flex-wrap items-center gap-6 relative z-10 p-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
              🎨
            </div>
            <div className="flex-1 min-w-[200px]">
              <h3 className="text-lg font-bold text-white mb-1">مركز التحكم بالثيمات الخاصة (Growth Engine)</h3>
              <p className="text-sm opacity-60">قم بتوليد روابط خاصة للأطباء، المهندسين، أو لأعياد الميلاد. ثيمات متكاملة تفعّل تلقائياً عند الزيارة.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400 opacity-60">تفعيل الآن</span>
              <div className="w-10 h-10 rounded-full border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all">
                →
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
