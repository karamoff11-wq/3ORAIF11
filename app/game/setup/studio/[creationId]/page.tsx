'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import Mascot from '@/components/Mascot'
import toast from 'react-hot-toast'
import { useFeedbackStore } from '@/store/feedbackStore'

const PALETTE = [
  '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', 
  '#F59E0B', '#EF4444', '#84CC16', '#06B6D4'
] as const

const MASCOT_QUOTES_AR = [
  'الميدان يا حميدان! 🔥',
  'ألوان تشعل الحماس! 🎨',
  'من سيتوج بطل الاستوديو؟ 🏆',
  'التحدي يحتاج أعصاب من حديد! ⚡',
  'جاهزون للمعركة الفكرية؟ 🧠'
]

const MASCOT_QUOTES_EN = [
  'Bring your A-game! 🔥',
  'Colors that spark passion! 🎨',
  'Who will be the Studio Champion? 🏆',
  'Nerves of steel required! ⚡',
  'Ready for the ultimate brain battle? 🧠'
]

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
      const colors = teamColors.length ? teamColors : ['#8B5CF6', '#EC4899']
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 2.5 + 1,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2 - 0.05,
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

      // Ambient Dual Glowing Orbs
      teamColors.forEach((color, i) => {
        const cx = w * (0.25 + (i * 0.5)) + Math.sin(timeRef.current * 0.8 + i) * 120
        const cy = h * 0.5 + Math.cos(timeRef.current * 0.5 + i) * 100
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.45)
        grad.addColorStop(0, `${color}28`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      })

      // Floating Stars
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        const alpha = 0.2 + 0.8 * Math.abs(Math.sin(timeRef.current * 1.5 + p.phase))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * (1 + alpha * 0.4), 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`
        ctx.shadowBlur = 12
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
  
  const [mascotState, setMascotState] = useState<'thinking' | 'happy' | 'celebrating' | 'shocked'>('thinking')
  const [quoteIdx, setQuoteIdx] = useState(0)

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

  // Cycle mascot quote & state on click
  const handleMascotClick = () => {
    const states: ('thinking' | 'happy' | 'celebrating' | 'shocked')[] = ['happy', 'celebrating', 'shocked', 'thinking']
    setMascotState(prev => states[(states.indexOf(prev) + 1) % states.length])
    setQuoteIdx(prev => (prev + 1) % (isRtl ? MASCOT_QUOTES_AR.length : MASCOT_QUOTES_EN.length))
  }

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

      const session = await gameEngine.createSession(user.id, 'local')
      
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

      await gameEngine.generateQuestions(session.id, creation)
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
    <div className="w-screen h-screen bg-[#050510] flex items-center justify-center overflow-hidden">
      <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
    </div>
  )

  if (!creation) return null

  const quotes = isRtl ? MASCOT_QUOTES_AR : MASCOT_QUOTES_EN

  return (
    <div 
      className="w-screen h-screen relative overflow-hidden select-none flex flex-col justify-center items-center" 
      style={{ background: '#050510', direction: isRtl ? 'rtl' : 'ltr' }}
    >
      <LiveCanvasBackground teamColors={teams.map(t => t.color)} />

      <div className="relative z-10 w-full max-w-5xl px-6 py-4 flex flex-col items-center justify-center h-full">
        
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, scale: 0.96 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.96 }} 
              className="w-full flex flex-col items-center max-h-full"
            >
              
              {/* Top Title Header */}
              <div className="text-center mb-6">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-[#D4AF37] tracking-widest uppercase mb-1 backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  {isRtl ? 'جلسة خاصة (استوديو)' : 'Private Studio Session'}
                </motion.div>
                <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-2xl tracking-tight line-clamp-1 max-w-2xl px-4">
                  {creation.name}
                </h1>
              </div>

              {/* Main Content Box */}
              <div className="w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 md:p-10 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-4xl">
                
                {/* Left/Right: Interactive Big Mascot */}
                <motion.div 
                  className="w-full md:w-5/12 flex flex-col items-center justify-center relative cursor-pointer group select-none"
                  onClick={handleMascotClick}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/10 via-purple-500/5 to-transparent rounded-[2rem] filter blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
                  
                  {/* Floating Speech Bubble */}
                  <motion.div 
                    initial={{ y: 5 }} 
                    animate={{ y: [-3, 3, -3] }} 
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -top-10 bg-black/80 border border-white/20 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-xl text-center z-20 pointer-events-none"
                  >
                    <span className="text-xs font-bold text-[#D4AF37] whitespace-nowrap">
                      {quotes[quoteIdx]}
                    </span>
                  </motion.div>

                  <motion.div 
                    animate={{ y: [-6, 6, -6] }} 
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="relative z-10 pt-4"
                  >
                    <Mascot state={mascotState} size={160} />
                  </motion.div>

                  <div className="mt-4 text-center z-10">
                    <span className="text-[11px] text-white/40 uppercase tracking-widest font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5 group-hover:border-white/20 transition-all">
                      {isRtl ? '👈 انقر للتفاعل' : '👈 Click to interact'}
                    </span>
                  </div>
                </motion.div>

                {/* Right/Left: 2 Teams Input & Color Picker */}
                <div className="w-full md:w-7/12 flex flex-col gap-5">
                  {teams.map((team, idx) => (
                    <div 
                      key={idx}
                      className="relative bg-black/40 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-xl transition-all shadow-2xl flex items-center gap-4 group"
                      style={{ 
                        boxShadow: activeColorPicker === idx ? `0 0 40px ${team.color}50` : `0 0 20px ${team.color}15`,
                        borderColor: activeColorPicker === idx ? team.color : 'rgba(255,255,255,0.1)'
                      }}
                    >
                      {/* Color Picker Swatch Trigger */}
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setActiveColorPicker(activeColorPicker === idx ? null : idx)}
                          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shadow-xl transition-all group-hover:scale-105 active:scale-95 border-2 border-white/25"
                          style={{ background: team.color, boxShadow: `0 0 25px ${team.color}80` }}
                        >
                          <span className="text-white drop-shadow-md">{idx + 1}</span>
                        </button>

                        {/* Popover Color Grid */}
                        <AnimatePresence>
                          {activeColorPicker === idx && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: 8 }}
                              className="absolute top-16 start-0 z-50 bg-[#0F0F1A]/95 border border-white/20 rounded-2xl p-3 shadow-[0_10px_50px_rgba(0,0,0,0.9)] grid grid-cols-4 gap-2 backdrop-blur-2xl"
                            >
                              {PALETTE.map(c => (
                                <button 
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    const n = [...teams]; n[idx].color = c; setTeams(n); setActiveColorPicker(null); setMascotState('celebrating');
                                  }}
                                  className="w-8 h-8 rounded-xl transition-transform hover:scale-125 border border-white/25 shadow-lg relative"
                                  style={{ background: c }}
                                >
                                  {team.color === c && (
                                    <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs drop-shadow">✓</span>
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Team Name Input */}
                      <div className="flex-1">
                        <input 
                          value={team.name}
                          onChange={(e) => {
                            const n = [...teams]; n[idx].name = e.target.value; setTeams(n)
                          }}
                          className="w-full bg-transparent text-white font-black text-xl md:text-2xl tracking-wide placeholder:text-white/20 focus:outline-none pb-1"
                          placeholder={isRtl ? `اسم الفريق ${idx + 1}` : `Team ${idx + 1} Name`}
                        />
                        <div className="h-0.5 rounded-full w-full bg-gradient-to-r transition-all duration-500 opacity-60 group-focus-within:opacity-100" style={{ backgroundImage: `linear-gradient(to right, ${team.color}, transparent)` }} />
                      </div>
                    </div>
                  ))}

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(2)}
                    className="w-full mt-2 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-white to-white/90 text-black font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all text-sm md:text-base flex items-center justify-center gap-2"
                  >
                    <span>{isRtl ? 'التالي: استعراض المواجهة' : 'Next: Review Contenders'}</span>
                    <span>→</span>
                  </motion.button>
                </div>

              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="w-full flex flex-col items-center justify-center h-full max-w-4xl"
            >
              <div className="text-center mb-8">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-2">
                  {isRtl ? 'المواجهة الكبرى' : 'THE ULTIMATE SHOWDOWN'}
                </motion.div>
                <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-2xl uppercase tracking-wider">
                  {isRtl ? 'المنافسون' : 'CONTENDERS'}
                </h2>
              </div>

              {/* VS Screen */}
              <div className="flex justify-center items-center gap-8 md:gap-24 w-full my-6 bg-white/[0.02] border border-white/10 rounded-[3rem] p-8 backdrop-blur-xl shadow-2xl">
                {/* Team 1 */}
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-4 relative group flex-1">
                  <div className="absolute -inset-8 rounded-full opacity-30 blur-2xl group-hover:opacity-60 transition-all animate-pulse" style={{ background: teams[0].color }} />
                  <Mascot state="idle" size={130} color={teams[0].color} />
                  <span className="font-black text-xl md:text-3xl text-white tracking-wide text-center drop-shadow-md z-10">{teams[0].name}</span>
                  <div className="w-16 h-1.5 rounded-full z-10" style={{ background: teams[0].color, boxShadow: `0 0 20px ${teams[0].color}` }} />
                </motion.div>

                {/* VS Badge */}
                <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 0.3, duration: 0.5 }} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] border-4 border-black text-black font-black text-2xl md:text-3xl flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.8)] z-20 shrink-0">
                  VS
                </motion.div>

                {/* Team 2 */}
                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-4 relative group flex-1">
                  <div className="absolute -inset-8 rounded-full opacity-30 blur-2xl group-hover:opacity-60 transition-all animate-pulse" style={{ background: teams[1].color }} />
                  <Mascot state="idle" size={130} color={teams[1].color} />
                  <span className="font-black text-xl md:text-3xl text-white tracking-wide text-center drop-shadow-md z-10">{teams[1].name}</span>
                  <div className="w-16 h-1.5 rounded-full z-10" style={{ background: teams[1].color, boxShadow: `0 0 20px ${teams[1].color}` }} />
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(1)} className="flex-1 px-8 py-4 md:py-5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all font-black text-sm tracking-wider uppercase">
                  ← {isRtl ? 'تعديل الفرق' : 'Edit Teams'}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.03 }} 
                  whileTap={{ scale: 0.97 }} 
                  onClick={handleStart}
                  disabled={isStarting}
                  className="flex-[2] px-12 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-black uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(212,175,55,0.6)] hover:shadow-[0_0_80px_rgba(212,175,55,0.8)] transition-all disabled:opacity-50 disabled:pointer-events-none text-sm md:text-base flex items-center justify-center gap-3 border border-[#FFE885]"
                >
                  {isStarting ? (
                     <span className="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                  ) : (
                    <span>{isRtl ? 'انطلاق المواجهة الملحمية' : 'LAUNCH SHOWDOWN'} 🚀</span>
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
