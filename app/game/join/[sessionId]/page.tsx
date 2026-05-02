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
  const [step, setStep] = useState<'name' | 'team'>('name')

  useEffect(() => {
    async function load() {
      const [{ data: sess }, { data: teamsData }] = await Promise.all([
        (supabase.from('sessions') as any).select('*').eq('id', sessionId as string).single(),
        (supabase.from('teams') as any).select('*').eq('session_id', sessionId as string),
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
      name: playerName.trim(),
    })
    if (error) { toast.error('فشل الانضمام: ' + error.message); setJoining(false); return }
    toast.success(`مرحباً ${playerName}! 🎮`)
    router.push(`/game/${sessionId}`)
  }

  // Loading
  if (loading) return (
    <div className="min-h-screen bg-[#07071A] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(139,92,246,0.3)', borderTopColor: '#8B5CF6' }} />
    </div>
  )

  // Not found
  if (!session) return (
    <div className="min-h-screen bg-[#07071A] flex items-center justify-center text-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="text-5xl">🔍</div>
        <h1 className="text-2xl font-black text-white">جلسة غير موجودة</h1>
        <p className="text-white/40">تأكد من الكود وحاول مرة أخرى</p>
        <button onClick={() => router.push('/')}
          className="px-6 py-3 rounded-2xl font-bold text-white mt-2 transition-all hover:scale-[1.02]"
          style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
          العودة للرئيسية
        </button>
      </div>
    </div>
  )

  // Finished
  if (session.state === 'finished') return (
    <div className="min-h-screen bg-[#07071A] flex items-center justify-center text-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="text-5xl">🏁</div>
        <h1 className="text-2xl font-black text-white">انتهت اللعبة</h1>
        <p className="text-white/40">هذه الجلسة انتهت بالفعل</p>
      </div>
    </div>
  )

  const joinCode = session.join_code || (sessionId as string).slice(0, 6).toUpperCase()

  return (
    <main className="min-h-screen bg-[#07071A] text-white flex items-center justify-center p-4 relative overflow-hidden"
      style={{ direction: 'rtl', fontFamily: "'Cairo','Tajawal',sans-serif" }}>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl mb-4"
            style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(236,72,153,0.3))', border: '1px solid rgba(139,92,246,0.3)' }}>
            🎮
          </div>
          <h1 className="text-3xl font-black mb-1">انضم للعبة</h1>
          <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
            <span>كود الجلسة:</span>
            <span className="font-mono font-black text-purple-400 text-base tracking-widest">{joinCode}</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6 flex flex-col gap-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>

          {/* Step 1: Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">
              اسمك
            </label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && playerName.trim() && setStep('team')}
              placeholder="أدخل اسمك..."
              maxLength={20}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-base font-bold text-white placeholder-white/20 outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all text-center"
            />
          </div>

          {/* Step 2: Team */}
          {teams.length > 0 ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
                اختر فريقك
              </label>
              <div className="grid grid-cols-2 gap-3">
                {teams.map(team => {
                  const isSelected = selectedTeam === team.id
                  return (
                    <motion.button key={team.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTeam(team.id)}
                      className="p-4 rounded-2xl border-2 transition-all text-center font-bold relative overflow-hidden"
                      style={{
                        background: isSelected ? `${team.color}18` : 'rgba(255,255,255,0.03)',
                        borderColor: isSelected ? team.color : 'rgba(255,255,255,0.08)',
                        color: isSelected ? team.color : 'rgba(255,255,255,0.5)',
                        boxShadow: isSelected ? `0 0 20px ${team.color}25` : 'none',
                      }}>
                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-2 left-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: team.color }}>
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                      <div className="w-8 h-8 rounded-full mx-auto mb-2"
                        style={{ background: team.color, boxShadow: isSelected ? `0 0 12px ${team.color}` : 'none' }} />
                      <p className="text-sm font-black">{team.name}</p>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-white/30">
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-sm">في انتظار إعداد الفرق من المضيف...</p>
            </div>
          )}

          {/* Join button */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={joining || !playerName.trim() || !selectedTeam}
            className="w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: playerName.trim() && selectedTeam
                ? 'linear-gradient(135deg,#8B5CF6,#EC4899)'
                : 'rgba(255,255,255,0.06)',
              color: 'white',
              boxShadow: playerName.trim() && selectedTeam ? '0 8px 24px rgba(139,92,246,0.35)' : 'none',
            }}>
            {joining ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الانضمام...
              </>
            ) : (
              <>🚀 انضم الآن</>
            )}
          </motion.button>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <button onClick={() => router.push('/')}
            className="text-sm text-white/25 hover:text-white/50 transition-colors">
            ← العودة للرئيسية
          </button>
        </div>
      </motion.div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap');
      `}</style>
    </main>
  )
}
