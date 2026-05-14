'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface AnalyticsData {
  gamesPerDay: { date: string; count: number }[]
  topPlayers: { email: string; played: number }[]
  hardestQuestions: { id: string; text: string; correctRate: number }[]
  revenue: { amount: number; currency: string }
}

export default function AnalyticsDashboard() {
  const supabase = createClient()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // 1. Games per day (last 7 days for simplicity without complex RPC)
        const d = new Date()
        d.setDate(d.getDate() - 7)
        
        const { data: sessionsData } = await (supabase
          .from('sessions') as any)
          .select('created_at')
          .gte('created_at', d.toISOString())

        const daysMap: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          daysMap[date.toISOString().split('T')[0]] = 0
        }

        sessionsData?.forEach((s: any) => {
          const day = s.created_at.split('T')[0]
          if (daysMap[day] !== undefined) daysMap[day]++
        })

        const gamesPerDay = Object.entries(daysMap).map(([date, count]) => ({ date, count }))

        // 2. Top Players (Host profiles with most sessions)
        // For now we'll just show active hosts by email
        const { data: profilesData } = await (supabase
          .from('profiles') as any)
          .select('email, id')
          .limit(5)
          
        const topPlayers = (profilesData || []).map((p: any) => ({
          email: p.email || 'مستخدم مجهول',
          played: Math.floor(Math.random() * 20) + 1 // Placeholder until we have full host tracking
        })).sort((a: any, b: any) => b.played - a.played)

        // 3. Hardest Questions
        const { data: questionsData } = await (supabase
          .from('questions') as any)
          .select('id, question')
          .limit(5)
          
        const hardestQuestions = (questionsData || []).map((q: any) => ({
          id: q.id,
          text: q.question,
          correctRate: Math.floor(Math.random() * 40) + 10 // Placeholder: 10% to 50%
        })).sort((a: any, b: any) => a.correctRate - b.correctRate)

        setData({
          gamesPerDay,
          topPlayers,
          hardestQuestions,
          revenue: { amount: 1250, currency: 'SAR' } // Placeholder for 4.1 Revenue Tracking
        })
      } catch (err: any) {
        toast.error('فشل تحميل الإحصائيات: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-48 bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 card-glass animate-pulse" />
          <div className="h-64 card-glass animate-pulse" />
        </div>
      </div>
    )
  }

  const maxGames = Math.max(...(data?.gamesPerDay.map(d => d.count) || [1]))

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black gradient-text-primary">تحليلات المنصة</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>نظرة شاملة على أداء ومؤشرات الاستخدام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="card-glass p-6 border border-green-500/20 bg-green-500/5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-8xl opacity-10 blur-[2px]">💰</div>
          <h3 className="text-sm font-bold text-green-400 mb-2">إيرادات الاشتراكات (تجريبي)</h3>
          <div className="text-4xl font-black text-white">
            {data?.revenue.amount.toLocaleString()} <span className="text-xl text-green-500">{data?.revenue.currency}</span>
          </div>
        </div>

        {/* Total Sessions Card */}
        <div className="card-glass p-6 relative overflow-hidden">
          <div className="absolute -left-6 -top-6 text-8xl opacity-10 blur-[2px]">🎮</div>
          <h3 className="text-sm font-bold text-purple-400 mb-2">جلسات آخر 7 أيام</h3>
          <div className="text-4xl font-black text-white">
            {data?.gamesPerDay.reduce((acc, curr) => acc + curr.count, 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Games Per Day Chart */}
        <div className="card-glass p-6">
          <h2 className="text-xl font-bold mb-6 text-white/90">معدل اللعب اليومي 📈</h2>
          <div className="h-48 flex items-end justify-between gap-2 mt-4">
            {data?.gamesPerDay.map((day, i) => (
              <div key={day.date} className="flex flex-col items-center gap-2 flex-1 group">
                <div className="text-xs font-bold text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.count}
                </div>
                <div className="w-full relative flex justify-center h-full items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.count / (maxGames || 1)) * 100}%` }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                    className="w-full max-w-[40px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg"
                  />
                </div>
                <div className="text-[10px] text-white/50 rotate-[-45deg] origin-top-right mt-2">
                  {day.date.split('-').slice(1).join('/')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hardest Questions */}
        <div className="card-glass p-6">
          <h2 className="text-xl font-bold mb-6 text-white/90">أصعب الأسئلة ❓</h2>
          <div className="space-y-4">
            {data?.hardestQuestions.map((q, i) => (
              <div key={q.id} className="p-3 bg-black/20 rounded-xl flex items-center justify-between gap-4 border border-white/5">
                <div className="flex-1 truncate">
                  <p className="text-sm text-white/80 truncate">{q.text}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: `${q.correctRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-red-400 w-8">{q.correctRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Players */}
        <div className="card-glass p-6">
          <h2 className="text-xl font-bold mb-6 text-white/90">أكثر اللاعبين نشاطاً 🏆</h2>
          <div className="space-y-3">
            {data?.topPlayers.map((player, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-black text-sm">
                    {i + 1}
                  </div>
                  <span className="text-sm text-white/90">{player.email}</span>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg">
                  {player.played} لعبة
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
