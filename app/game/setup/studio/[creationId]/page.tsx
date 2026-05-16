'use client'

import { useEffect, useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import Mascot from '@/components/Mascot'
import toast from 'react-hot-toast'
import { useFeedbackStore } from '@/store/feedbackStore'

const PALETTE = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#84CC16', '#06B6D4'] as const

interface Team { name: string; color: string }

function LiveCanvasBackground({ teamColors }: { teamColors: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    const particles: { x: number; y: number; r: number; vx: number; vy: number; color: string; phase: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particles.length = 0
      const colors = teamColors.length ? teamColors : ['#8B5CF6', '#EC4899', '#D4AF37']
      for (let i = 0; i < 75; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 3 + 1,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3 - 0.1,
          color: colors[i % colors.length],
          phase: Math.random() * Math.PI * 2
        })
      }
    }

    window.addEventListener('resize', resize)
    resize()

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      timeRef.current += 0.01

      ctx.fillStyle = '#050510'
      ctx.fillRect(0, 0, w, h)

      // Ambient Glowing Orbs
      teamColors.forEach((color, i) => {
        const cx = w * (0.3 + (i * 0.4)) + Math.sin(timeRef.current + i) * 150
        const cy = h * 0.5 + Math.cos(timeRef.current * 0.7 + i) * 150
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.45)
        grad.addColorStop(0, `${color}25`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      })

      // Star Dust Particles
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(timeRef.current * 2 + p.phase))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * (1 + alpha * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`
        ctx.shadowBlur = 15
        ctx.shadowColor = p.color
        ctx.fill()
      })

      rafId = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize) }
  }, [teamColors.join(',')])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />
}

export default function StudioSetupPage({ params }: { params: Promise<{ creationId: string }> }) {
  const router = useRouter()
  const { lang } = useFeedbackStore()
  const isRtl = lang === 'AR'
  
  const [creationId, setCreationId] = useState<string>('')
  const [creation, setCreation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [step, setStep] = useState(1)
  const [activeColorPicker, setActiveColorPicker] = useState<number | null>(null)

  const [teams, setTeams] = useState<Team[]>([
    { name: isRtl ? 'الفريق الأول' : 'Team One', color: '#8B5CF6' },
    { name: isRtl ? 'الفريق الثاني' : 'Team Two', color: '#EC4899' },
  ])

  useEffect(() => {
    params.then(p => setCreationId(p.creationId))
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
    if (!teams[0].name.trim() || !teams[1].name.trim()) {
      toast.error(isRtl ? 'يرجى كتابة أسماء الفريقين!' : 'Please enter names for both teams!')
      return
    }

    setIsStarting(true)
    const tid = toast.loading(isRtl ? 'جاري تجهيز مسرح المواجهة...' : 'Setting up the arena...')
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
            name: t.name.trim(),
            color: t.color,
            score: 0
          }))
        )
      ])

      // 3. Inject Studio Questions directly
      await gameEngine.generateQuestions(session.id, creation)
      
      // 4. Start Session
      await gameEngine.startGame(session.id)
      
      toast.success(isRtl ? 'استمتع بالتحدي الملحمي!' : 'Enjoy the epic battle!', { id: tid })
      router.push(`/game/${session.id}`)
      
    } catch (err: any) {
      console.error(err)
      toast.error(err.message, { id: tid })
      setIsStarting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
    </div>
  )

  if (!creation) return null

  return (
    <div className="min-h-screen relative overflow-hidden select-none" style={{ background: '#050510', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* Dynamic Live Canvas Background */}
      <LiveCanvasBackground teamColors={teams.map(t => t.color)} />

      <div className="relative z-10 max-w-4xl mx-auto pt-12 md:pt-20 px-6">
        
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-12">
              
              <div className="text-center space-y-3">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-[#D4AF37] tracking-widest uppercase mb-2 backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  {isRtl ? 'جلسة خاصة (استوديو)' : 'Private Studio Session'}
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl tracking-tight">
                  {creation.name}
                </h1>
                <p className="text-white/60 text-sm md:text-base font-medium max-w-lg mx-auto">
                  {isRtl ? 'المواجهة الثنائية المباشرة! حدد هوية وألوان المتنافسين.' : 'The head-to-head showdown! Customize the contenders.'}
                </p>
              </div>

              <div className="relative bg-white/[0.03] border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#EC4899]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                  
                  {/* Premium Mascot Card */}
                  <motion.div whileHover={{ scale: 1.02, rotateY: 5 }} className="w-full md:w-5/12 flex flex-col items-center justify-center border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent rounded-[2.5rem] p-8 py-12 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0" />
                    <div className="relative z-10 flex flex-col items-center">
                      <Mascot state="thinking" size={140} />
                      <div className="mt-8 text-center space-y-1">
                        <h3 className="font-black text-xl text-white tracking-wide">
                          {isRtl ? 'المواجهة الكبرى' : 'THE ULTIMATE DUEL'}
                        </h3>
                        <p className="text-xs text-white/50">
                          {isRtl ? 'فريقان فقط يمكنهما دخول الحلبة' : 'Only two teams may enter the arena'}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* 2 Teams Customizer */}
                  <div className="w-full md:w-7/12 space-y-6">
                    {teams.map((team, idx) => (
                      <motion.div 
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        className="relative flex items-center gap-4 bg-black/50 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-lg shadow-xl"
                        style={{ boxShadow: `0 0 30px ${team.color}15` }}
                      >
                         {/* Color Button / Indicator */}
                         <div className="relative">
                           <button 
                             type="button"
                             onClick={() => setActiveColorPicker(activeColorPicker === idx ? null : idx)}
                             className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-xl font-black shadow-2xl transition-transform active:scale-95 border-2 border-white/20"
                             style={{ background: team.color, boxShadow: `0 0 25px ${team.color}80` }}
                           >
                             <span className="text-white drop-shadow">{idx + 1}</span>
                           </button>

                           {/* Color Picker Popup */}
                           <AnimatePresence>
                             {activeColorPicker === idx && (
                               <motion.div 
                                 initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                 animate={{ opacity: 1, scale: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                 className="absolute top-16 start-0 z-50 bg-[#0F0F1A] border border-white/20 rounded-2xl p-3 shadow-2xl flex gap-2 backdrop-blur-xl"
                               >
                                 {PALETTE.map(c => (
                                   <button 
                                     key={c}
                                     onClick={() => {
                                       const n = [...teams]; n[idx].color = c; setTeams(n); setActiveColorPicker(null)
                                     }}
                                     className="w-8 h-8 rounded-xl transition-transform hover:scale-110 border border-white/20"
                                     style={{ background: c }}
                                   />
                                 ))}
                               </motion.div>
                             )}
                           </AnimatePresence>
                         </div>

                         {/* Team Name Input */}
                         <div className="flex-1 space-y-1">
                           <input 
                             value={team.name}
                             onChange={(e) => {
                               const n = [...teams]; n[idx].name = e.target.value; setTeams(n)
                             }}
                             className="w-full bg-transparent text-white font-black text-2xl tracking-wide placeholder:text-white/20 focus:outline-none"
                             placeholder={isRtl ? `اسم الفريق ${idx + 1}` : `Team ${idx + 1} Name`}
                           />
                           <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                             {isRtl ? 'انقر على الرقم لتغيير اللون' : 'Click number to change color'}
                           </div>
                         </div>
                      </motion.div>
                    ))}

                    <div className="pt-6">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep(2)}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-white to-white/90 text-black font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all text-base"
                      >
                        {isRtl ? 'التالي: مراجعة المتنافسين' : 'Next: Review Contenders'} →
                      </motion.button>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-8 space-y-16">
              <div className="text-center space-y-2">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-black text-[#D4AF37] uppercase tracking-widest">
                  {isRtl ? 'المواجهة المنتظرة' : 'THE ANTICIPATED SHOWDOWN'}
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl uppercase tracking-wider">
                  {isRtl ? 'المنافسون' : 'CONTENDERS'}
                </h2>
              </div>

              <div className="flex justify-center items-center gap-12 md:gap-32 w-full">
                {teams.map((team, idx) => (
                  <motion.div key={idx} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.15 }} className="flex flex-col items-center gap-6 relative group">
                    <div className="relative">
                      <div className="absolute -inset-10 rounded-full opacity-40 blur-3xl transition-opacity group-hover:opacity-60 animate-pulse" style={{ background: team.color }} />
                      <Mascot state="idle" size={140} color={team.color} />
                    </div>
                    <div className="flex flex-col items-center gap-3 relative z-10">
                      <span className="font-black text-2xl md:text-3xl text-white tracking-wide text-center drop-shadow-md">{team.name}</span>
                      <div className="w-16 h-2 rounded-full" style={{ background: team.color, boxShadow: `0 0 20px ${team.color}` }} />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-8">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(1)} className="flex-1 px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-black text-sm tracking-wider uppercase">
                  ← {isRtl ? 'تعديل الفرق' : 'Edit Teams'}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.03 }} 
                  whileTap={{ scale: 0.97 }} 
                  onClick={handleStart}
                  disabled={isStarting}
                  className="flex-[2] px-12 py-5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-black uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(212,175,55,0.6)] hover:shadow-[0_0_80px_rgba(212,175,55,0.8)] transition-all disabled:opacity-50 disabled:pointer-events-none text-base flex items-center justify-center gap-3 border border-[#FFE885]"
                >
                  {isStarting ? (
                     <span className="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                  ) : (
                    <span>{isRtl ? 'ابدأ المواجهة الملحمية' : 'LAUNCH SHOWDOWN'} 🚀</span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
