'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import Mascot from '@/components/Mascot'
import toast from 'react-hot-toast'
import { useFeedbackStore } from '@/store/feedbackStore'

const TEAM_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'] as const

interface Team { name: string; color: string }

export default function StudioSetupPage({ params }: { params: Promise<{ creationId: string }> }) {
  const router = useRouter()
  const { lang } = useFeedbackStore()
  const isRtl = lang === 'AR'
  
  const [creationId, setCreationId] = useState<string>('')
  const [creation, setCreation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [step, setStep] = useState(1)

  const [teams, setTeams] = useState<Team[]>([
    { name: isRtl ? 'الفريق 1' : 'Team 1', color: '#8B5CF6' },
    { name: isRtl ? 'الفريق 2' : 'Team 2', color: '#EC4899' },
  ])

  useEffect(() => {
    params.then(p => {
      setCreationId(p.creationId)
    })
  }, [params])

  useEffect(() => {
    if (!creationId) return
    const load = async () => {
      try {
        const { getAllCreations } = await import('@/lib/indexedDB')
        const all = await getAllCreations()
        const found = all.find(c => c.id === creationId)
        if (found) setCreation(found)
        else {
          toast.error(isRtl ? 'لم يتم العثور على الجلسة' : 'Session not found')
          router.push('/dashboard')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [creationId, isRtl, router])

  const handleStart = async () => {
    setIsStarting(true)
    const tid = toast.loading(isRtl ? 'جاري بدء اللعبة...' : 'Launching game...')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      // 1. Create a session
      const session = await gameEngine.createSession(user.id, 'local')
      
      // 2. Set Name & Auto-create teams
      await Promise.all([
        (supabase.from('sessions') as any).update({ name: creation.name }).eq('id', session.id),
        (supabase.from('teams') as any).insert(
          teams.map(t => ({
            session_id: session.id,
            name: t.name,
            color: t.color,
            score: 0
          }))
        )
      ])

      // 3. Inject Studio Questions directly
      await gameEngine.generateQuestions(session.id, creation)
      
      // 4. Start Session
      await gameEngine.startGame(session.id)
      
      toast.success(isRtl ? 'استمتع باللعب!' : 'Enjoy the game!', { id: tid })
      // 5. Direct Redirect to Game Board
      router.push(`/game/${session.id}`)
      
    } catch (err: any) {
      console.error(err)
      toast.error(err.message, { id: tid })
      setIsStarting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
    </div>
  )

  if (!creation) return null

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#050510', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* Cinematic Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-[0.03] bg-repeat mix-blend-overlay" />
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#D4AF37]/10 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto pt-16 px-6">
        
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-lg tracking-tighter">
                {creation.name}
              </h1>
              <p className="text-white/50 text-sm font-bold tracking-widest uppercase">
                {isRtl ? 'إعداد فرق اللعب' : 'Setup Teams'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col md:flex-row gap-12">
                
                {/* Visual Preview */}
                <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-black/20 rounded-[2rem] p-8">
                  <Mascot state="thinking" size={120} />
                  <p className="mt-6 font-black text-white/40 tracking-widest text-center text-sm">
                    {isRtl ? 'مستعدون للتحدي؟' : 'READY FOR THE CHALLENGE?'}
                  </p>
                </div>

                {/* Team Editor */}
                <div className="flex-1 space-y-6">
                  {teams.map((team, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-2xl p-4">
                       <div 
                         className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-xl font-black shadow-lg"
                         style={{ background: team.color, boxShadow: `0 0 20px ${team.color}50` }}
                       >
                         {idx + 1}
                       </div>
                       <input 
                         value={team.name}
                         onChange={(e) => {
                           const n = [...teams]; n[idx].name = e.target.value; setTeams(n)
                         }}
                         className="flex-1 bg-transparent text-white font-black text-xl focus:outline-none"
                         placeholder={isRtl ? `الفريق ${idx + 1}` : `Team ${idx + 1}`}
                       />
                       {teams.length > 2 && (
                         <button 
                           onClick={() => setTeams(teams.filter((_, i) => i !== idx))}
                           className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-all"
                         >
                           ✕
                         </button>
                       )}
                    </div>
                  ))}

                  {teams.length < 4 && (
                    <button 
                      onClick={() => setTeams([...teams, { name: isRtl ? `الفريق ${teams.length + 1}` : `Team ${teams.length + 1}`, color: TEAM_COLORS[teams.length] }])}
                      className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 text-white/30 font-black hover:bg-white/5 hover:text-white/60 hover:border-white/20 transition-all uppercase tracking-widest text-sm"
                    >
                      {isRtl ? '+ إضافة فريق' : '+ Add Team'}
                    </button>
                  )}
                  
                  <div className="pt-8">
                    <button 
                      onClick={() => setStep(2)}
                      className="w-full py-5 rounded-[1.5rem] bg-white text-black font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      {isRtl ? 'التالي' : 'Next'} →
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10">
            <h2 className="text-3xl font-black mb-16 tracking-widest text-white/90 drop-shadow-xl text-center uppercase">
              {isRtl ? 'المنافسون' : 'CONTENDERS'}
            </h2>
            <div className="flex flex-wrap justify-center gap-12 md:gap-20 w-full mb-16">
              {teams.map((team, idx) => (
                <motion.div key={idx} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.15 }} className="flex flex-col items-center gap-5 relative group">
                  <div className="relative">
                    <div className="absolute -inset-6 rounded-full opacity-0 group-hover:opacity-30 transition-opacity blur-2xl" style={{ background: team.color }} />
                    <Mascot state="idle" size={100} color={team.color} />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-black text-xl text-white tracking-wide">{team.name}</span>
                    <div className="w-10 h-1.5 rounded-full" style={{ background: team.color, boxShadow: `0 0 15px ${team.color}90` }} />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all font-bold">
                ← {isRtl ? 'تعديل' : 'Edit'}
              </button>
              <button 
                onClick={handleStart}
                disabled={isStarting}
                className="px-12 py-4 rounded-2xl bg-[#D4AF37] text-black font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_30px_rgba(212,175,55,0.4)]"
              >
                {isStarting ? (
                   <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                ) : (
                  <span>{isRtl ? 'ابدأ اللعب' : 'LAUNCH GAME'} 🚀</span>
                )}
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}
