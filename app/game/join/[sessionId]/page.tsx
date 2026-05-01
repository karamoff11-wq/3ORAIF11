'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export default function JoinSessionPage() {
  const { sessionId } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [session, setSession] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [playerName, setPlayerName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: sess }, { data: teamsData }] = await Promise.all([
        (supabase.from('sessions') as any).select('*').eq('id', sessionId as string).single(),
        (supabase.from('teams') as any).select('*').eq('session_id', sessionId as string)
      ])
      setSession(sess)
      setTeams(teamsData ?? [])
      if (teamsData?.length) setSelectedTeam(teamsData[0].id)
      setLoading(false)
    }
    load()
  }, [sessionId, supabase])

  async function handleJoin() {
    if (!playerName.trim()) { toast.error('أدخل اسمك أولاً'); return }
    if (!selectedTeam) { toast.error('اختر فريقاً'); return }
    setJoining(true)
    const { error } = await (supabase.from('players') as any).insert({
      session_id: sessionId,
      team_id: selectedTeam,
      name: playerName.trim()
    })
    if (error) { toast.error('فشل الانضمام: ' + error.message); setJoining(false); return }
    toast.success(`مرحباً ${playerName}! أنت في اللعبة 🎮`)
    router.push(`/game/${sessionId}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--color-primary-light)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div><div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>جلسة غير موجودة</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>تأكد من الكود وحاول مرة أخرى</p>
      </div>
    </div>
  )

  if (session.state === 'finished') return (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div><div className="text-6xl mb-4">🏁</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>انتهت اللعبة</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>هذه الجلسة انتهت بالفعل</p>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-3xl font-black gradient-text-primary mb-1">انضم للعبة</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            كود الجلسة:{' '}
            <span className="font-mono font-bold" style={{ color: 'var(--color-accent)' }}>
              {session.join_code || (sessionId as string).slice(0, 6).toUpperCase()}
            </span>
          </p>
        </div>

        <div className="card-glass space-y-6 p-6">
          <div>
            <label className="label">اسمك</label>
            <input className="input text-center text-lg" placeholder="أدخل اسمك..."
              value={playerName} onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={20} autoFocus />
          </div>

          {teams.length > 0 ? (
            <div>
              <label className="label">اختر فريقك</label>
              <div className="grid grid-cols-2 gap-3">
                {teams.map(team => (
                  <button key={team.id} onClick={() => setSelectedTeam(team.id)}
                    className="p-4 rounded-2xl border-2 transition-all text-center font-bold"
                    style={{
                      background: selectedTeam === team.id ? team.color + '22' : 'var(--color-surface-2)',
                      borderColor: selectedTeam === team.id ? team.color : 'var(--color-border)',
                      color: selectedTeam === team.id ? team.color : 'var(--color-text-secondary)',
                      boxShadow: selectedTeam === team.id ? `0 0 20px ${team.color}44` : 'none'
                    }}>
                    <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ background: team.color }} />
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
              <div className="text-3xl mb-2">⏳</div>
              <p>في انتظار إعداد الفرق من المضيف...</p>
            </div>
          )}

          <button onClick={handleJoin}
            disabled={joining || !playerName.trim() || !selectedTeam}
            className="btn btn-primary btn-lg w-full">
            {joining ? 'جاري الانضمام...' : 'انضم الآن 🚀'}
          </button>
        </div>
      </motion.div>
    </main>
  )
}
