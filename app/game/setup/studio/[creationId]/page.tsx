'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import Mascot from '@/components/Mascot'
import toast from 'react-hot-toast'
import { useFeedbackStore } from '@/store/feedbackStore'
import type { MascotState } from '@/types/game'

const PALETTE = [
  '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', 
  '#F59E0B', '#EF4444', '#84CC16', '#06B6D4'
] as const

const MASCOT_QUOTES_AR = [
  'فضايح اليوم برعاية الاستوديو! 🤫🎭',
  'مين فاكر الذكريات والمواقف المحرجة؟ 😂🔥',
  'أسرار وحكايات ما يعلم بيها إلا الحاضرين! 🌟',
  'الأسئلة دي مش من جوجل، دي من الصميم! 🎯',
  'جهزوا نفسكم للضحك والذكريات الجميلة! 🍿✨',
  'جلسة خاصة جداً، اللي يحصل هنا يفضل هنا! 🔒😎'
]

const MASCOT_QUOTES_EN = [
  'Inside jokes and untold memories loading... 🤫🎭',
  'Who is ready to get called out today? 😂🔥',
  'No Google search can save you now! 🎯',
  'Private memories, legendary battles! 🌟',
  'What happens in the studio, stays in the studio! 🔒😎'
]

const CREATIVE_NAMES_AR = [
  'شلة الأنس', 'أبطال السهرة', 'ملوك التريفيا', 'فريق الفضايح', 'العباقرة المقنعين', 
  'صيادي النقاط', 'أصحاب المزاج', 'فرسان الطاولة', 'دكاترة التحليل', 'أساطير الضحك',
  'صقور الليل', 'قاهرين الصعاب', 'مجانين الذكريات', 'وحوش التحدي', 'أصحاب السوابق',
  'عصابة القهوة', 'المخضرمين', 'الخبراء الاستراتيجيين', 'حزب الكنبة', 'فريق الطوارئ',
  'الرايقين جداً', 'أبطال الكيبورد', 'أصحاب النفوس الطيبة', 'مستشارين الشلة', 'صناع السعادة',
  'الفرقة الانتحارية', 'سادة التكتيك', 'تجار السعادة', 'فريق الأحلام', 'أصحاب العقول الكبيرة',
  'مكتشفي الثغرات', 'قراصنة الأجوبة', 'محترفي التسليك', 'أساتذة الارتجال', 'الخط الساخن',
  'رواد الفضاء', 'أسياد اللعبة', 'ملوك المزاج', 'فرقة التدخل السريع', 'الرقم الصعب'
]

const CREATIVE_NAMES_EN = [
  'Night Owls', 'Trivia Titans', 'Gossip Gurus', 'Memory Masters', 'Point Hunters',
  'Vibe Tribe', 'The Masterminds', 'Quiz Legends', 'Chaos Club', 'Elite Contenders',
  'Brainy Bunch', 'Sofa Surfers', 'Coffee Cartel', 'The High Rollers', 'Buzzer Beaters',
  'Fact Finders', 'Laughter Syndicate', 'Procrastinators', 'Secret Geniuses', 'Dream Team',
  'Quiztophians', 'The Untouchables', 'Mystery Solvers', 'Late Night Squad', 'Vibe Checkers',
  'Lethal Intelligence', 'Underdog Empire', 'Savage Scholars', 'Mind Benders', 'Trivia Mafia'
]

// Simple Web Audio UI Beep for premium feedback
const playSound = (freq = 400, type: OscillatorType = 'sine', duration = 0.08) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch (e) {
    // Audio context not allowed
  }
}

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
      for (let i = 0; i < 70; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 2.5 + 1,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25 - 0.08,
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
        const cx = w * (0.25 + (i * 0.5)) + Math.sin(timeRef.current * 0.8 + i) * 140
        const cy = h * 0.5 + Math.cos(timeRef.current * 0.6 + i) * 120
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.45)
        grad.addColorStop(0, `${color}25`)
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

        const alpha = 0.25 + 0.75 * Math.abs(Math.sin(timeRef.current * 1.5 + p.phase))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * (1 + alpha * 0.4), 0, Math.PI * 2)
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
  
  const [mascotState, setMascotState] = useState<MascotState>('thinking')
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
        const found = all.find((c: any) => c.id === creationId)
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
  const handleMascotClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    playSound(523, 'triangle', 0.1)
    const states: MascotState[] = ['correct', 'hype', 'idle', 'thinking']
    setMascotState(prev => states[(states.indexOf(prev) + 1) % states.length])
    setQuoteIdx(prev => (prev + 1) % (isRtl ? MASCOT_QUOTES_AR.length : MASCOT_QUOTES_EN.length))
  }

  const handleStart = async () => {
    if (!teams[0].name.trim() || !teams[1].name.trim()) {
      playSound(200, 'sawtooth', 0.15)
      toast.error(isRtl ? 'يرجى كتابة أسماء الفريقين!' : 'Please enter names for both teams!')
      return
    }

    playSound(800, 'sine', 0.15)
    setIsStarting(true)
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
      
      router.push(`/game/${session.id}?fast=1`)
      
    } catch (err: any) {
      console.error(err)
      toast.error(err.message)
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
      className="w-screen h-screen relative overflow-hidden select-none flex flex-col justify-center items-center font-sans" 
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
              className="w-full flex flex-col items-center justify-center max-h-full my-auto"
            >
              
              {/* Top Studio Badge & Title */}
              <div className="text-center mb-8">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-block px-5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black text-[#D4AF37] tracking-widest uppercase mb-2 backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  {isRtl ? '✨ جلسة خاصة (ذكريات وأسرار الاستوديو) ✨' : '✨ PRIVATE STUDIO SESSION ✨'}
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl tracking-tight line-clamp-1 max-w-3xl px-4">
                  {creation.name}
                </h1>
              </div>

              {/* Main Arena Box */}
              <div className="w-full bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-6 md:p-10 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-4xl relative">
                
                {/* Mascot Column with Private Session Witty Quotes */}
                <motion.div 
                  className="w-full md:w-5/12 flex flex-col items-center justify-center relative cursor-pointer group select-none py-4"
                  onClick={handleMascotClick}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/15 via-purple-500/10 to-transparent rounded-[2rem] filter blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Witty Speech Bubble */}
                  <motion.div 
                    initial={{ y: 5 }} 
                    animate={{ y: [-4, 4, -4] }} 
                    transition={{ repeat: Infinity, duration: 3.5 }}
                    className="absolute -top-8 md:-top-12 bg-[#0F0F1A]/95 border border-[#D4AF37]/50 rounded-2xl px-6 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-center z-20 pointer-events-none max-w-[280px]"
                  >
                    <span className="text-xs md:text-sm font-black text-[#FFE885] leading-snug drop-shadow block">
                      {quotes[quoteIdx]}
                    </span>
                  </motion.div>

                  <motion.div 
                    animate={{ y: [-6, 6, -6] }} 
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="relative z-10 pt-4"
                  >
                    <Mascot state={mascotState} size={170} />
                  </motion.div>

                  <div className="mt-4 text-center z-10">
                    <span className="text-[11px] text-white/40 uppercase tracking-widest font-extrabold bg-white/5 px-4 py-1.5 rounded-full border border-white/10 group-hover:border-white/30 group-hover:text-white/80 transition-all shadow-inner">
                      {isRtl ? '👈 انقر لتغيير المقولة' : '👈 Click to interact'}
                    </span>
                  </div>
                </motion.div>

                {/* Team Input Column with Smooth Collapsible Color Tray */}
                <div className="w-full md:w-7/12 flex flex-col gap-6">
                  {teams.map((team, idx) => (
                    <div 
                      key={idx}
                      className="relative bg-black/60 border rounded-2xl p-4 md:p-6 backdrop-blur-2xl transition-all shadow-2xl flex flex-col gap-3 group"
                      style={{ 
                        boxShadow: activeColorPicker === idx ? `0 0 50px ${team.color}60` : `0 0 25px ${team.color}15`,
                        borderColor: activeColorPicker === idx ? team.color : 'rgba(255,255,255,0.15)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Number Trigger */}
                        <button 
                          type="button"
                          onClick={() => {
                            playSound(600 + idx * 100, 'sine', 0.05)
                            setActiveColorPicker(activeColorPicker === idx ? null : idx)
                          }}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl shadow-2xl transition-transform hover:scale-105 active:scale-95 border-2 border-white/30 shrink-0"
                          style={{ background: team.color, boxShadow: `0 0 30px ${team.color}90` }}
                          title={isRtl ? 'انقر لتغيير اللون' : 'Click to change color'}
                        >
                          <span className="text-white drop-shadow-md">{idx + 1}</span>
                        </button>

                        {/* Team Name Input & Randomizer */}
                        <div className="flex-1 space-y-1 w-full overflow-hidden">
                          <div className="flex items-center gap-2">
                            <input 
                              value={team.name}
                              onChange={(e) => {
                                const n = [...teams]; n[idx].name = e.target.value; setTeams(n)
                              }}
                              className="w-full bg-transparent text-white font-black text-2xl md:text-3xl tracking-wide placeholder:text-white/20 focus:outline-none pb-1 truncate"
                              placeholder={isRtl ? `اسم الفريق ${idx + 1}` : `Team ${idx + 1} Name`}
                            />
                            <button 
                              type="button" 
                              onClick={() => {
                                playSound(700 + idx * 150, 'triangle', 0.08)
                                const list = isRtl ? CREATIVE_NAMES_AR : CREATIVE_NAMES_EN
                                const random = list[Math.floor(Math.random() * list.length)]
                                const n = [...teams]; n[idx].name = random; setTeams(n)
                                setMascotState('hype')
                              }}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110 active:scale-95 text-[#D4AF37] flex items-center justify-center transition-all shrink-0 shadow-lg group/btn"
                              title={isRtl ? 'اسم عشوائي مبتكر' : 'Randomize Name'}
                            >
                              <span className="text-xl md:text-2xl transition-transform group-hover/btn:rotate-45">🎲</span>
                            </button>
                          </div>
                          {/* Directional gradient underline */}
                          <div 
                            className="h-1 rounded-full w-full transition-all duration-500 opacity-60 group-focus-within:opacity-100 shadow-lg" 
                            style={{ 
                              backgroundImage: `linear-gradient(${isRtl ? 'to left' : 'to right'}, ${team.color}, transparent)`,
                              boxShadow: `0 0 15px ${team.color}`
                            }} 
                          />
                        </div>
                      </div>

                      {/* Smooth Sliding Horizontal Color Tray (Zero Clipping, 100% Reliable) */}
                      <AnimatePresence>
                        {activeColorPicker === idx && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 mt-2 border-t border-white/10 flex flex-wrap gap-2.5 items-center justify-center bg-black/40 p-3 rounded-xl">
                              {PALETTE.map(c => (
                                <button 
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    playSound(880, 'triangle', 0.08)
                                    const n = [...teams]; n[idx].color = c; setTeams(n)
                                    setActiveColorPicker(null)
                                    setMascotState('hype')
                                  }}
                                  className="w-8 h-8 md:w-9 md:h-9 rounded-xl transition-transform hover:scale-125 hover:rotate-6 border-2 border-white/40 shadow-xl relative flex items-center justify-center cursor-pointer"
                                  style={{ background: c }}
                                >
                                  {team.color === c && (
                                    <span className="text-white font-black text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">✓</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { playSound(659, 'sine', 0.1); setStep(2); }}
                    className="btn-aurora btn-aurora-gold w-full py-5 font-black uppercase tracking-[0.2em] shadow-2xl text-base flex items-center justify-center gap-3 text-white"
                  >
                    <span>{isRtl ? 'التالي: استعراض المواجهة' : 'Next: Review Contenders'}</span>
                    <span className="text-xl font-bold">→</span>
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
              className="w-full flex flex-col items-center justify-center h-full max-w-4xl my-auto"
            >
              <div className="text-center mb-8">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-extrabold text-[#D4AF37] uppercase tracking-widest mb-2">
                  {isRtl ? 'المواجهة الكبرى' : 'THE ULTIMATE SHOWDOWN'}
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl uppercase tracking-wider">
                  {isRtl ? 'المنافسون' : 'CONTENDERS'}
                </h2>
              </div>

              {/* VS Arena Box */}
              <div className="flex justify-center items-center gap-6 md:gap-20 w-full my-6 bg-white/[0.03] border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05),transparent_70%)] pointer-events-none" />
                
                {/* Team 1 */}
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-4 relative group flex-1 z-10">
                  <div className="absolute -inset-10 rounded-full opacity-30 blur-3xl group-hover:opacity-60 transition-all animate-pulse" style={{ background: teams[0].color }} />
                  <Mascot state="idle" size={140} color={teams[0].color} />
                  <span className="font-black text-2xl md:text-4xl text-white tracking-wide text-center drop-shadow-lg">{teams[0].name}</span>
                  <div className="w-20 h-2 rounded-full shadow-lg" style={{ background: teams[0].color, boxShadow: `0 0 25px ${teams[0].color}` }} />
                </motion.div>

                {/* VS Badge */}
                <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 0.3, duration: 0.5 }} className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] border-4 border-black text-black font-black text-3xl md:text-4xl flex items-center justify-center shadow-[0_0_60px_rgba(212,175,55,0.9)] z-20 shrink-0">
                  VS
                </motion.div>

                {/* Team 2 */}
                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-4 relative group flex-1 z-10">
                  <div className="absolute -inset-10 rounded-full opacity-30 blur-3xl group-hover:opacity-60 transition-all animate-pulse" style={{ background: teams[1].color }} />
                  <Mascot state="idle" size={140} color={teams[1].color} />
                  <span className="font-black text-2xl md:text-4xl text-white tracking-wide text-center drop-shadow-lg">{teams[1].name}</span>
                  <div className="w-20 h-2 rounded-full shadow-lg" style={{ background: teams[1].color, boxShadow: `0 0 25px ${teams[1].color}` }} />
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-5 w-full max-w-xl mt-8 z-10">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { playSound(400, 'sine', 0.1); setStep(1); }} className="flex-1 px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all font-black text-sm tracking-wider uppercase">
                  ← {isRtl ? 'تعديل الفرق' : 'Edit Teams'}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.03 }} 
                  whileTap={{ scale: 0.97 }} 
                  onClick={handleStart}
                  disabled={isStarting}
                  className="btn-aurora btn-aurora-sunset flex-[2] py-5 font-black uppercase tracking-[0.2em] shadow-2xl disabled:opacity-50 text-base md:text-lg flex items-center justify-center gap-3 text-white"
                >
                  {isStarting ? (
                     <span className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin inline-block" />
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
