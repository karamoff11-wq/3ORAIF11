'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import { useSession } from '@/hooks/useSession'
import Mascot from '@/components/Mascot'
import toast from 'react-hot-toast'
import { useFeedbackStore, playSound } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'
import { WobbleCard } from "@/components/ui/wobble-card"
import { DirectionAwareHover } from "@/components/ui/direction-aware-hover"
import { PremiumSearchBar } from "@/components/ui/premium-search-bar"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface CropConfig {
  cat_setup?: { zoom?: number; x?: number; y?: number }
}
interface Category {
  id: string; name: string; topic_id: string
  image_url?: string; description?: string; crop_config?: CropConfig
}
interface Topic {
  id: string; name: string; icon?: string; color?: string
  order_index?: number; created_at?: string
  background_url?: string; banner_url?: string
  categories: Category[]
}
interface Team { name: string; color: string }
interface Punishment {
  id: string; text: string; level: 1 | 2 | 3; enabled: boolean
}
type PunishmentMode = 'wheel' | 'voted' | 'escalating' | 'mixed'
// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const MAX_CATS = 6
const DRAFT_KEY = 'gg-draft'

const TEAM_COLORS = ['#FF0055', '#00E5FF', '#7000FF', '#00FF66', '#FFB700', '#FF00CC', '#3D59FF', '#00FFCC'] as const

const DEFAULT_PUNISHMENTS: Punishment[] = [
  // Level 1: Easy & Amusing
  { id: 'p1', text: 'اعمل 10 ضغطات', level: 1, enabled: true },
  { id: 'p2', text: 'غني مقطع من أغنية', level: 1, enabled: true },
  { id: 'p5', text: 'اشرب كوب ماء دفعة واحدة', level: 1, enabled: true },
  { id: 'p9', text: 'تحدث بلهجة فضائية غريبة لمدة دقيقة', level: 1, enabled: true },
  { id: 'p10', text: 'امشِ في الغرفة على أطراف أصابعك كاللص', level: 1, enabled: true },
  { id: 'p11', text: 'قف على قدم واحدة طوال الجولة القادمة', level: 1, enabled: true },
  { id: 'p12', text: 'قم بأداء تحية عسكرية مبالغ فيها لكل الحاضرين', level: 1, enabled: true },
  { id: 'p13', text: 'تظاهر بأنك روبوت نفدت بطاريته ببطء', level: 1, enabled: true },
  { id: 'p14', text: 'ابتسم ابتسامة عريضة دون توقف لمدة دقيقة', level: 1, enabled: true },
  { id: 'p15', text: 'اصنع قبعة من الورق وضعها على رأسك', level: 1, enabled: true },

  // Level 2: Hilarious & Engaging
  { id: 'p3', text: 'قل أحرج سر عندك', level: 2, enabled: true },
  { id: 'p4', text: 'قلّد شخصية مشهورة لدقيقة', level: 2, enabled: true },
  { id: 'p8', text: 'حكّي نكتة وإلا تعاقب مرتين', level: 2, enabled: true },
  { id: 'p16', text: 'قم بأداء رقصة درامية حزينة لمدة دقيقة', level: 2, enabled: true },
  { id: 'p17', text: 'اشرح لماذا الدجاجة عبرت الشارع بأسلوب فيلسوف', level: 2, enabled: true },
  { id: 'p18', text: 'حاول إقناع الفريق المنافس بشراء قلمك الفارغ', level: 2, enabled: true },
  { id: 'p19', text: 'تظاهر بأنك معلق رياضي يصف مباراة شطرنج حماسية', level: 2, enabled: true },
  { id: 'p20', text: 'تحدث باللغة العربية الفصحى فقط للجولتين القادمتين', level: 2, enabled: true },
  { id: 'p21', text: 'قم بتمثيل مشهد درامي صامت يعبر عن الجوع الشديد', level: 2, enabled: true },
  { id: 'p22', text: 'قلّد صوت ثلاثة حيوانات مختلفة ببراعة', level: 2, enabled: true },

  // Level 3: Challenging & Unforgettable
  { id: 'p6', text: 'ابق صامتاً لدورتين كاملتين', level: 3, enabled: true },
  { id: 'p7', text: 'اعترف بأحرج موقف في حياتك', level: 3, enabled: true },
  { id: 'p23', text: 'امنع استخدام حرف الألف في كلامك للجولة القادمة', level: 3, enabled: true },
  { id: 'p24', text: 'تظاهر بأنك مذيع نشرة جوية يواجه إعصاراً مدمراً', level: 3, enabled: true },
  { id: 'p25', text: 'غنِّ أغنية أطفال مشهورة بأسلوب الأوبرا الدرامية', level: 3, enabled: true },
  { id: 'p26', text: 'دع أحد أعضاء الفريق المنافس يختار لك تسريحة شعر مضحكة', level: 3, enabled: true },
  { id: 'p27', text: 'قم بأداء إعلان ترويجي حماسي لمنتج خيالي سخيف', level: 3, enabled: true },
  { id: 'p28', text: 'تحدث بأسلوب الشرير في أفلام الكرتون حتى نهاية اللعبة', level: 3, enabled: true },
  { id: 'p29', text: 'اعتذر لوسادتك بحرارة وكأنك خنتها', level: 3, enabled: true },
]

// Level and Mode meta are now dynamically localized in the component

// ─────────────────────────────────────────────
// Audio Utilities
// ─────────────────────────────────────────────
let _audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!_audioCtx) _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return _audioCtx
}

function playClickSound() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(720, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.28, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.14)
  } catch { }
}

const mascotAudioCache: Record<number, HTMLAudioElement> = {}
if (typeof window !== 'undefined') {
  for (let i = 0; i < 4; i++) {
    const a = new Audio(`/sounds/mascot-${i + 1}.mp3`)
    a.volume = 0.65
    a.preload = 'auto'
    mascotAudioCache[i] = a
  }
}

function playMascotSound(teamIndex: number, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return
  try {
    const a = mascotAudioCache[teamIndex]
    if (a) {
      a.currentTime = 0
      a.play().catch(() => { })
    }
  } catch { }
}

// ─────────────────────────────────────────────
// Confetti
// ─────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(() =>
    Array.from({ length: 64 }, (_, i) => ({
      id: i,
      x: (i * 137.508) % 100,
      color: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#ffffff'][i % 6],
      sz: (i % 4) * 4 + 5,
      del: (i % 9) * 0.06,
      spin: i % 2 === 0 ? 400 : -400,
    })), []
  )
  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
          {pieces.map(p => (
            <motion.div key={p.id}
              initial={{ y: -16, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
              animate={{ y: '110vh', opacity: [1, 1, 0], rotate: p.spin }}
              transition={{ duration: 2.4 + p.del, delay: p.del, ease: 'easeIn' }}
              className="absolute top-0 rounded-sm"
              style={{ width: p.sz, height: p.sz * 0.55, background: p.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────
// ProgressRing
// ─────────────────────────────────────────────
function ProgressRing({ count, max, color }: { count: number; max: number; color: string }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const isMax = count === max
  const { lang } = useFeedbackStore()
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-500 shadow-xl ${isMax ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/50 shadow-emerald-500/20' : 'bg-white/[0.05] border-white/10 shadow-black/20'}`}>
      <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
          <motion.circle cx="26" cy="26" r={r} fill="none" strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ stroke: isMax ? '#10b981' : color, strokeDashoffset: circ - (count / max) * circ }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <AnimatePresence>
          {isMax && (
            <motion.div key="pulse"
              initial={{ opacity: 0.8, scale: 1 }} animate={{ opacity: 0, scale: 2.0 }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute inset-0 rounded-full border border-emerald-500 pointer-events-none"
            />
          )}
        </AnimatePresence>
        <div className="text-center leading-none z-10">
          <motion.span key={count} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-xs font-black block" style={{ color: isMax ? '#10b981' : 'white' }}>
            {count}
          </motion.span>
          <span className="text-[9px] text-white/40 font-bold">/{max}</span>
        </div>
      </div>

      <div className="flex flex-col text-start pr-1">
        <span className={`text-xs font-black uppercase tracking-wider transition-colors duration-300 whitespace-nowrap ${isMax ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] font-extrabold' : 'text-white/80'}`}>
          {isMax ? (lang === 'EN' ? 'Max Reached ✓' : 'وصلت للحد الأقصى ✓') : (lang === 'EN' ? 'Selected Categories' : 'الفئات المحددة')}
        </span>
        <span className="text-[10px] text-white/40 font-medium whitespace-nowrap">
          {isMax ? (lang === 'EN' ? 'Ready for Matchup! 🚀' : 'جاهز للمباراة! 🚀') : (lang === 'EN' ? `${max - count} remaining` : `متبقي ${max - count}`)}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Premium Category Card (Lightning Fast, No Flip)
// ─────────────────────────────────────────────
function CategoryCard3D({
  cat, topic, isSelected, isBlocked, onToggle, isDarkMode,
}: {
  cat: Category; topic: Topic
  isSelected: boolean; isBlocked: boolean
  onToggle: (id: string) => void
  isDarkMode: boolean
}) {
  const { lang } = useFeedbackStore();
  const isRtl = lang === 'AR';

  return (
    <div 
      onClick={() => {
        if (!isBlocked) {
          playSound('click');
          onToggle(cat.id);
        }
      }}
      className={`relative group cursor-pointer transition-all duration-200 select-none rounded-[2rem] ${isBlocked ? 'opacity-35 grayscale cursor-not-allowed' : ''}`}
      style={isSelected ? { borderColor: topic.color || '#10b981', boxShadow: `0 0 45px ${(topic.color || '#10b981')}90, inset 0 0 35px ${(topic.color || '#10b981')}60` } : undefined}
    >
      <WobbleCard containerClassName={`p-0 ${isDarkMode ? 'bg-[#0c091f]' : 'bg-white shadow-2xl'} rounded-[2rem] overflow-hidden transition-all duration-300 ${isSelected ? 'border-[4px]' : `border-2 ${isDarkMode ? 'border-white/10 hover:border-white/30' : 'border-slate-200 hover:border-slate-400'}`}`}>
        <div className="relative w-full h-80 md:h-96">
          {cat.image_url ? (
            <DirectionAwareHover imageUrl={cat.image_url} className="w-full h-full rounded-none">
              <h4 className="text-xl font-black text-white drop-shadow-md leading-tight text-center">{cat.name}</h4>
              {cat.description && (
                <p className="text-xs text-white/70 mt-1.5 line-clamp-2 leading-relaxed font-medium text-center">{cat.description}</p>
              )}
            </DirectionAwareHover>
          ) : (
            <div className={`w-full h-full flex flex-col justify-end items-center p-6 text-center relative overflow-hidden ${isDarkMode ? 'bg-black/40' : 'bg-slate-100'}`} style={{ background: `linear-gradient(180deg, ${isDarkMode ? 'transparent' : 'rgba(255,255,255,0.7)'}, ${topic.color || '#8B5CF6'}${isDarkMode ? '50' : '30'})` }}>
              <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-black/95 via-black/50' : 'from-white/95 via-white/50'} to-transparent`} />
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: topic.color || '#8B5CF6' }} />
              <h4 className={`text-xl font-black drop-shadow-md leading-tight relative z-10 text-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{cat.name}</h4>
              {cat.description && (
                <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed font-medium relative z-10 text-center ${isDarkMode ? 'text-white/70' : 'text-slate-700'}`}>{cat.description}</p>
              )}
            </div>
          )}

          {isSelected && (
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/15 pointer-events-none animate-pulse z-30" />
          )}

          {/* Fast Badge when Selected */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-50 w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xl shadow-2xl border border-white/20`}
                style={{ backgroundColor: topic.color || '#10b981', boxShadow: `0 0 25px ${(topic.color || '#10b981')}` }}
              >
                ✓
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </WobbleCard>
    </div>
  )
}

// ─────────────────────────────────────────────
// SpaceBackground / Cinematic Holographic Space (Option 1)
// ─────────────────────────────────────────────
function SpaceBackground({ teams = [], accentColor = '#8B5CF6' }: { teams?: Team[]; accentColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { themeMode } = useFeedbackStore()
  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : true))
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    const particles: Array<{ x: number; y: number; r: number; vx: number; vy: number; color: string; alpha: number; pulseSpeed: number; phase: number; layer: number }> = []
    const shootingStars: Array<{ x: number; y: number; len: number; vx: number; vy: number; alpha: number; active: boolean }> = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particles.length = 0
      const colors = [accentColor, '#9333EA', '#06B6D4', '#F43F5E', '#10B981', '#F59E0B', '#FFFFFF', '#D946EF']
      // 250 multi-layered particles
      for (let i = 0; i < 250; i++) {
        const layer = Math.random() < 0.5 ? 1 : Math.random() < 0.8 ? 2 : 3
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: (Math.random() * 2 + 0.5) * layer * 0.7,
          vx: (Math.random() - 0.5) * 0.15 * layer,
          vy: (Math.random() - 0.5) * 0.15 * layer,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.7 + 0.3,
          pulseSpeed: Math.random() * 0.04 + 0.01,
          phase: Math.random() * Math.PI * 2,
          layer
        })
      }
      shootingStars.length = 0
      for (let i = 0; i < 3; i++) {
        shootingStars.push({ x: 0, y: 0, len: 0, vx: 0, vy: 0, alpha: 0, active: false })
      }
    }

    window.addEventListener('resize', resize)
    resize()

    let angle = 0
    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      angle += 0.002

      // 1. Dual Glowing Nebula Blobs
      const cx = w * 0.5
      const cy = h * 0.5
      const grad1 = ctx.createRadialGradient(cx + Math.sin(angle) * 250, cy + Math.cos(angle) * 180, 0, cx, cy, Math.max(w, h) * 0.65)
      grad1.addColorStop(0, `${accentColor}28`)
      grad1.addColorStop(1, 'transparent')
      ctx.fillStyle = grad1
      ctx.fillRect(0, 0, w, h)

      const grad2 = ctx.createRadialGradient(cx - Math.cos(angle * 0.8) * 300, cy - Math.sin(angle * 0.8) * 220, 0, cx, cy, Math.max(w, h) * 0.7)
      grad2.addColorStop(0, '#9333EA20')
      grad2.addColorStop(1, 'transparent')
      ctx.fillStyle = grad2
      ctx.fillRect(0, 0, w, h)

      // 2. Holographic Orbital Rings
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle * 0.4)
      ctx.beginPath()
      ctx.ellipse(0, 0, Math.min(w, h) * 0.42, Math.min(w, h) * 0.22, Math.PI / 5, 0, Math.PI * 2)
      ctx.strokeStyle = `${accentColor}22`
      ctx.lineWidth = 2.5
      ctx.stroke()

      ctx.beginPath()
      ctx.ellipse(0, 0, Math.min(w, h) * 0.58, Math.min(w, h) * 0.19, -Math.PI / 3.5, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()

      // 3. Shooting Stars
      shootingStars.forEach(s => {
        if (!s.active && Math.random() < 0.008) {
          s.active = true
          s.x = Math.random() * w
          s.y = 0
          s.vx = Math.random() * 8 + 8
          s.vy = s.vx * 0.6
          s.len = Math.random() * 80 + 60
          s.alpha = 1
        }
        if (s.active) {
          s.x += s.vx
          s.y += s.vy
          s.alpha -= 0.015
          if (s.alpha <= 0 || s.x > w || s.y > h) {
            s.active = false
          } else {
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(s.x, s.y)
            ctx.lineTo(s.x - s.vx * (s.len / 10), s.y - s.vy * (s.len / 10))
            const sGrad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * (s.len / 10), s.y - s.vy * (s.len / 10))
            sGrad.addColorStop(0, `rgba(255,255,255,${s.alpha})`)
            sGrad.addColorStop(1, 'transparent')
            ctx.strokeStyle = sGrad
            ctx.lineWidth = 2.5
            ctx.stroke()
            ctx.restore()
          }
        }
      })

      // 4. Interactive Stardust particles
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      particles.forEach(p => {
        const dx = mx - p.x
        const dy = my - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0 && dist < 250) {
          p.x += (dx / dist) * 0.5 * p.layer
          p.y += (dy / dist) * 0.5 * p.layer
        } else {
          p.x += p.vx
          p.y += p.vy
        }

        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        p.phase += p.pulseSpeed
        const currentAlpha = p.alpha * (0.5 + 0.5 * Math.sin(p.phase))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(currentAlpha * 255).toString(16).padStart(2, '0')
        ctx.shadowBlur = p.layer === 3 ? 15 : 0
        ctx.shadowColor = p.color
        ctx.fill()
        ctx.shadowBlur = 0
      })

      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize) }
  }, [accentColor])

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-[#05030A]' : 'bg-slate-950'}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
    </div>
  )
}

// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// MatchupPreview
// ─────────────────────────────────────────────
function MatchupPreview({
  teams, voicesEnabled, onConfirm, onBack, isStarting,
}: {
  teams: Team[]; voicesEnabled: boolean
  onConfirm: () => void; onBack: () => void
  isStarting: boolean
}) {
  const t = useTranslator()
  const { lang } = useFeedbackStore()

  useEffect(() => {
    teams.forEach((_, i) => {
      playMascotSound(i, voicesEnabled)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const gridCols = teams.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : teams.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[500px] py-6 px-4 relative select-none overflow-hidden max-w-7xl mx-auto">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[70vw] h-[35vw] max-h-[400px] rounded-full bg-gradient-to-r from-purple-500/10 via-rose-500/10 to-amber-500/10 blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center mb-8 relative z-10">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          {lang === 'EN' ? 'THE ARENA IS SET' : 'الساحة جاهزة للتحدي'}
        </span>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]">
          {lang === 'EN' ? 'ULTIMATE SHOWDOWN' : 'المواجهة الكبرى'}
        </h2>
      </motion.div>

      {/* Arena Showdown Display */}
      <div className="relative w-full max-w-5xl mb-10 z-10 px-2">
        <div className={`grid ${gridCols} gap-5 md:gap-6 relative z-10 items-stretch`}>
          {teams.map((team, idx) => (
            <motion.div key={idx}
              initial={{ y: 30, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.12, type: 'spring', stiffness: 250, damping: 22 }}
              className="flex flex-col items-center justify-between p-5 md:p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.06] transition-all duration-300 relative group shadow-2xl backdrop-blur-xl">
              
              {/* Ambient team glow */}
              <div className="absolute inset-0 rounded-3xl opacity-15 group-hover:opacity-35 transition-opacity duration-500 blur-xl -z-10" style={{ background: team.color }} />

              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3 + idx * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative my-2">
                <Mascot state="hype" size={90} color={team.color} />
              </motion.div>

              <div className="flex flex-col items-center gap-2 w-full mt-3">
                <span className="font-black text-xl md:text-2xl text-white tracking-wide truncate max-w-full px-2" style={{ textShadow: `0 0 15px ${team.color}80` }}>
                  {team.name}
                </span>
                <div className="w-10 h-1 rounded-full my-0.5" style={{ background: team.color, boxShadow: `0 0 12px ${team.color}` }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  {lang === 'EN' ? 'READY ✓' : 'جاهز للمنافسة ✓'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Action Buttons */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-wrap items-center justify-center gap-4 w-full relative z-10 pt-2">
        <button onClick={onBack}
          className="px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all font-bold text-sm shadow-lg flex items-center gap-2 cursor-pointer">
          <span>{lang === 'EN' ? '← Edit Contenders' : '← تعديل الفرق'}</span>
        </button>

        <motion.button onClick={onConfirm} disabled={isStarting}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="btn-aurora btn-aurora-sunset px-12 py-4 rounded-2xl font-black text-white uppercase tracking-[0.2em] text-sm disabled:opacity-50 shadow-[0_0_35px_rgba(245,158,11,0.4)] flex items-center gap-3 cursor-pointer">
          {isStarting ? (
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
              <span>{lang === 'EN' ? 'LAUNCHING SAGA...' : 'جاري إطلاق المباراة...'}</span>
            </div>
          ) : (
            <span className="relative flex items-center gap-2">
              <span>{lang === 'EN' ? 'LAUNCH MATCHUP 🚀' : 'انطلاق التحدي المثير! 🚀'}</span>
            </span>
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────
// GeneratingScreen
// ─────────────────────────────────────────────
function GeneratingScreen({ teams = [], accentColor = '#8B5CF6' }: { teams?: Team[]; accentColor?: string }) {
  const t = useTranslator()
  const cards = ['🎯', '🧠', '⚡', '🏆', '💡', '🎮', '🔥', '✨']
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden">
      <SpaceBackground teams={teams} accentColor={accentColor} />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <div className="relative w-64 h-28">
          {cards.map((c, i) => (
            <motion.div key={i}
              initial={{ x: 0, y: 60, opacity: 0, rotate: 0, scale: 0.4 }}
              animate={{ x: (i - 3.5) * 54, y: -16, opacity: 1, rotate: (i - 3.5) * 13, scale: 1 }}
              transition={{ duration: 0.65, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                w-14 h-20 rounded-2xl bg-white/[0.06] border border-white/10
                flex items-center justify-center text-2xl shadow-2xl backdrop-blur-sm">
              {c}
            </motion.div>
          ))}
        </div>
        <div className="relative w-20 h-20 flex items-center justify-center">
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              animate={{ scale: [1, 2.6], opacity: [0.4, 0] }}
              transition={{ duration: 1.9, delay: i * 0.63, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: accentColor }} />
          ))}
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-2 border-t-transparent"
            style={{ borderColor: accentColor }} />
        </div>
        <div className="text-center">
          <motion.h2 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl font-black mb-2">{t('setup_preparing')}</motion.h2>
          <p className="text-white/30 text-sm">{t('setup_wait')}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// PunishmentConfig
// ─────────────────────────────────────────────
function PunishmentConfig({
  enabled, setEnabled, punishments, setPunishments, mode, setMode,
}: {
  enabled: boolean; setEnabled: (v: boolean) => void
  punishments: Punishment[]; setPunishments: React.Dispatch<React.SetStateAction<Punishment[]>>
  mode: PunishmentMode; setMode: (m: PunishmentMode) => void
}) {
  const t = useTranslator()
  const { lang } = useFeedbackStore()
  const [newText, setNewText] = useState('')
  const [newLevel, setNewLevel] = useState<1 | 2 | 3>(1)

  const addPunishment = () => {
    if (!newText.trim()) return
    setPunishments(p => [...p, { id: `c${Date.now()}`, text: newText.trim(), level: newLevel, enabled: true }])
    setNewText('')
  }

  const toggleItem = (id: string) =>
    setPunishments(p => p.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x))

  const removeItem = (id: string) =>
    setPunishments(p => p.filter(x => x.id !== id))

  if (!enabled) return null

  return (
    <div className="space-y-3 py-0.5">
      {/* Mode selector */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 text-start">{lang === 'EN' ? 'PUNISHMENT MECHANIC' : 'آلية اختيار العقوبة'}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            { key: 'wheel', icon: '🎡' },
            { key: 'voted', icon: '🗳' },
            { key: 'escalating', icon: '📈' },
            { key: 'mixed', icon: '🎲' },
          ] as const).map(({ key, icon }) => (
            <button key={key} onClick={() => setMode(key as any)}
              className={`flex items-center gap-3 p-2.5 rounded-2xl border text-start transition-all cursor-pointer ${mode === key ? 'bg-white/[0.08] border-purple-500/50 shadow-md scale-[1.01]' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'}`}>
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div>
                <p className="text-xs font-black text-white leading-tight mb-0.5">{t(`setup_mode_${key}` as any)}</p>
                <p className="text-[10px] text-white/50 leading-none">{t(`setup_mode_${key}_desc` as any)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* Punishment list */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 text-start">{lang === 'EN' ? 'ACTIVE PUNISHMENTS' : 'قائمة العقوبات الفعالة'}</p>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 pl-1 no-scrollbar">
          {punishments.map(p => {
            const lm = {
              1: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', name: lang === 'EN' ? 'Easy' : 'سهل' },
              2: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', name: lang === 'EN' ? 'Med' : 'متوسط' },
              3: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', name: lang === 'EN' ? 'Hard' : 'حماسي' },
            }[p.level as 1 | 2 | 3]
            return (
              <motion.div key={p.id} layout
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300 ${p.enabled ? 'bg-white/[0.04] border-white/15 shadow-sm' : 'bg-transparent border-white/5 opacity-40'}`}>
                <button onClick={() => toggleItem(p.id)} title={lang === 'EN' ? 'Toggle' : 'تفعيل / تعطيل'}
                  className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border transition-transform duration-300 hover:scale-110 cursor-pointer ${p.enabled ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold text-xs' : 'border-white/20 bg-white/5 text-transparent text-xs'}`}>
                  ✓
                </button>
                <span className="flex-1 text-xs font-semibold text-white truncate text-start">{lang === 'EN' ? translatePunishment(p.text) : p.text}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 border leading-none"
                  style={{ color: lm.color, background: lm.bg, borderColor: `${lm.color}40` }}>
                  {lm.name}
                </span>
                <button onClick={() => removeItem(p.id)} title={lang === 'EN' ? 'Delete' : 'حذف'}
                  className="w-6 h-6 rounded-full bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 hover:text-red-300 transition-all flex items-center justify-center text-xs font-black cursor-pointer shadow-sm">✕</button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Add custom */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1.5 items-stretch sm:items-center">
        <input value={newText} onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPunishment()}
          placeholder={lang === 'EN' ? 'Add custom punishment...' : 'أضف عقوبة مخصصة…'}
          className="flex-1 bg-white/[0.05] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/30 text-white shadow-inner text-start" />
        <div className="flex items-center justify-center gap-1.5 bg-white/[0.03] border border-white/10 p-1.5 rounded-xl flex-wrap sm:flex-nowrap">
          {([1, 2, 3] as const).map(l => {
            const lm = {
              1: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: lang === 'EN' ? 'Easy ⚡' : 'سهل ⚡' },
              2: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: lang === 'EN' ? 'Med 🔥' : 'متوسط 🔥' },
              3: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: lang === 'EN' ? 'Hard 💥' : 'حماسي 💥' },
            }[l]
            return (
              <button key={l} onClick={() => setNewLevel(l)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all border flex items-center gap-1 cursor-pointer flex-shrink-0 leading-none ${newLevel === l ? 'scale-105 shadow-md' : 'opacity-40 hover:opacity-80'}`}
                style={{
                  borderColor: newLevel === l ? lm.color : 'rgba(255,255,255,0.08)',
                  background: newLevel === l ? lm.bg : 'transparent',
                  color: newLevel === l ? lm.color : 'rgba(255,255,255,0.3)',
                  boxShadow: newLevel === l ? `0 0 12px ${lm.color}40` : 'none',
                }}>
                <span>{lm.label}</span>
              </button>
            )
          })}
        </div>
        <button onClick={addPunishment} title={lang === 'EN' ? 'Add' : 'إضافة'}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 font-black text-white hover:brightness-110 transition-all text-xs uppercase tracking-wider flex items-center justify-center shadow-md cursor-pointer flex-shrink-0">
          {lang === 'EN' ? '+ Add' : '+ إضافة'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TeamsModal  —  step 0: editor + punishments | step 1: matchup
// ─────────────────────────────────────────────
function TeamsModal({
  teams, setTeams, sessionName, setSessionName,
  punishments, setPunishments, punishEnabled, setPunishEnabled,
  punishMode, setPunishMode, voicesEnabled, setVoicesEnabled,
  onClose, onStart, isStarting, accentColor, maxTeams,
}: {
  teams: Team[]; setTeams: React.Dispatch<React.SetStateAction<Team[]>>
  sessionName: string; setSessionName: React.Dispatch<React.SetStateAction<string>>
  punishments: Punishment[]; setPunishments: React.Dispatch<React.SetStateAction<Punishment[]>>
  punishEnabled: boolean; setPunishEnabled: (v: boolean) => void
  punishMode: PunishmentMode; setPunishMode: (m: PunishmentMode) => void
  voicesEnabled: boolean; setVoicesEnabled: (v: boolean) => void
  onClose: () => void; onStart: () => void
  isStarting: boolean; accentColor: string; maxTeams: number
}) {
  const t = useTranslator()
  const { lang } = useFeedbackStore()
  const router = useRouter()
  const [step, setStep] = useState<'setup' | 'punishments' | 'matchup'>('setup')

  const updateName = (i: number, name: string) => setTeams(p => p.map((t, j) => j === i ? { ...t, name } : t))
  const updateColor = (i: number, color: string) => setTeams(p => p.map((t, j) => j === i ? { ...t, color } : t))
  const removeTeam = (i: number) => setTeams(p => p.filter((_, j) => j !== i))

  const FUNNY_NAMES_AR = [
    "صائدو الجوائز", "عقول خطرة", "فرقة الإعدام", "سادة الفوضى", "النيزك القادم", "أسطورة الشاشة", "خوارزميات النصر", "ملوك الدراما", "نادي المكتئبين", "كتيبة الذكاء",
    "أساطير العصر", "فرقة المهمات المستحيلة", "أصحاب الكاريزما", "دكاترة التفكير", "عقول لا تنام", "ملوك الريمونتادا", "الضربة القاضية", "محترفو التخمين", "أشباح الليل", "عباقرة بالصدفة",
    "فلاسفة الكنبة", "فريق الأحلام", "وحوش التحدي", "قراصنة المعلومات", "أبطال الديجيتال", "المتألقون دائماً", "صناع التاريخ", "أباطرة الحكمة", "رواد المستقبل", "شعلة النشاط",
    "الرقم الصعب", "لا نستسلم أبداً", "أسياد اللعبة", "صيادو النقاط", "طاقة إيجابية", "السادة النبلاء", "عاصفة الأفكار", "فرسان الطاولة", "الخطة الجهنمية", "مخترقو الأنظمة",
    "ملوك الاستراتيجية", "الذكاء الخارق", "أصحاب المزاج", "فيلق النصر", "المرشحون للقب", "أصدقاء العمر", "المغامرون", "صوت العقل", "المحاربون القدامى", "كوكب المبدعين", "الجيل الذهبي"
  ]
  const FUNNY_NAMES_EN = [
    "Bounty Hunters", "Dangerous Minds", "Chaos Lords", "Incoming Meteor", "Screen Legends", "Victory Algorithms", "Drama Kings", "Depressed Club", "The Smart Squad", "Trivia Assassins",
    "Legends of the Era", "Mission Impossible", "Charisma Club", "Doctors of Thought", "Sleepless Minds", "Comeback Kings", "Knockout Punch", "Guesswork Masters", "Night Ghosts", "Accidental Geniuses",
    "Couch Philosophers", "The Dream Team", "Challenge Monsters", "Data Pirates", "Digital Heroes", "Always Shining", "History Makers", "Emperors of Wisdom", "Pioneers of Future", "Flame of Energy",
    "The Hard Equation", "Never Surrender", "Masters of the Game", "Point Hunters", "Positive Energy", "The Noble Gentlemen", "Brainstormers", "Knights of the Table", "Master Plan", "System Hackers",
    "Strategy Kings", "Super Intelligence", "Mood Swings", "Legion of Victory", "Title Favorites", "Lifelong Friends", "The Adventurers", "Voice of Reason", "Veteran Warriors", "Planet of Creators", "Golden Generation"
  ]
  const SESSION_NAMES_AR = ["تحدي الأساطير الكبير", "سهرة العباقرة", "معركة الذكاء الخارق", "كأس المعرفة الذهبي", "ليلة التحدي والحماس", "صراع الجبابرة", "المواجهة الكبرى", "جلسة الأصدقاء الأسطورية"]
  const SESSION_NAMES_EN = ["Clash of Geniuses", "The Ultimate Showdown", "Brainiacs Battle", "The Golden Trivia Cup", "Midnight Mind Clash", "Titan Showdown", "The Grand Matchup", "Legendary Friends Session"]

  const randomizeName = (i: number) => {
    const list = lang === 'EN' ? FUNNY_NAMES_EN : FUNNY_NAMES_AR
    const random = list[Math.floor(Math.random() * list.length)]
    updateName(i, random)
  }

  const addTeam = () => {
    if (teams.length >= 4) return
    const used = new Set(teams.map(t => t.color))
    const next = TEAM_COLORS.find(c => !used.has(c)) ?? TEAM_COLORS[0]
    const newNum = teams.length + 1
    const defaultName = lang === 'AR' ? (newNum === 3 ? 'الفريق الثالث' : newNum === 4 ? 'الفريق الرابع' : `الفريق ${newNum}`) : `Team ${newNum}`
    setTeams(p => [...p, { name: defaultName, color: next }])
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden p-4 md:p-6">
      <SpaceBackground teams={teams} accentColor={accentColor} />

      {/* Top controls */}
      <div className="absolute top-5 inset-x-6 z-20 flex items-center justify-end">
        <button onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center
            justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer">✕</button>
      </div>

      <motion.div initial={{ y: 50, scale: 0.94, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 50, scale: 0.94, opacity: 0 }} transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col my-auto">
        <div className="bg-white/[0.05] backdrop-blur-3xl border border-white/[0.12] rounded-[32px] p-6 w-full shadow-[0_16px_64px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] relative flex flex-col max-h-[92vh] overflow-hidden">
          {/* Subtle Aurora highlight glow on top border inside */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="overflow-y-auto flex-1 no-scrollbar pr-1 pl-1">
            <AnimatePresence mode="wait">
              {step === 'setup' ? (
                <motion.div key="editor" initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 28 }} transition={{ duration: 0.22 }} className="space-y-3">

                  {/* Session name */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md mb-3 group">
                    <div className="flex items-center gap-3 w-full sm:flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                        🏆
                      </div>
                      <div className="text-start flex-1">
                        <span className="text-[10px] font-black tracking-widest uppercase text-white/40 block mb-0.5">{lang === 'AR' ? 'اسم الجلسة' : 'Session Title'}</span>
                        <input type="text" value={sessionName} onChange={e => setSessionName(e.target.value)}
                          className="bg-transparent text-lg sm:text-xl font-black text-white outline-none w-full border-b border-transparent focus:border-amber-500/50 pb-0.5 transition-all placeholder-white/20"
                          placeholder={t('setup_session_ph')} />
                      </div>
                    </div>
                    <button onClick={() => {
                      const list = lang === 'EN' ? SESSION_NAMES_EN : SESSION_NAMES_AR;
                      setSessionName(list[Math.floor(Math.random() * list.length)]);
                    }} title={lang === 'AR' ? 'اسم عشوائي' : 'Random Title'}
                      className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 hover:border-white/25 flex items-center justify-center text-xl text-white/80 hover:text-white transition-all duration-300 shadow-sm flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 group/btn">
                      <span className="group-hover/btn:rotate-180 transition-transform duration-500 block">🎲</span>
                    </button>
                  </div>

                  {/* Teams */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {teams.map((team, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.07 }}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3.5 relative group hover:border-white/15 transition-all duration-300 shadow-lg flex flex-col"
                        style={{ borderTopColor: team.color, borderTopWidth: 4 }}>
                        {teams.length > 2 && (
                          <button onClick={() => removeTeam(idx)} title={lang === 'AR' ? 'حذف الفريق' : 'Remove Team'}
                            className="absolute top-2 start-2 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-100
                              text-xs opacity-85 hover:opacity-100 hover:scale-110 hover:bg-red-500/40 transition-all duration-300 flex items-center justify-center shadow-md z-20 cursor-pointer font-bold">✕</button>
                        )}
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 1.6 + idx * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                          className="flex justify-center mb-1.5 cursor-pointer"
                          onClick={() => playMascotSound(idx, voicesEnabled)}>
                          <Mascot state="idle" size={36} color={team.color} />
                        </motion.div>
                        <div className="relative mb-3 mt-auto">
                          <input value={team.name} onChange={e => updateName(idx, e.target.value)}
                            className="w-full bg-transparent text-center font-bold text-sm outline-none
                              border-b border-white/10 pb-1 text-white focus:border-white/40 transition-colors pe-6" />
                          <button onClick={() => randomizeName(idx)} title="Randomize"
                            className="absolute end-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-transform hover:scale-110 text-xs cursor-pointer p-1">
                            🎲
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 justify-items-center mt-1 pt-2.5 border-t border-white/[0.08]">
                          {TEAM_COLORS.map(c => (
                            <button key={c} onClick={() => updateColor(idx, c)} title={c}
                              className="w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-125 cursor-pointer shadow-md flex-shrink-0"
                              style={{
                                background: c, opacity: team.color === c ? 1 : 0.65,
                                transform: team.color === c ? 'scale(1.25)' : undefined,
                                boxShadow: team.color === c ? `0 0 16px ${c}` : 'none',
                                border: team.color === c ? '2px solid white' : '1px solid rgba(255,255,255,0.25)'
                              }}>
                              {team.color === c && <span className="text-[9px] text-white font-black drop-shadow">✓</span>}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                    {teams.length < 4 && (
                      <motion.button onClick={addTeam}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' }} whileTap={{ scale: 0.98 }}
                        className="rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2.5 text-white/40 hover:text-white transition-all duration-300 min-h-[170px] cursor-pointer group shadow-inner bg-white/[0.01]">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] group-hover:bg-amber-500/20 border border-white/10 group-hover:border-amber-500/40 flex items-center justify-center text-xl group-hover:scale-110 transition-all duration-300 shadow-md">
                          +
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest group-hover:tracking-[0.2em] transition-all duration-300">
                          {t('setup_add_team')}
                        </span>
                      </motion.button>
                    )}
                  </div>

                  {/* Punishment summary card */}
                  <div onClick={() => setStep('punishments')}
                    className="bg-white/[0.03] border border-white/[0.12] hover:border-white/25 rounded-2xl p-4 shadow-md hover:bg-white/[0.05] transition-all duration-300 cursor-pointer group flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                        ⚡
                      </div>
                      <div className="text-start">
                        <div className="flex items-center gap-2.5 mb-0.5">
                          <h3 className="text-sm font-black text-white">{t('setup_punishments')}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${punishEnabled ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 animate-pulse' : 'bg-white/5 border-white/10 text-white/40'}`}>
                            {punishEnabled ? `${punishments.filter(p => p.enabled).length} ${lang === 'AR' ? 'فعالة' : 'Active'}` : (lang === 'AR' ? 'معطلة' : 'Disabled')}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 leading-tight">
                          {lang === 'AR' ? 'انقر لتخصيص العقوبات وقواعد التحدي وآلية الاختيار' : 'Click to configure custom punishments and penalty rules'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] group-hover:bg-purple-500/20 border border-white/10 group-hover:border-purple-500/40 text-xs font-black text-white/80 group-hover:text-white transition-all shadow-sm flex-shrink-0">
                      <span className="text-sm">⚙️</span>
                      <span className="font-black uppercase tracking-wide">{lang === 'AR' ? 'تكوين' : 'Configure'}</span>
                      <span className="text-xs font-bold ml-1">{lang === 'AR' ? '←' : '→'}</span>
                    </div>
                  </div>

                  {/* Punishment Preview Ticker */}
                  <AnimatePresence>
                    {punishEnabled && punishments.filter(p => p.enabled).length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden rounded-xl bg-white/[0.03] border border-white/10 py-2.5 relative shadow-inner">
                        {/* Gradient Masks for fade effect */}
                        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#07071A] to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#07071A] to-transparent z-10 pointer-events-none" />
                        <div className="overflow-hidden whitespace-nowrap py-1 flex w-full select-none">
                          <motion.div
                            animate={{ x: lang === 'AR' ? ['0%', '50%'] : ['0%', '-50%'] }}
                            transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
                            className="flex whitespace-nowrap items-center w-max"
                          >
                            {[...punishments.filter(p => p.enabled), ...punishments.filter(p => p.enabled), ...punishments.filter(p => p.enabled), ...punishments.filter(p => p.enabled)].map((p, i) => (
                              <span key={i} className="mx-6 text-xs font-bold text-white/80 inline-flex items-center gap-2 tracking-wide shrink-0">
                                <span className="text-sm text-purple-400 animate-pulse">⚡</span> {lang === 'EN' ? translatePunishment(p.text) : p.text}
                              </span>
                            ))}
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Voice & Next Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10 mt-4">
                    <button onClick={() => setVoicesEnabled(!voicesEnabled)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 shadow-md text-start group ${voicesEnabled ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/40 shadow-emerald-500/10 hover:border-emerald-500/60' : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-md transition-transform duration-300 group-hover:scale-110 ${voicesEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white/40'}`}>
                        {voicesEnabled ? '🔊' : '🔇'}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white uppercase tracking-wider">{voicesEnabled ? (lang === 'AR' ? 'المعلق الصوتي مفعل' : 'Mascot Voice Enabled') : (lang === 'AR' ? 'المعلق الصوتي معطل' : 'Mascot Voice Disabled')}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${voicesEnabled ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-red-500'}`} />
                        </div>
                        <span className="text-[10px] text-white/50 leading-tight mt-0.5">{lang === 'AR' ? 'يتحكم في تعليقات الشخصية أثناء اللعب' : 'Toggles mascot commentary'}</span>
                      </div>
                    </button>

                    <motion.button onClick={() => setStep('matchup')}
                      whileHover={{ scale: 1.03, filter: 'brightness(1.15)' }} whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl font-black text-white tracking-[0.15em] text-sm shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] transition-all duration-500 border border-purple-400/40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 cursor-pointer">
                      {lang === 'EN' ? (
                        <>
                          <span className="uppercase font-black">Matchup Preview ⚔️</span>
                          <span className="text-lg">→</span>
                        </>
                      ) : (
                        <>
                          <span className="font-black">معاينة المباراة ⚔️</span>
                          <span className="text-lg">←</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ) : step === 'punishments' ? (
                <motion.div key="punishments" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }} className="space-y-3 py-0.5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setStep('setup')} title={lang === 'AR' ? 'عودة' : 'Back'}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 flex items-center justify-center text-lg text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md flex-shrink-0 font-bold">
                        {lang === 'AR' ? '→' : '←'}
                      </button>
                      <div className="text-start">
                        <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2 text-start">
                          <span>⚡</span>
                          <span>{t('setup_punishments')}</span>
                        </h2>
                        <p className="text-[11px] text-white/50 mt-0.5 text-start">{lang === 'AR' ? 'تخصيص العقوبات وقواعد التحدي وآلية الاختيار' : 'Customize challenge rules, mode, and penalties'}</p>
                      </div>
                    </div>
                    <div onClick={() => setPunishEnabled(!punishEnabled)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all duration-300 shadow-md cursor-pointer ${punishEnabled ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-emerald-500/10 hover:border-emerald-500/70' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${punishEnabled ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-white/20'}`} />
                      <span>{punishEnabled ? (lang === 'AR' ? 'العقوبات مفعلة' : 'Enabled') : (lang === 'AR' ? 'العقوبات معطلة' : 'Disabled')}</span>
                    </div>
                  </div>

                  <PunishmentConfig
                    enabled={punishEnabled} setEnabled={setPunishEnabled}
                    punishments={punishments} setPunishments={setPunishments}
                    mode={punishMode} setMode={setPunishMode}
                  />

                  <div className="flex justify-end pt-3 border-t border-white/10 mt-3">
                    <button onClick={() => setStep('setup')}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:brightness-110 font-black text-white tracking-wide text-xs md:text-sm shadow-md transition-all duration-300 cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 border border-purple-400/40">
                      <span className="text-base font-black">✓</span>
                      <span className="uppercase">{lang === 'AR' ? 'حفظ التعديلات والعودة' : 'Save & Return'}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="matchup" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.22 }}>
                  <MatchupPreview
                    teams={teams} voicesEnabled={voicesEnabled}
                    onConfirm={onStart} onBack={() => setStep('setup')}
                    isStarting={isStarting}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Topic & Category Translations & Enhancements
// ─────────────────────────────────────────────
function translatePunishment(text: string): string {
  if (!text) return '';
  const m: Record<string, string> = {
    'اعمل 10 ضغطات': 'Do 10 pushups',
    'غني مقطع من أغنية': 'Sing a verse of a song',
    'قل أحرج سر عندك': 'Reveal your most embarrassing secret',
    'قلّد شخصية مشهورة لدقيقة': 'Imitate a celebrity for 1 minute',
    'اشرب كوب ماء دفعة واحدة': 'Drink a glass of water in one go',
    'ابق صامتاً لدورتين كاملتين': 'Stay completely silent for 2 rounds',
    'اعترف بأحرج موقف في حياتك': 'Confess your most awkward life moment',
    'حكّي نكتة وإلا تعاقب مرتين': 'Tell a joke or take double punishment',
    'تحدث بلهجة فضائية غريبة لمدة دقيقة': 'Speak in a strange alien accent for 1 minute',
    'امشِ في الغرفة على أطراف أصابعك كاللص': 'Walk around the room on tiptoes like a burglar',
    'قف على قدم واحدة طوال الجولة القادمة': 'Stand on one foot for the entire next round',
    'قم بأداء تحية عسكرية مبالغ فيها لكل الحاضرين': 'Give an exaggerated salute to everyone in the room',
    'تظاهر بأنك روبوت نفدت بطاريته ببطء': 'Pretend to be a robot slowly running out of battery',
    'ابتسم ابتسامة عريضة دون توقف لمدة دقيقة': 'Maintain a wide grin without stopping for 1 minute',
    'اصنع قبعة من الورق وضعها على رأسك': 'Make a paper hat and wear it on your head',
    'قم بأداء رقصة درامية حزينة لمدة دقيقة': 'Perform a dramatic sad dance for 1 minute',
    'اشرح لماذا الدجاجة عبرت الشارع بأسلوب فيلسوف': 'Explain why the chicken crossed the road like a philosopher',
    'حاول إقناع الفريق المنافس بشراء قلمك الفارغ': 'Try convincing the opposing team to buy your empty pen',
    'تظاهر بأنك معلق رياضي يصف مباراة شطرنج حماسية': 'Pretend to be a sports commentator describing an intense chess match',
    'تحدث باللغة العربية الفصحى فقط للجولتين القادمتين': 'Speak strictly in classical Arabic for the next 2 rounds',
    'قم بتمثيل مشهد درامي صامت يعبر عن الجوع الشديد': 'Mime a dramatic silent scene expressing extreme hunger',
    'قلّد صوت ثلاثة حيوانات مختلفة ببراعة': 'Flawlessly imitate the sounds of three different animals',
    'امنع استخدام حرف الألف في كلامك للجولة القادمة': 'Do not use the letter A in your speech for the next round',
    'تظاهر بأنك مذيع نشرة جوية يواجه إعصاراً مدمراً': 'Pretend to be a weather anchor facing a catastrophic hurricane',
    'غنِّ أغنية أطفال مشهورة بأسلوب الأوبرا الدرامية': 'Sing a famous nursery rhyme in a dramatic opera style',
    'دع أحد أعضاء الفريق المنافس يختار لك تسريحة شعر مضحكة': 'Let an opposing team member style your hair into something funny',
    'قم بأداء إعلان ترويجي حماسي لمنتج خيالي سخيف': 'Perform an enthusiastic commercial for a silly fictional product',
    'تحدث بأسلوب الشرير في أفلام الكرتون حتى نهاية اللعبة': 'Speak like a cartoon villain until the end of the game',
    'اعتذر لوسادتك بحرارة وكأنك خنتها': 'Apologise passionately to your pillow as if you betrayed it',
  };
  return m[text.trim()] ?? text;
}

function translateCategoryText(text: string = '', isDesc = false): string {
  if (!text) return '';
  const t = text.trim();
  const map: Record<string, string> = {
    // Categories
    'كأس العالم': 'World Cup',
    'دوري أبطال أوروبا': 'UEFA Champions League',
    'الدوري الإسباني': 'La Liga',
    'الدوري الإنجليزي': 'Premier League',
    'أساطير كرة القدم': 'Football Legends',
    'قوانين وحكام': 'Rules & Referees',
    'الحرب العالمية الأولى': 'World War I',
    'الحرب العالمية الثانية': 'World War II',
    'الدولة العثمانية': 'Ottoman Empire',
    'الحضارة الفرعونية': 'Pharaonic Civilization',
    'الخلفاء الراشدون': 'The Rightly Guided Caliphs',
    'شخصيات تاريخية': 'Historical Figures',
    'أفلام الأوسكار': 'Oscar Winning Movies',
    'أفلام مارفل ودي سي': 'Marvel & DC Movies',
    'مسلسلات أيقونية': 'Iconic TV Series',
    'مخرجون وممثلون': 'Directors & Actors',
    'أفلام الرعب': 'Horror Movies',
    'الأنمي والكرتون': 'Anime & Animation',
    'الفضاء والمجرات': 'Space & Galaxies',
    'الفيزياء والكيمياء': 'Physics & Chemistry',
    'جسم الإنسان والطب': 'Human Body & Medicine',
    'التكنولوجيا والذكاء الاصطناعي': 'Tech & AI',
    'علماء ومكتشفون': 'Scientists & Inventors',
    'البيئة والحيوانات': 'Animals & Environment',
    'عواصم العالم': 'World Capitals',
    'أعلام ودول': 'Flags & Countries',
    'أنهار ومحيطات': 'Rivers & Oceans',
    'معالم سياحية': 'Famous Landmarks',
    'تضاريس ومناخ': 'Terrain & Climate',
    'قارات العالم': 'Continents',
    'ألغاز وفوازير': 'Riddles & Brainteasers',
    'معلومات غريبة': 'Odd Facts',
    'أرقام قياسية': 'World Records',
    'أمثال وحكم': 'Proverbs & Wisdom',
    'طعام ومطابخ': 'Food & Cuisines',
    'ألعاب فيديو': 'Video Games',
    'الشعر العربي القديم': 'Classical Arabic Poetry',
    'روايات عالمية': 'World Novels',
    'أدباء وفلاسفة': 'Writers & Philosophers',
    'الكتب المقدسة والتاريخية': 'Sacred & Historic Books',
    'الأساطير الإغريقية والرومانية': 'Greek & Roman Mythology',
    'الموسيقى الكلاسيكية': 'Classical Music',
    'أغاني الطرب الأصيل': 'Classic Tarab Songs',
    'رسامون ولوحات': 'Painters & Masterpieces',
    'الآلات الموسيقية': 'Musical Instruments',
    'المسرح والفنون الاستعراضية': 'Theater & Performing Arts',
  };

  if (!isDesc && map[t]) return map[t];

  // For descriptions or unmapped items
  let out = text;
  for (const [ar, en] of Object.entries(map)) {
    out = out.replace(new RegExp(ar, 'g'), en);
  }
  return out;
}

function getTopicEnhancements(topicName: string = '', lang: 'AR' | 'EN', index: number) {
  const n = topicName.toLowerCase();
  if (n.includes('كورة') || n.includes('كرة') || n.includes('قدم') || n.includes('رياضة') || n.includes('sport') || n.includes('football') || n.includes('soccer')) {
    return {
      color: '#59B292',
      enName: 'Football & Sports',
      tagline: lang === 'AR' ? 'روح التحدي والشغف! استرجع أمجاد البطولات، الأرقام القياسية، وأساطير الملاعب ⚽' : 'Relive legendary championship moments, unbeatable records, and sports icons ⚽'
    };
  }
  if (n.includes('تاريخ') || n.includes('history')) {
    return {
      color: '#7F2020',
      enName: 'History & Civilizations',
      tagline: lang === 'AR' ? 'سافر عبر الزمن لفك رموز الإمبراطوريات العظيمة والأحداث التي صاغت مسار البشرية ⏳' : 'Travel through time to decode ancient empires and monumental world events ⏳'
    };
  }
  if (n.includes('أفلام') || n.includes('سينما') || n.includes('مسلسل') || n.includes('movie') || n.includes('cinema') || n.includes('series')) {
    return {
      color: '#810B38',
      enName: 'Movies & Cinema',
      tagline: lang === 'AR' ? 'أضواء، كاميرا، إثارة! اختبر ذاكرتك السينمائية مع كلاسيكيات الشاشة الفضية 🎬' : 'Lights, camera, action! Test your memory with iconic masterpieces of the silver screen 🎬'
    };
  }
  if (n.includes('علوم') || n.includes('علم') || n.includes('فيزياء') || n.includes('فضاء') || n.includes('science') || n.includes('physics') || n.includes('space')) {
    return {
      color: '#0D0B61',
      enName: 'Science & Cosmos',
      tagline: lang === 'AR' ? 'استكشف أسرار الكون من أصغر الذرات إلى أبعد المجرات وأعقد النظريات 🔬' : 'Explore the mysteries of the universe from subatomic particles to vast galaxies 🔬'
    };
  }
  if (n.includes('عامة') || n.includes('ثقافة') || n.includes('معلومات') || n.includes('general') || n.includes('trivia') || n.includes('knowledge')) {
    return {
      color: '#FF653F',
      enName: 'General Knowledge',
      tagline: lang === 'AR' ? 'بحر واسع من الثقافة العامة والطرائف الغريبة التي تتحدى ذكاءك وسرعة بديهتك 💡' : 'A vast ocean of fascinating trivia facts challenging your wit and quick thinking 💡'
    };
  }
  if (n.includes('جغرافيا') || n.includes('بلدان') || n.includes('عواصم') || n.includes('geography') || n.includes('world') || n.includes('countries')) {
    return {
      color: '#7DAACB',
      enName: 'Geography & World',
      tagline: lang === 'AR' ? 'طُف حول العالم واكتشف تضاريس الأرض، عواصم الدول، وعجائب الطبيعة الساحرة 🌍' : 'Navigate the globe to discover majestic wonders, hidden capitals, and diverse cultures 🌍'
    };
  }
  if (n.includes('أدب') || n.includes('كتب') || n.includes('شعر') || n.includes('literature') || n.includes('book') || n.includes('poetry')) {
    return {
      color: '#D97706',
      enName: 'Literature & Books',
      tagline: lang === 'AR' ? 'بين سطور الروايات وأبيات الخلود، رحلة في عقول أعظم الكتاب والشعراء 📖' : 'Journey through the greatest literary masterworks and poetic verses across eras 📖'
    };
  }
  if (n.includes('فن') || n.includes('موسيقى') || n.includes('أغاني') || n.includes('art') || n.includes('music') || n.includes('songs')) {
    return {
      color: '#EC4899',
      enName: 'Arts & Music',
      tagline: lang === 'AR' ? 'ألحان خالدة ولوحات عبقرية تلامس الروح وتلهم الخيال الإبداعي 🎨' : 'Immerse yourself in timeless melodies and visionary artistic masterworks 🎨'
    };
  }
  if (n.includes('إسلام') || n.includes('دين') || n.includes('قرآن') || n.includes('islam') || n.includes('religion')) {
    return {
      color: '#059669',
      enName: 'Islamic & Religion',
      tagline: lang === 'AR' ? 'إضاءات روحية ومعرفية من السيرة النبوية والتاريخ الإسلامي العريق 🕌' : 'Spiritual and historical insights from early Islamic civilization and wisdom 🕌'
    };
  }
  if (n.includes('تقنية') || n.includes('تكنولوجيا') || n.includes('حاسوب') || n.includes('tech') || n.includes('computer')) {
    return {
      color: '#2563EB',
      enName: 'Tech & AI',
      tagline: lang === 'AR' ? 'من المعالجات الدقيقة إلى الخوارزميات الذكية، رحلة في عالم التكنولوجيا المستقبلية 💻' : 'From microprocessors to advanced AI algorithms in the digital frontier 💻'
    };
  }
  if (n.includes('أنمي') || n.includes('ألعاب') || n.includes('كرتون') || n.includes('anime') || n.includes('gaming')) {
    return {
      color: '#8B5CF6',
      enName: 'Anime & Gaming',
      tagline: lang === 'AR' ? 'عوالم خيالية ومغامرات ملحمية في أشهر أعمال الأنمي وألعاب الفيديو 🎮' : 'Legendary adventures across iconic anime masterworks and video game realms 🎮'
    };
  }
  if (n.includes('ألغاز') || n.includes('فوازير') || n.includes('أحاجي') || n.includes('riddle') || n.includes('puzzle')) {
    return {
      color: '#F59E0B',
      enName: 'Riddles & Puzzles',
      tagline: lang === 'AR' ? 'تحديات ذكية وأحاجي غامضة تختبر قدرتك على التحليل والتفكير المنطقي 🧩' : 'Clever brainteasers testing your analytical deduction and quick problem solving 🧩'
    };
  }
  if (n.includes('حيوان') || n.includes('طبيعة') || n.includes('بيئة') || n.includes('animal') || n.includes('nature')) {
    return {
      color: '#10B981',
      enName: 'Nature & Animals',
      tagline: lang === 'AR' ? 'أسرار المملكة الحيوانية وعجائب الأنظمة البيئية في كوكبنا الأخضر 🌿' : 'Wonders of the wild animal kingdom and breathtaking ecosystems 🌿'
    };
  }
  if (n.includes('طعام') || n.includes('مطبخ') || n.includes('أكلات') || n.includes('food') || n.includes('kitchen')) {
    return {
      color: '#EA580C',
      enName: 'Food & Cuisines',
      tagline: lang === 'AR' ? 'نكهات عالمية وثقافات الطهي عبر التاريخ وأشهر الأطباق التقليدية 🍲' : 'World culinary traditions, famous historic dishes, and exotic spices 🍲'
    };
  }
  if (n.includes('مشاهير') || n.includes('شخصيات') || n.includes('celebrity') || n.includes('people')) {
    return {
      color: '#E11D48',
      enName: 'Famous Figures',
      tagline: lang === 'AR' ? 'سير وحكايات الشخصيات المؤثرة التي تركت بصمتها في ذاكرة العالم 🌟' : 'Biographies and tales of influential icons who shaped world memory 🌟'
    };
  }
  if (n.includes('أساطير') || n.includes('خرافات') || n.includes('mythology') || n.includes('legend')) {
    return {
      color: '#6366F1',
      enName: 'Myths & Legends',
      tagline: lang === 'AR' ? 'حكايات أسطورية وملاحم خيالية من الحضارات القديمة والثقافات الشعبية 🐉' : 'Epic mythological tales and folklore epics from ancient global civilizations 🐉'
    };
  }
  // Curated 20 distinct unique fallback colors
  const colors = [
    '#59B292', '#7F2020', '#810B38', '#0D0B61', '#FF653F', 
    '#7DAACB', '#D97706', '#EC4899', '#059669', '#2563EB', 
    '#8B5CF6', '#F59E0B', '#10B981', '#EA580C', '#6366F1', 
    '#E11D48', '#0284C7', '#4F46E5', '#9333EA', '#C026D3'
  ];
  const fallbackColor = colors[index % colors.length];
  return {
    color: fallbackColor,
    enName: topicName,
    tagline: lang === 'AR' ? 'عالم مليء بالأسرار والتحديات الذكية التي تنتظر من يكتشفها ويحصد نقاطها! ✨' : 'An exciting realm of trivia secrets and brain challenges waiting to be conquered! ✨'
  };
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function GameSetupPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = useMemo(
    () => Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId,
    [params.sessionId]
  )
  const { lang, themeMode, mounted } = useFeedbackStore()
  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : true))
  const supabase = useMemo(() => createClient(), [])
  const t = useTranslator()
  const { selectCategories, generateQuestions } = useSession()

  // ── Core state ──
  const [sessionName, setSessionName] = useState(lang === 'AR' ? 'جلسة الأصدقاء' : 'Friends Session')
  const [topics, setTopics] = useState<Topic[]>([])
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [teams, setTeams] = useState<Team[]>([
    { name: lang === 'AR' ? 'الفريق الأول' : 'Team Alpha', color: '#8B5CF6' },
    { name: lang === 'AR' ? 'الفريق الثاني' : 'Team Beta', color: '#EC4899' },
  ])
  const [punishments, setPunishments] = useState<Punishment[]>(DEFAULT_PUNISHMENTS)
  const [punishEnabled, setPunishEnabled] = useState(false)
  const [punishMode, setPunishMode] = useState<PunishmentMode>('mixed')
  const [voicesEnabled, setVoicesEnabled] = useState(true)

  // ── UI state ──
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showTeams, setShowTeams] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'admin' | 'alpha' | 'popular' | 'new'>('admin')
  const [customSetup, setCustomSetup] = useState<any>(null)
  const [direction, setDirection] = useState<1 | -1>(1) // 1=down, -1=up
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false)

  const prevCountRef = useRef(0)
  const draftRestoredRef = useRef(false)

  // ── Persist voices preference ──
  useEffect(() => {
    try { localStorage.setItem('gg-voices', String(voicesEnabled)) } catch { }
  }, [voicesEnabled])

  useEffect(() => {
    try {
      const v = localStorage.getItem('gg-voices')
      if (v !== null) setVoicesEnabled(v === 'true')
    } catch { }
  }, [])

  // ── Sync default names and punishments when lang changes ──
  useEffect(() => {
    setSessionName(prev => (prev === 'جلسة الأصدقاء' || prev === 'Friends Session') ? (lang === 'AR' ? 'جلسة الأصدقاء' : 'Friends Session') : prev);
    setTeams(prev => prev.map(t => {
      if (t.name === 'الفريق الأول' || t.name === 'Team Alpha') return { ...t, name: lang === 'AR' ? 'الفريق الأول' : 'Team Alpha' };
      if (t.name === 'الفريق الثاني' || t.name === 'Team Beta') return { ...t, name: lang === 'AR' ? 'الفريق الثاني' : 'Team Beta' };
      if (t.name === 'الفريق الثالث' || t.name === 'Team Gamma') return { ...t, name: lang === 'AR' ? 'الفريق الثالث' : 'Team Gamma' };
      if (t.name === 'الفريق الرابع' || t.name === 'Team Delta') return { ...t, name: lang === 'AR' ? 'الفريق الرابع' : 'Team Delta' };
      return t;
    }));
    setPunishments(prev => prev.map(p => {
      const isDef = DEFAULT_PUNISHMENTS.some(dp => dp.text === p.text || translatePunishment(dp.text) === p.text);
      if (isDef) {
        const matchingDef = DEFAULT_PUNISHMENTS.find(dp => dp.id === p.id);
        if (matchingDef) {
          return { ...p, text: lang === 'EN' ? translatePunishment(matchingDef.text) : matchingDef.text };
        }
      }
      return p;
    }));
  }, [lang]);

  // ── Load data ──
  useEffect(() => {
    if (!sessionId) return
    async function load() {
      try {
        // Studio Template Injection
        const templateId = searchParams.get('template')
        if (templateId) {
          const { getTransferData } = await import('@/lib/indexedDB')
          const customData = await getTransferData(`studio-transfer-${sessionId}`)

          if (customData) {
            setCustomSetup(customData)
            setSessionName((customData as any).name)
            // Inject correct category IDs to match gameEngine logic
            setSelectedCategories((customData as any).categories.map(() => crypto.randomUUID()))
            draftRestoredRef.current = true
            setShowTeams(true) // Skip to team setup
          }
        }

        const [tR, cR, sR] = await Promise.all([
          (supabase.from('topics') as any).select('*').order('order_index'),
          (supabase.from('categories') as any).select('*').not('topic_id', 'is', null),
          (supabase.from('sessions') as any).select('*').eq('id', sessionId).single(),
        ])
        if (tR.error) throw tR.error
        if (cR.error) throw cR.error
        const rawTopics: any[] = tR.data ?? []
        const rawCats: any[] = cR.data ?? []
        if (sR.data?.name) setSessionName(sR.data.name)
        const merged: Topic[] = rawTopics.map((t, idx) => {
          const enh = getTopicEnhancements(t.name, lang, idx);
          return {
            ...t,
            color: enh.color,
            tagline: enh.tagline,
            categories: rawCats.filter((c: any) => c.topic_id === t.id),
          };
        })
        setTopics(merged)
        setActiveTopic(merged[0] ?? null)
        // URL restore
        const urlCats = searchParams.get('cats')
        if (urlCats) {
          setSelectedCategories(urlCats.split(',').filter(Boolean).slice(0, MAX_CATS))
          draftRestoredRef.current = true
          return
        }
        // localStorage restore
        try {
          const raw = localStorage.getItem(`${DRAFT_KEY}-${sessionId}`)
          if (raw) {
            const d = JSON.parse(raw)
            setSelectedCategories(d.selectedCategories?.slice(0, MAX_CATS) ?? [])
            draftRestoredRef.current = true
          }
        } catch { }
      } catch (e: any) {
        toast.error(e?.message ?? 'Failed to load')
      } finally { setIsLoading(false) }
    }
    load()
  }, [sessionId, supabase, searchParams])

  // ── Filtered + sorted topics ──
  const filteredTopics = useMemo<Topic[]>(() => {
    const translatedTopics = topics.map((t, idx) => {
      const enh = getTopicEnhancements(t.name, lang, idx);
      return {
        ...t,
        color: enh.color,
        name: lang === 'EN' ? enh.enName : t.name,
        tagline: enh.tagline,
        categories: t.categories.map(c => ({
          ...c,
          name: lang === 'EN' ? translateCategoryText(c.name, false) : c.name,
          description: lang === 'EN' && c.description ? translateCategoryText(c.description, true) : c.description
        }))
      };
    });

    const q = searchQuery.toLowerCase()
    const r = q
      ? translatedTopics.filter(t => t.name.toLowerCase().includes(q) || t.categories.some(c => c.name.toLowerCase().includes(q)))
      : translatedTopics
    switch (sortBy) {
      case 'alpha': return [...r].sort((a, b) => a.name.localeCompare(b.name, lang === 'AR' ? 'ar' : 'en'))
      case 'new': return [...r].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      case 'popular': return [...r].sort((a, b) => b.categories.length - a.categories.length)
      default: return [...r].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    }
  }, [topics, searchQuery, sortBy, lang])

  useEffect(() => {
    if (!filteredTopics.length) return
    setActiveTopic(prev => filteredTopics.find(t => t.id === prev?.id) ?? filteredTopics[0])
  }, [filteredTopics])

  // ── Confetti on MAX_CATS ──
  useEffect(() => {
    if (selectedCategories.length === MAX_CATS && prevCountRef.current < MAX_CATS) {
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2600)
    }
    prevCountRef.current = selectedCategories.length
  }, [selectedCategories.length])

  // ── Draft save ──
  useEffect(() => {
    if (!draftRestoredRef.current && selectedCategories.length === 0) return
    try { localStorage.setItem(`${DRAFT_KEY}-${sessionId}`, JSON.stringify({ selectedCategories })) } catch { }
  }, [selectedCategories, sessionId])

  // ── Toggle category ──
  const toggleCategory = useCallback((catId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(catId)) return prev.filter(id => id !== catId)
      if (prev.length >= MAX_CATS) return prev
      return [...prev, catId]
    })
    playSound('click')
  }, [])



  // ── Share URL ──
  const copyShareUrl = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('cats', selectedCategories.join(','))
    navigator.clipboard.writeText(url.toString())
      .then(() => toast.success('تم نسخ الرابط 🔗'))
      .catch(() => toast.error('Failed to copy'))
  }, [selectedCategories])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const cur = filteredTopics.findIndex(t => t.id === activeTopic?.id)
        if (e.key === 'ArrowUp' && cur > 0) {
          setDirection(-1)
          setActiveTopic(filteredTopics[cur - 1])
        }
        if (e.key === 'ArrowDown' && cur < filteredTopics.length - 1) {
          setDirection(1)
          setActiveTopic(filteredTopics[cur + 1])
        }
      }
      if (e.key === '/') {
        e.preventDefault()
        document.getElementById('setup-search')?.focus()
      }
      const n = parseInt(e.key)
      if (n >= 1 && n <= 6 && activeTopic) {
        const cat = activeTopic.categories[n - 1]
        if (cat) toggleCategory(cat.id)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [activeTopic, filteredTopics, toggleCategory])

  // ── Start game ──
  const handleStartGame = async () => {
    if (!sessionId || (!customSetup && selectedCategories.length === 0)) {
      toast.error(t('setup_error_cat'))
      return
    }
    
    setIsStarting(true)
    setShowTeams(false)
    setIsGenerating(true)

    // Play intro synchronously
    try {
      playSound('fanfare')
    } catch (e) { }

    try {
      // 1. ATOMIC SETUP: Teams & Categories
      await gameEngine.launchSessionAtomic({
        sessionId,
        sessionName,
        teams,
        categoryIds: selectedCategories,
        punishMode: punishEnabled ? punishMode : null,
        punishments: punishEnabled ? punishments.filter(p => p.enabled) : [],
      })

      // 2. AI GENERATION & HISTORY FILTERING
      const t0 = performance.now()
      await gameEngine.generateQuestions(sessionId, customSetup)
      const t1 = performance.now()
      
      // TELEMETRY: Track AI performance
      try {
        const { track } = await import('@/lib/analytics')
        track('ai_generation_completed', {
          session_id: sessionId,
          latency_ms: Math.round(t1 - t0),
          category_count: selectedCategories.length,
          custom: customSetup
        })
      } catch (e) { console.warn('Telemetry failed', e) }

      // 3. START GAME (Notify real-time clients)
      await gameEngine.startGame(sessionId)

      // Minimal transition delay
      await new Promise(r => setTimeout(r, 200)) // Reduced from 800ms for snappier feel
      
      try { localStorage.removeItem(`${DRAFT_KEY}-${sessionId}`) } catch { }
      router.push(`/game/${sessionId}?fast=1`)
    } catch (e: any) {
      console.error('[Setup] Launch failed:', e)
      toast.error(e?.message ?? 'Failed to launch')
      setIsStarting(false)
      setIsGenerating(false)
    }
  }

  // ── Derived ──
  const selectedCount = selectedCategories.length
  const atMax = selectedCount >= MAX_CATS
  const activeColor = activeTopic?.color || '#8B5CF6'
  const activeIndex = activeTopic ? filteredTopics.findIndex(t => t.id === activeTopic.id) : -1
  const dir = lang === 'AR' ? 'rtl' : 'ltr'
  const allCategories = useMemo(() => topics.flatMap(t => t.categories), [topics])

  const getMascotMessage = () => {
    if (selectedCount === 0) return lang === 'AR' ? 'اختر بعض الفئات لنبدأ التحدي!' : 'Pick some categories to start the challenge!'
    if (selectedCount < 3) return lang === 'AR' ? 'بداية جيدة! هل لديك الجرأة لاختيار المزيد؟' : 'Good start! Dare to pick more?'
    if (atMax) return lang === 'AR' ? 'أنت مستعد تماماً! حان وقت المباراة!' : 'You are fully loaded! Time for the matchup!'
    return lang === 'AR' ? 'اختيارات ممتازة! واصل...' : 'Excellent choices! Keep going...'
  }

  if (!mounted || isLoading) return <GeneratingScreen teams={teams.length ? teams : [{ color: '#8B5CF6' } as any]} accentColor={activeColor} />

  return (
    <>
      <AnimatePresence>
        {showTeams && (
          <TeamsModal
            teams={teams} setTeams={setTeams}
            sessionName={sessionName} setSessionName={setSessionName}
            punishments={punishments} setPunishments={setPunishments}
            punishEnabled={punishEnabled} setPunishEnabled={setPunishEnabled}
            punishMode={punishMode} setPunishMode={setPunishMode}
            voicesEnabled={voicesEnabled} setVoicesEnabled={setVoicesEnabled}
            onClose={() => setShowTeams(false)}
            onStart={handleStartGame}
            isStarting={isStarting}
            accentColor={activeColor}
            maxTeams={4}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStarting && <GeneratingScreen teams={teams} accentColor={activeColor} />}
      </AnimatePresence>

      <div className={`h-[100dvh] w-screen flex flex-col overflow-hidden relative transition-colors duration-700 ${isDarkMode ? 'bg-[#05030a] text-white' : 'bg-slate-50 text-slate-900'}`}
        style={{ direction: dir, fontFamily: 'var(--font-tajawal),var(--font-cairo),sans-serif' }}>

        <Confetti active={showConfetti} />


        {/* Dynamic solid / radial background tailored exactly to activeTopic */}
        <motion.div
          animate={{ backgroundColor: activeColor }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        >
          {/* Ambient immersive tint overlay */}
          <div className={`absolute inset-0 transition-colors duration-700 ${isDarkMode ? 'bg-[#040209]/92' : 'bg-[#f8fafc]/90'}`} />
          
          {/* Ambient immersive radial glow matching activeColor */}
          <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] h-[90vh] rounded-full blur-[140px]"
            animate={{
              background: `radial-gradient(circle, ${activeColor}${isDarkMode ? '50' : '75'}, transparent 75%)`
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>

        {/* Sidebar hover preview */}


        {/* ── UNIFIED COMMAND DOCK TOP BAR (<header>) ── */}
        <motion.header animate={{ backgroundColor: isDarkMode ? `${activeColor}15` : `${activeColor}20`, borderColor: isDarkMode ? `${activeColor}30` : `${activeColor}40` }}
          transition={{ duration: 0.65 }}
          className={`relative z-50 px-6 py-3 flex items-center justify-between flex-shrink-0 backdrop-blur-2xl border-b shadow-2xl gap-6 ${isDarkMode ? 'bg-black/60 text-white' : 'bg-white/80 text-slate-900'}`}>

          {/* Left: Back button & Title */}
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => router.back()}
              className={`w-11 h-11 rounded-[1.2rem] ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-900'} border flex items-center justify-center transition-all text-lg shadow group font-bold`}>
              <span className="group-hover:scale-125 transition-transform">{dir === 'rtl' ? '→' : '←'}</span>
            </button>

            <div>
              <h1 className="text-lg font-black tracking-tight drop-shadow-md">{t('setup_title')}</h1>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
                {t('setup_subtitle')}
              </p>
            </div>
          </div>

          {/* Center: Search + Nav Hints + Share */}
          <div className="flex-1 max-w-3xl flex items-center gap-3">
            <div className="flex-1">
              <PremiumSearchBar
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('setup_search_ph')}
                lang={lang}
                accentColor={activeColor}
              />
            </div>

            <div className={`hidden xl:flex items-center gap-3 px-4 py-2.5 rounded-2xl ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-800 shadow'} border font-bold text-xs shadow-inner`}>
              <span className="flex items-center gap-1.5">
                <kbd className={`px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-200 border-slate-300 text-slate-900'} font-black text-[10px]`}>↑</kbd>
                <kbd className={`px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-200 border-slate-300 text-slate-900'} font-black text-[10px]`}>↓</kbd>
                <span className="ms-1">{lang === 'AR' ? 'التنقل' : 'Topics'}</span>
              </span>
              <span className={isDarkMode ? 'text-white/30' : 'text-slate-400'}>•</span>
              <span className="flex items-center gap-1.5">
                <kbd className={`px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-200 border-slate-300 text-slate-900'} font-black text-[10px]`}>1-9</kbd>
                <span className="ms-1">{lang === 'AR' ? 'اختيار الفئة' : 'Select'}</span>
              </span>

              <AnimatePresence>
                {selectedCount > 0 && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    onClick={copyShareUrl}
                    className={`flex items-center gap-1.5 ms-2 px-3 py-1 rounded-xl ${isDarkMode ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-900 font-extrabold'} border transition-all text-xs font-black shadow-md`}>
                    <span>🔗</span><span>{lang === 'AR' ? 'شارك' : 'Share'}</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Progress & Next Step Button (Without Category Count) */}
          <div className="flex items-center gap-4 shrink-0">
            <ProgressRing count={selectedCount} max={MAX_CATS} color={activeColor} />

            <motion.button onClick={() => { setShowTeams(true); toast.success(lang === 'AR' ? 'تجهيز الفرق...' : 'Preparing teams...') }}
              whileHover={selectedCount > 0 ? { scale: 1.04, filter: 'brightness(1.15)' } : {}}
              whileTap={selectedCount > 0 ? { scale: 0.96 } : {}}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl disabled:opacity-30 text-white transition-all duration-500 border border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              style={{
                background: `linear-gradient(135deg, ${activeTopic?.color ?? activeColor}, rgba(0,0,0,0.85))`,
                boxShadow: `0 0 35px ${(activeTopic?.color ?? activeColor)}80`
              }}>
              <span className="drop-shadow-lg text-sm">{t('setup_next_step')}</span>
              <span>{dir === 'rtl' ? '←' : '→'}</span>
            </motion.button>
          </div>
        </motion.header>

        {/* ── MAIN LAYOUT ── */}
        <div className="flex flex-1 overflow-hidden relative z-10">

          {/* ── Premium Smart Topic Sidebar ── */}
          <motion.aside animate={{ borderColor: isDarkMode ? `${activeColor}30` : `${activeColor}40`, backgroundColor: isDarkMode ? `${activeColor}10` : `${activeColor}08` }}
            transition={{ duration: 0.5 }}
            className={`w-80 flex-shrink-0 border-e backdrop-blur-2xl flex flex-col overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#060411]/90 text-white' : 'bg-white/95 text-slate-900 border-slate-200 shadow-xl'}`}>

            {/* Sort */}
            <div className="px-4 pt-4 pb-2">
              <div className={`flex gap-1.5 p-1.5 rounded-2xl ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'} border backdrop-blur-xl shadow-inner`}>
                {(['admin', 'alpha', 'popular', 'new'] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all shadow-sm"
                    style={{
                      background: sortBy === s ? activeColor : 'transparent',
                      color: sortBy === s ? (isDarkMode ? '#000000' : '#ffffff') : (isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'),
                      boxShadow: sortBy === s ? `0 0 20px ${activeColor}` : undefined
                    }}>
                    {t(`setup_sort_${s}` as any)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-3 space-y-2">
              {filteredTopics.map(topic => {
                const isActive = activeTopic?.id === topic.id
                const selCount = topic.categories.filter(c => selectedCategories.includes(c.id)).length
                return (
                  <button key={topic.id} id={`sidebar-topic-${topic.id}`}
                    onClick={() => setActiveTopic(topic)}
                    className={`relative w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 text-start group overflow-hidden ${isActive ? `shadow-2xl scale-105 z-10 font-bold border ${isDarkMode ? 'border-white/20' : 'border-slate-300 shadow-lg'}` : `border border-transparent ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}`}
                    style={{
                      backgroundColor: isActive ? `${topic.color ?? activeColor}${isDarkMode ? '35' : '25'}` : undefined,
                      backgroundImage: isActive ? `linear-gradient(${dir === 'rtl' ? '270deg' : '90deg'}, ${topic.color ?? activeColor}${isDarkMode ? '50' : '40'}, ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'})` : undefined,
                      borderLeft: dir !== 'rtl' && isActive ? `4px solid ${topic.color ?? activeColor}` : undefined,
                      borderRight: dir === 'rtl' && isActive ? `4px solid ${topic.color ?? activeColor}` : undefined,
                    }}>
                    <span className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-125 drop-shadow-md' : 'group-hover:scale-110'}`}>
                      {topic.icon ?? '📚'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black truncate transition-colors ${isActive ? (isDarkMode ? 'text-white' : 'text-slate-900 font-extrabold') : (isDarkMode ? 'text-white/60 group-hover:text-white/90' : 'text-slate-600 group-hover:text-slate-900')}`}>
                        {topic.name}
                      </p>
                    </div>
                    <AnimatePresence>
                      {selCount > 0 && (
                        <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-xl border border-white/30 drop-shadow"
                          style={{ background: topic.color ?? activeColor }}>
                          {selCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                )
              })}
            </div>
          </motion.aside>

          {/* ── Categories Panel ── */}
          <main className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activeTopic && (
                <motion.div key={activeTopic.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex flex-col will-change-transform">

                  {/* Premium Topic Header & Smart Navigation Strip */}
                  <div className={`relative z-20 px-10 backdrop-blur-2xl border-b shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${isHeaderMinimized ? 'py-4 gap-3' : 'py-8 gap-6'} ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`} style={{ background: `linear-gradient(135deg, ${activeTopic.color ?? activeColor}${isDarkMode ? '30' : '40'}, ${isDarkMode ? 'rgba(8, 6, 21, 0.95)' : 'rgba(255, 255, 255, 0.95)'} 70%)`, borderBottom: `2px solid ${activeTopic.color ?? activeColor}` }}>
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex flex-col">
                        <h2 className={`font-black tracking-tighter flex items-center gap-4 drop-shadow-xl transition-all duration-300 ${isHeaderMinimized ? 'text-2xl md:text-3xl mb-0' : 'text-4xl md:text-5xl mb-2'} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          <span>{activeTopic.icon ?? '📚'}</span><span>{activeTopic.name}</span>
                        </h2>

                        <div className={`overflow-hidden transition-all duration-300 ${isHeaderMinimized ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
                          <p className={`text-sm md:text-base font-semibold drop-shadow-md max-w-2xl leading-relaxed ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
                            {(activeTopic as any).tagline ?? getTopicEnhancements(activeTopic.name, lang, 0).tagline}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => {
                          const nextIdx = activeIndex > 0 ? activeIndex - 1 : filteredTopics.length - 1;
                          const target = filteredTopics[nextIdx];
                          setDirection(-1);
                          setActiveTopic(target);
                          setTimeout(() => {
                            document.getElementById(`sidebar-topic-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }, 50);
                        }}
                          className={`rounded-2xl ${isDarkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'} border flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 font-bold ${isHeaderMinimized ? 'w-10 h-10 text-base' : 'w-12 h-12 text-xl'}`}>
                          ↑
                        </button>
                        <button onClick={() => {
                          const nextIdx = activeIndex < filteredTopics.length - 1 ? activeIndex + 1 : 0;
                          const target = filteredTopics[nextIdx];
                          setDirection(1);
                          setActiveTopic(target);
                          setTimeout(() => {
                            document.getElementById(`sidebar-topic-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }, 50);
                        }}
                          className={`rounded-2xl ${isDarkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'} border flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 font-bold ${isHeaderMinimized ? 'w-10 h-10 text-base' : 'w-12 h-12 text-xl'}`}>
                          ↓
                        </button>
                      </div>
                    </div>

                    {/* Smart Chip Strip (Click to Navigate) */}
                    {selectedCategories.length > 0 && (
                      <div className={`flex items-center gap-2.5 flex-wrap border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'} transition-all duration-300 ${isHeaderMinimized ? 'pt-2' : 'pt-4'}`}>
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-500 me-2 flex items-center gap-1.5">
                          <span>✓</span>
                          <span>{lang === 'AR' ? 'المحدد:' : 'Selected:'}</span>
                        </span>
                        {selectedCategories.map(id => {
                          const cat = allCategories.find(c => c.id === id)
                          const owner = topics.find(t => t.id === cat?.topic_id)
                          return (
                            <motion.div key={id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                              onClick={() => {
                                if (owner) {
                                  setActiveTopic(owner);
                                  setTimeout(() => {
                                    const el = document.getElementById(`cat-${id}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }, 150);
                                }
                              }}
                              className={`group/chip cursor-pointer flex items-center gap-2 rounded-xl border font-black shadow-lg transition-all hover:scale-110 active:scale-95 z-30 ${isHeaderMinimized ? 'px-3 py-1 text-[11px]' : 'px-4 py-2 text-xs'}`}
                              style={{
                                borderColor: `${owner?.color ?? activeColor}80`,
                                background: `${owner?.color ?? activeColor}40`,
                                boxShadow: `0 4px 20px ${owner?.color ?? activeColor}50`
                              }}>
                              <span className="text-white drop-shadow-md">{cat?.name ?? id}</span>
                              <button onClick={(e) => { e.stopPropagation(); toggleCategory(id); }}
                                className="text-white/50 hover:text-white transition-colors leading-none ms-1.5 font-black text-sm">✕</button>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Categories with Snap Scrolling */}
                  <div onScroll={(e) => setIsHeaderMinimized((e.currentTarget as HTMLDivElement).scrollTop > 40)} className="flex-1 overflow-y-auto no-scrollbar px-10 pt-8 pb-16 snap-y snap-mandatory scroll-smooth">
                    {activeTopic.categories.length === 0 ? (
                      <div className={`flex items-center justify-center h-40 font-bold ${isDarkMode ? 'text-white/20' : 'text-slate-400'} text-sm`}>
                        {lang === 'AR' ? 'لا توجد فئات لهذا الموضوع' : 'No categories'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
                        {activeTopic.categories.map((cat, i) => (
                          <motion.div key={cat.id} id={`cat-${cat.id}`} className="snap-start scroll-mt-6" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}>
                            <CategoryCard3D
                              cat={cat} topic={activeTopic}
                              isSelected={selectedCategories.includes(cat.id)}
                              isBlocked={atMax && !selectedCategories.includes(cat.id)}
                              onToggle={toggleCategory}
                              isDarkMode={isDarkMode}
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar{display:none;}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
        *{-webkit-tap-highlight-color:transparent;}
      `}} />
      </div>
    </>
  )
}
