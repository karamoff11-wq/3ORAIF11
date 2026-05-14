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
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'
import { audioDirector } from '@/lib/audioDirector'

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
interface AsteroidBody {
  id: number; x: number; y: number; vx: number; vy: number
  r: number; color: string; ptSet: number; rotation: number
  rotSpeed: number; isFragment: boolean; flashTimer: number
  cooldown: number
}
interface Star { x: number; y: number; r: number; sp: number; ph: number }
interface Shot { x: number; y: number; vx: number; vy: number; len: number; op: number; life: number; maxLife: number; active: boolean; timer: number }

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const MAX_CATS = 6
const DRAFT_KEY = 'gg-draft'

const TEAM_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'] as const

// Asteroid vertices centered at (0,0), radius ≈ 45px
const AST_PTS = [
  [[-22, -37], [12, -39], [38, -21], [46, 9], [32, 33], [2, 39], [-30, 35], [-46, 14], [-44, -15]],
  [[-32, -31], [0, -38], [30, -29], [44, -3], [38, 24], [12, 39], [-22, 37], [-42, 17], [-45, -11]],
  [[-15, -39], [18, -37], [40, -13], [42, 15], [24, 37], [-6, 41], [-34, 27], [-45, -1], [-32, -22]],
  [[-28, -33], [8, -39], [34, -19], [45, 11], [30, 35], [-2, 41], [-32, 29], [-47, 3], [-20, -17]],
] as const

const DEFAULT_PUNISHMENTS: Punishment[] = [
  { id: 'p1', text: 'اعمل 10 ضغطات', level: 1, enabled: true },
  { id: 'p2', text: 'غني مقطع من أغنية', level: 1, enabled: true },
  { id: 'p3', text: 'قل أحرج سر عندك', level: 2, enabled: true },
  { id: 'p4', text: 'قلّد شخصية مشهورة لدقيقة', level: 2, enabled: true },
  { id: 'p5', text: 'اشرب كوب ماء دفعة واحدة', level: 1, enabled: true },
  { id: 'p6', text: 'ابق صامتاً لدورتين كاملتين', level: 3, enabled: true },
  { id: 'p7', text: 'اعترف بأحرج موقف في حياتك', level: 3, enabled: true },
  { id: 'p8', text: 'حكّي نكتة وإلا تعاقب مرتين', level: 2, enabled: true },
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
  const r = 22
  const circ = 2 * Math.PI * r
  const isMax = count === max
  const ringColor = isMax ? '#ef4444' : count >= max - 1 ? '#f59e0b' : color
  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
        <motion.circle cx="28" cy="28" r={r} fill="none" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ stroke: ringColor, strokeDashoffset: circ - (count / max) * circ }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <AnimatePresence>
        {isMax && (
          <motion.div key="pulse"
            initial={{ opacity: 0.6, scale: 1 }} animate={{ opacity: 0, scale: 2.2 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 rounded-full border-2 border-red-500 pointer-events-none"
          />
        )}
      </AnimatePresence>
      <div className="text-center leading-none z-10">
        <motion.span key={count} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-sm font-black block" style={{ color: isMax ? '#ef4444' : 'white' }}>
          {count}
        </motion.span>
        <span className="text-[8px] text-white/25 font-bold">/{max}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// CategoryCard3D — flip on select, clean ✓ back
// ─────────────────────────────────────────────
function CategoryCard3D({
  cat, topic, isSelected, isBlocked, onToggle,
}: {
  cat: Category; topic: Topic
  isSelected: boolean; isBlocked: boolean
  onToggle: (id: string) => void
}) {
  const crop = cat.crop_config?.cat_setup ?? { zoom: 1, x: 50, y: 50 }
  return (
    <div className="relative" style={{ aspectRatio: '4/5', perspective: 900 }}
      onClick={() => !isBlocked && onToggle(cat.id)}>
      <motion.div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isSelected ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>

        {/* Front */}
        <div className="absolute inset-0 rounded-[26px] overflow-hidden border-2 cursor-pointer transition-all duration-300"
          style={{
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            borderColor: isBlocked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)',
            opacity: isBlocked ? 0.25 : 1,
            filter: isBlocked ? 'grayscale(0.65)' : 'none',
          }}>
          {cat.image_url
            ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" loading="eager"
              style={{ transform: `scale(${crop.zoom ?? 1})`, objectPosition: `${crop.x ?? 50}% ${crop.y ?? 50}%` }} />
            : <div className="w-full h-full" style={{ background: `${topic.color ?? '#8B5CF6'}20` }} />
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-4">
            <h4 className="text-base font-black leading-tight">{cat.name}</h4>
            {cat.description && (
              <p className="text-[10px] text-white/35 mt-1 line-clamp-2 leading-relaxed">{cat.description}</p>
            )}
          </div>
          <div className="absolute top-3 end-3 w-6 h-6 rounded-full border-2 border-white/15 bg-black/20 backdrop-blur-sm" />
        </div>

        {/* Back — clean glow ✓ */}
        <div className="absolute inset-0 rounded-[26px] overflow-hidden border-2 flex flex-col items-center justify-center gap-3 cursor-pointer"
          style={{
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderColor: topic.color ?? '#8B5CF6',
            background: `${topic.color ?? '#8B5CF6'}14`,
            boxShadow: `0 0 45px ${topic.color ?? '#8B5CF6'}35, inset 0 0 60px ${topic.color ?? '#8B5CF6'}10`,
          }}>
          {/* Glow orb */}
          <div className="absolute inset-0 rounded-[24px] opacity-25"
            style={{ background: `radial-gradient(circle at 50% 45%, ${topic.color ?? '#8B5CF6'} 0%, transparent 65%)` }} />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.22, type: 'spring', stiffness: 320 }}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-2xl relative z-10"
            style={{
              background: topic.color ?? '#8B5CF6',
              boxShadow: `0 0 30px ${topic.color ?? '#8B5CF6'}80`,
            }}>
            ✓
          </motion.div>
          <p className="text-xs font-black text-white/70 relative z-10 px-4 text-center leading-tight">
            {cat.name}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SpaceCanvas — full physics, pure canvas
// No external particles lib needed
// ─────────────────────────────────────────────
function SpaceCanvas({ teams = [] }: { teams?: Team[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    const particles: any[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particles.length = 0
      for (let i = 0; i < 120; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 2 + 0.1,
          size: Math.random() * 2 + 0.5,
          color: teams.length ? teams[Math.floor(Math.random() * teams.length)]?.color : '#8B5CF6',
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          phase: Math.random() * Math.PI * 2
        })
      }
    }

    window.addEventListener('resize', resize)
    resize()

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      timeRef.current += 0.005

      ctx.fillStyle = '#050510'
      ctx.fillRect(0, 0, w, h)

      teams.forEach((t, i) => {
        if (!t?.color) return
        const cx = w * (0.2 + (i % 2) * 0.6) + Math.sin(timeRef.current + i) * 120
        const cy = h * (0.2 + (i < 2 ? 0 : 0.6)) + Math.cos(timeRef.current + i) * 120
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5)
        grad.addColorStop(0, `${t.color}18`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      })

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy - (p.z * 0.1)
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        const pulse = 0.5 + 0.5 * Math.sin(timeRef.current * 4 + p.phase)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (1 + pulse), 0, Math.PI * 2)
        ctx.fillStyle = p.color ? `${p.color}${Math.floor((0.3 + pulse * 0.7) * 255).toString(16).padStart(2, '0')}` : '#ffffff80'
        ctx.shadowBlur = 15
        ctx.shadowColor = p.color || '#fff'
        ctx.fill()
      })

      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams?.map(t => t.color).join(',') || ''])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

function spawnAsteroid(
  id: number, w: number, h: number, teams: Team[],
  nextIdRef: React.MutableRefObject<number>,
  isFragment = false, x = 0, y = 0, vx = 0, vy = 0, r = 0, color = '',
): AsteroidBody {
  if (!isFragment) {
    const edge = id % 4
    const frac = ((id * 73) % 80 + 10) / 100
    let sx = 0, sy = 0
    if (edge === 0) { sx = frac * w; sy = -55 }
    else if (edge === 1) { sx = w + 55; sy = frac * h }
    else if (edge === 2) { sx = frac * w; sy = h + 55 }
    else { sx = -55; sy = frac * h }
    const cx = w * 0.38 + (id % 5) * w * 0.06
    const cy = h * 0.38 + (id % 3) * h * 0.12
    const dx = cx - sx, dy = cy - sy
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const spd = 0.32 + (id % 4) * 0.14
    return {
      id, x: sx, y: sy,
      vx: dx / len * spd, vy: dy / len * spd,
      r: 22 + (id % 4) * 10,
      color: teams[id % Math.max(teams.length, 1)]?.color ?? '#8B5CF6',
      ptSet: id % 4, rotation: 0,
      rotSpeed: ((id % 7) - 3) * 0.0055,
      isFragment: false, flashTimer: 0,
      cooldown: id * 18,
    }
  }
  return {
    id: nextIdRef.current++,
    x, y, vx, vy,
    r: Math.max(r, 5),
    color,
    ptSet: Math.floor(Math.random() * 4),
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.06,
    isFragment: true, flashTimer: 10, cooldown: 45,
  }
}

function stepPhysics(
  asts: AsteroidBody[], w: number, h: number,
  teams: Team[], nextIdRef: React.MutableRefObject<number>,
) {
  const newFrags: AsteroidBody[] = []
  const removeSet = new Set<number>()

  for (const a of asts) {
    a.x += a.vx; a.y += a.vy
    a.rotation += a.rotSpeed
    if (a.flashTimer > 0) a.flashTimer--
    if (a.cooldown > 0) a.cooldown--
    if (a.r < 4) { removeSet.add(a.id); continue }
    const mg = a.r + 85
    if (a.x < -mg || a.x > w + mg || a.y < -mg || a.y > h + mg) {
      if (a.isFragment) { removeSet.add(a.id); continue }
      // Respawn
      const edge = Math.floor(Math.random() * 4)
      const fr = 0.15 + Math.random() * 0.7
      if (edge === 0) { a.x = fr * w; a.y = -mg / 2 }
      else if (edge === 1) { a.x = w + mg / 2; a.y = fr * h }
      else if (edge === 2) { a.x = fr * w; a.y = h + mg / 2 }
      else { a.x = -mg / 2; a.y = fr * h }
      const cx = w * 0.35 + Math.random() * w * 0.3
      const cy = h * 0.35 + Math.random() * h * 0.3
      const dx = cx - a.x, dy = cy - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1
      const spd = 0.28 + Math.random() * 0.5
      a.vx = dx / len * spd; a.vy = dy / len * spd
      a.r = 22 + Math.floor(Math.random() * 4) * 9
      a.color = teams[Math.floor(Math.random() * teams.length)]?.color ?? a.color
      a.cooldown = 90
    }
  }

  const active = asts.filter(a => !removeSet.has(a.id))

  // Collision detection
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j]
      if (removeSet.has(a.id) || removeSet.has(b.id)) continue
      if (a.cooldown > 0 || b.cooldown > 0) continue
      const dx = b.x - a.x, dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist === 0 || dist >= a.r + b.r) continue
      const nx = dx / dist, ny = dy / dist

      if (a.r > 18 || b.r > 18) {
        // Large → shatter bigger into fragments
        const big = a.r >= b.r ? a : b
        const small = a.r < b.r ? a : b
        removeSet.add(big.id)
        const nf = 3 + Math.floor(Math.random() * 3)
        for (let f = 0; f < nf; f++) {
          const ang = (f / nf) * Math.PI * 2 + Math.random() * 0.8
          const spd = 0.85 + Math.random() * 1.6
          const fr = big.r * (0.18 + Math.random() * 0.26)
          newFrags.push(spawnAsteroid(
            0, w, h, teams, nextIdRef, true,
            big.x + Math.cos(ang) * big.r * 0.4,
            big.y + Math.sin(ang) * big.r * 0.4,
            Math.cos(ang) * spd + big.vx * 0.22,
            Math.sin(ang) * spd + big.vy * 0.22,
            fr, big.color,
          ))
        }
        // Small bounces
        const relV = (small.vx - big.vx) * nx + (small.vy - big.vy) * ny
        if (relV < 0) { small.vx -= 1.35 * relV * nx; small.vy -= 1.35 * relV * ny }
        small.r = Math.max(small.r * 0.82, 5)
        small.flashTimer = 8; small.cooldown = 55
      } else {
        // Small-small: elastic bounce + shrink
        const relV = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
        if (relV < 0) {
          const imp = relV * 0.88
          a.vx += imp * nx; a.vy += imp * ny
          b.vx -= imp * nx; b.vy -= imp * ny
        }
        a.r = Math.max(a.r * 0.88, 4); b.r = Math.max(b.r * 0.88, 4)
        a.flashTimer = 6; b.flashTimer = 6
        a.cooldown = 32; b.cooldown = 32
      }
    }
  }

  // Rebuild array
  asts.splice(0, asts.length, ...active.filter(a => !removeSet.has(a.id)))
  const slots = 22 - asts.length
  for (let i = 0; i < Math.min(newFrags.length, slots); i++) asts.push(newFrags[i])
}

function drawAsteroid(ctx: CanvasRenderingContext2D, ast: AsteroidBody) {
  const pts = AST_PTS[ast.ptSet]
  const sc = ast.r / 45
  ctx.save()
  ctx.translate(ast.x, ast.y)
  ctx.rotate(ast.rotation)
  if (ast.flashTimer > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.88)'
    ctx.shadowColor = 'white'
    ctx.shadowBlur = 22
  } else {
    ctx.fillStyle = ast.color + '96'
    ctx.shadowColor = ast.color
    ctx.shadowBlur = 10
  }
  ctx.beginPath()
  ctx.moveTo(pts[0][0] * sc, pts[0][1] * sc)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * sc, pts[i][1] * sc)
  ctx.closePath()
  ctx.fill()
  if (!ast.flashTimer && ast.r > 10) {
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(0,0,0,0.28)'
    ctx.beginPath(); ctx.arc(-8 * sc, -9 * sc, 4 * sc, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(10 * sc, 12 * sc, 2.5 * sc, 0, Math.PI * 2); ctx.fill()
    if (ast.r > 24) {
      ctx.fillStyle = 'rgba(255,255,255,0.055)'
      ctx.beginPath(); ctx.arc(-2 * sc, 18 * sc, 3 * sc, 0, Math.PI * 2); ctx.fill()
    }
  }
  ctx.restore()
}

// ─────────────────────────────────────────────
// SpaceBackground — canvas + nebula (no FightingParticles)
// ─────────────────────────────────────────────
function SpaceBackground({ teams = [] }: { teams?: Team[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <SpaceCanvas teams={teams} />
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
  useEffect(() => {
    teams.forEach((_, i) => {
      setTimeout(() => playMascotSound(i, voicesEnabled), i * 350 + 200)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-10 px-4">
      <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black mb-12 tracking-widest text-white/90 drop-shadow-xl text-center">
        {t('setup_step_final') === 'Final Step' ? 'CONTENDERS' : 'المنافسون'}
      </motion.h2>
      <div className="flex flex-wrap justify-center gap-12 md:gap-20 w-full">
        {teams.map((team, idx) => (
          <motion.div key={idx} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.15, type: 'spring', stiffness: 220 }}
            className="flex flex-col items-center gap-5 relative group">
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 2.2 + idx * 0.3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative">
              <div className="absolute -inset-6 rounded-full opacity-0 group-hover:opacity-30 transition-opacity blur-2xl" style={{ background: team.color }} />
              <Mascot state="idle" size={100} color={team.color} />
            </motion.div>
            <div className="flex flex-col items-center gap-2">
              <span className="font-black text-xl text-white tracking-wide">{team.name}</span>
              <div className="w-10 h-1.5 rounded-full" style={{ background: team.color, boxShadow: `0 0 15px ${team.color}90` }} />
            </div>
          </motion.div>
        ))}
      </div>

      {teams.length % 2 !== 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-2">
          <Mascot state="idle" size={60} color={teams[teams.length - 1].color} />
          <span className="text-xs font-black text-white/40">{teams[teams.length - 1].name}</span>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }} className="flex gap-4 mt-2">
        <button onClick={onBack}
          className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/40
            hover:text-white hover:bg-white/10 transition-all font-bold text-sm">
          ← تعديل
        </button>
        <motion.button onClick={onConfirm} disabled={isStarting}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="group relative px-12 py-3 rounded-2xl overflow-hidden bg-white font-black
            text-black uppercase tracking-[0.2em] text-sm disabled:opacity-50 disabled:pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent
            -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {isStarting
            ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin block" />
            : <span className="relative">{t('setup_launch')} 🚀</span>
          }
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
      <SpaceBackground teams={teams} />
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
  const [newText, setNewText] = useState('')
  const [newLevel, setNewLevel] = useState<1 | 2 | 3>(1)
  const [open, setOpen] = useState(false)

  const addPunishment = () => {
    if (!newText.trim()) return
    setPunishments(p => [...p, { id: `c${Date.now()}`, text: newText.trim(), level: newLevel, enabled: true }])
    setNewText('')
  }

  const toggleItem = (id: string) =>
    setPunishments(p => p.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x))

  const removeItem = (id: string) =>
    setPunishments(p => p.filter(x => x.id !== id))

  return (
    <div className="border border-white/[0.06] rounded-3xl overflow-hidden">
      {/* Header toggle */}
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-all">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔴</span>
          <div className="text-start">
            <p className="text-sm font-black text-white/80">{t('setup_punishments')}</p>
            <p className="text-[10px] text-white/30 font-medium">
              {enabled ? `${punishments.filter(p => p.enabled).length} ${t('setup_punish_enabled')}` : t('setup_punish_disabled')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* On/off toggle */}
          <div onClick={e => { e.stopPropagation(); setEnabled(!enabled) }}
            className="relative w-11 h-6 rounded-full cursor-pointer transition-all duration-300"
            style={{ background: enabled ? '#22c55e' : 'rgba(255,255,255,0.1)' }}>
            <motion.div animate={{ x: enabled ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md" />
          </div>
          <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-white/25 text-xs">▼</motion.span>
        </div>
      </button>

      <AnimatePresence>
        {open && enabled && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
            className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4">

              {/* Mode selector */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">نوع العقوبة</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'wheel', icon: '🎡' },
                    { key: 'voted', icon: '🗳' },
                    { key: 'escalating', icon: '📈' },
                    { key: 'mixed', icon: '🎲' },
                  ] as const).map(({ key, icon }) => (
                    <button key={key} onClick={() => setMode(key as any)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-start transition-all"
                      style={{
                        borderColor: mode === key ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
                        background: mode === key ? 'rgba(255,255,255,0.08)' : 'transparent',
                      }}>
                      <span className="text-lg">{icon}</span>
                      <div>
                        <p className="text-xs font-black text-white/80 leading-tight">{t(`setup_mode_${key}` as any)}</p>
                        <p className="text-[9px] text-white/30 leading-tight">{t(`setup_mode_${key}_desc` as any)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Punishment list */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">قائمة العقوبات</p>
                <div className="space-y-1 max-h-28 overflow-y-auto no-scrollbar">
                  {punishments.map(p => {
                    const lm = {
                      1: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
                      2: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
                      3: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
                    }[p.level as 1 | 2 | 3]
                    return (
                      <motion.div key={p.id} layout
                        className="flex items-center gap-2 px-3 py-2 rounded-xl group"
                        style={{ background: p.enabled ? 'rgba(255,255,255,0.03)' : 'transparent', opacity: p.enabled ? 1 : 0.35 }}>
                        <button onClick={() => toggleItem(p.id)}
                          className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all"
                          style={{ borderColor: p.enabled ? lm.color : 'rgba(255,255,255,0.12)', background: p.enabled ? lm.bg : 'transparent' }}>
                          {p.enabled && <span className="text-[8px]" style={{ color: lm.color }}>✓</span>}
                        </button>
                        <span className="flex-1 text-xs text-white/65 truncate">{p.text}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ color: lm.color, background: lm.bg }}>
                          {t(`setup_level_${p.level === 1 ? 'easy' : p.level === 2 ? 'medium' : 'hard'}` as any)}
                        </span>
                        <button onClick={() => removeItem(p.id)}
                          className="text-white/15 hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100">✕</button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Add custom */}
              <div className="flex gap-2">
                <input value={newText} onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPunishment()}
                  placeholder="أضف عقوبة مخصصة…"
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2
                    text-xs outline-none focus:border-white/20 transition-all placeholder:text-white/20" />
                <div className="flex gap-1">
                  {([1, 2, 3] as const).map(l => {
                    const lm = {
                      1: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
                      2: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
                      3: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
                    }[l]
                    return (
                      <button key={l} onClick={() => setNewLevel(l)}
                        className="w-8 h-8 rounded-xl text-[10px] font-black transition-all border flex-shrink-0"
                        style={{
                          borderColor: newLevel === l ? lm.color : 'rgba(255,255,255,0.06)',
                          background: newLevel === l ? lm.bg : 'transparent',
                          color: newLevel === l ? lm.color : 'rgba(255,255,255,0.25)',
                        }}>
                        {l}
                      </button>
                    )
                  })}
                </div>
                <button onClick={addPunishment}
                  className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center
                    justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-sm flex-shrink-0">
                  +
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const [step, setStep] = useState<0 | 1>(0)

  const updateName = (i: number, name: string) => setTeams(p => p.map((t, j) => j === i ? { ...t, name } : t))
  const updateColor = (i: number, color: string) => setTeams(p => p.map((t, j) => j === i ? { ...t, color } : t))
  const removeTeam = (i: number) => setTeams(p => p.filter((_, j) => j !== i))

  const FUNNY_NAMES_AR = ["صائدو الجوائز", "عقول خطرة", "فرقة الإعدام", "سادة الفوضى", "النيزك القادم", "أسطورة الشاشة", "خوارزميات النصر", "ملوك الدراما", "نادي المكتئبين", "كتيبة الذكاء"]
  const FUNNY_NAMES_EN = ["Bounty Hunters", "Dangerous Minds", "Chaos Lords", "Incoming Meteor", "Screen Legends", "Victory Algorithms", "Drama Kings", "Depressed Club", "The Smart Squad", "Trivia Assassins"]

  const randomizeName = (i: number) => {
    const list = t('setup_step_final') === 'Final Step' ? FUNNY_NAMES_EN : FUNNY_NAMES_AR
    const random = list[Math.floor(Math.random() * list.length)]
    updateName(i, random)
  }

  const addTeam = () => {
    if (teams.length >= 4) {
      return
    }
    const used = new Set(teams.map(t => t.color))
    const next = TEAM_COLORS.find(c => !used.has(c)) ?? TEAM_COLORS[0]
    setTeams(p => [...p, { name: `Team ${p.length + 1}`, color: next }])
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden">
      <SpaceBackground teams={teams} />

      {/* Top controls */}
      <div className="absolute top-5 inset-x-6 z-20 flex items-center justify-end">
        <button onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center
            justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">✕</button>
      </div>

      <motion.div initial={{ y: 50, scale: 0.94, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 50, scale: 0.94, opacity: 0 }} transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-4xl px-4 flex items-center justify-center">
        <div className="bg-white/[0.04] backdrop-blur-[50px] border border-white/[0.08] rounded-[32px] p-5 w-full
          shadow-[0_0_100px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]">

          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div key="editor" initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 28 }} transition={{ duration: 0.22 }} className="space-y-3">

                {/* Session name */}
                <div className="text-center">
                  <input type="text" value={sessionName} onChange={e => setSessionName(e.target.value)}
                    className="bg-transparent text-2xl md:text-3xl font-black text-center w-full
                      outline-none placeholder-white/10 text-white"
                    placeholder={t('setup_session_ph')} />
                </div>

                {/* Teams */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {teams.map((team, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-3 relative group"
                      style={{ borderTopColor: team.color, borderTopWidth: 3 }}>
                      {teams.length > 2 && (
                        <button onClick={() => removeTeam(idx)}
                          className="absolute top-2 start-2 w-6 h-6 rounded-lg bg-red-500/10 text-red-400
                            text-xs opacity-0 group-hover:opacity-100 transition-opacity
                            flex items-center justify-center hover:bg-red-500/20">✕</button>
                      )}
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 1.6 + idx * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                        className="flex justify-center mb-1.5"
                        onClick={() => playMascotSound(idx, voicesEnabled)}>
                        <Mascot state="idle" size={36} color={team.color} />
                      </motion.div>
                      <div className="relative mb-3">
                        <input value={team.name} onChange={e => updateName(idx, e.target.value)}
                          className="w-full bg-transparent text-center font-bold text-sm outline-none
                            border-b border-white/10 pb-1.5 text-white focus:border-white/25 transition-colors pe-6" />
                        <button onClick={() => randomizeName(idx)} title="Randomize"
                          className="absolute end-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80 transition-colors text-xs">
                          🎲
                        </button>
                      </div>
                      <div className="flex gap-1.5 justify-center">
                        {TEAM_COLORS.map(c => (
                          <button key={c} onClick={() => updateColor(idx, c)}
                            className="w-5 h-5 rounded-full flex-shrink-0 transition-all hover:scale-110"
                            style={{
                              background: c, opacity: team.color === c ? 1 : 0.35,
                              transform: team.color === c ? 'scale(1.25)' : undefined,
                              outline: team.color === c ? '2px solid white' : 'none',
                              outlineOffset: 2,
                              boxShadow: team.color === c ? `0 0 10px ${c}` : 'none',
                            }} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  {teams.length < 4 && (
                    <motion.button onClick={addTeam}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="rounded-3xl border-2 border-dashed border-white/[0.07] flex flex-col
                        items-center justify-center gap-2 text-white/20 hover:text-white/50
                        hover:border-white/20 transition-all min-h-[160px]">
                      <span className="text-3xl font-thin">+</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {t('setup_add_team')}
                      </span>
                    </motion.button>
                  )}
                </div>

                {/* Punishment config */}
                <PunishmentConfig
                  enabled={punishEnabled} setEnabled={setPunishEnabled}
                  punishments={punishments} setPunishments={setPunishments}
                  mode={punishMode} setMode={setPunishMode}
                />

                {/* Punishment Preview Ticker */}
                <AnimatePresence>
                  {punishEnabled && punishments.filter(p => p.enabled).length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-6 overflow-hidden rounded-2xl bg-red-500/10 border border-red-500/20 py-2 relative">
                      {/* Gradient Masks for fade effect */}
                      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#07071A] to-transparent z-10" />
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#07071A] to-transparent z-10" />
                      <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] px-4">
                        {[...punishments.filter(p => p.enabled), ...punishments.filter(p => p.enabled)].map((p, i) => (
                          <span key={i} className="mx-6 text-[10px] font-black text-red-400 uppercase tracking-widest inline-flex items-center gap-1.5">
                            <span className="text-sm">⚠️</span> {p.text}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Voice & Next Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setVoicesEnabled(!voicesEnabled)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-start">
                    <span className="text-xl">{voicesEnabled ? '🔊' : '🔇'}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white leading-tight">{voicesEnabled ? (lang === 'AR' ? 'المعلق الصوتي مفعل' : 'Mascot Voice Enabled') : (lang === 'AR' ? 'المعلق الصوتي معطل' : 'Mascot Voice Disabled')}</span>
                      <span className="text-[9px] text-white/40 leading-tight">{lang === 'AR' ? 'يتحكم في تعليقات الشخصية أثناء اللعب' : 'Toggles the mascot commentary during the game'}</span>
                    </div>
                  </button>

                  <motion.button onClick={() => setStep(1)}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="group relative px-8 py-2.5 rounded-2xl overflow-hidden bg-white
                      font-black text-black uppercase tracking-[0.22em] text-xs">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10
                      to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative">معاينة المباراة ⚔</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="matchup" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.22 }}>
                <MatchupPreview
                  teams={teams} voicesEnabled={voicesEnabled}
                  onConfirm={onStart} onBack={() => setStep(0)}
                  isStarting={isStarting}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
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
  const { lang, mounted } = useFeedbackStore()
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
          (supabase.from('categories') as any).select('*'),
          (supabase.from('sessions') as any).select('*').eq('id', sessionId).single(),
        ])
        if (tR.error) throw tR.error
        if (cR.error) throw cR.error
        const rawTopics: any[] = tR.data ?? []
        const rawCats: any[] = cR.data ?? []
        if (sR.data?.name) setSessionName(sR.data.name)
        const merged: Topic[] = rawTopics.map(t => ({
          ...t, categories: rawCats.filter((c: any) => c.topic_id === t.id),
        }))
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
    const q = searchQuery.toLowerCase()
    const r = q
      ? topics.filter(t => t.name.toLowerCase().includes(q) || t.categories.some(c => c.name.toLowerCase().includes(q)))
      : topics
    switch (sortBy) {
      case 'alpha': return [...r].sort((a, b) => a.name.localeCompare(b.name, lang === 'AR' ? 'ar' : 'en'))
      case 'new': return [...r].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      case 'popular': return [...r].sort((a, b) => b.categories.length - a.categories.length)
      default: return [...r].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    }
  }, [topics, searchQuery, sortBy, lang])

  useEffect(() => {
    if (!filteredTopics.length) return
    setActiveTopic(prev => prev && filteredTopics.find(t => t.id === prev.id) ? prev : filteredTopics[0])
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
    playClickSound()
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
      audioDirector.runSequence([{ kind: 'mp3', url: '/intro.mp3' }])
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

      <div className="h-[100dvh] w-screen bg-[#07071A] text-white flex flex-col overflow-hidden relative"
        style={{ direction: dir, fontFamily: 'var(--font-tajawal),var(--font-cairo),sans-serif' }}>

        <Confetti active={showConfetti} />


        {/* Dynamic background */}
        <AnimatePresence>
          {activeTopic?.background_url ? (
            <motion.div key={`bg-${activeTopic.id}`} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.5, ease: "easeInOut" }} className="fixed inset-0 pointer-events-none z-0">
              <img src={activeTopic.background_url} alt="" className="w-full h-full object-cover blur-[2px] opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#07071A]/90 via-[#07071A]/70 to-[#07071A]" />
            </motion.div>
          ) : (
            <motion.div key={`glow-${activeTopic?.id ?? 'x'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }} className="fixed inset-0 pointer-events-none z-0"
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${activeColor}25 0%, transparent 70%), radial-gradient(ellipse at 100% 100%, ${activeColor}15 0%, transparent 50%)` }} />
          )}
        </AnimatePresence>

        {/* Sidebar hover preview */}


        {/* ── HEADER ── */}
        <motion.header animate={{ backgroundColor: `${activeColor}12`, borderColor: `${activeColor}20` }}
          transition={{ duration: 0.65 }}
          className="relative z-10 px-8 h-[64px] flex items-center justify-between flex-shrink-0
          backdrop-blur-md border-b">

          <div className="flex items-center gap-5">
            <button onClick={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10
              flex items-center justify-center hover:bg-white/10 transition-all text-sm">
              {dir === 'rtl' ? '→' : '←'}
            </button>
            <div>
              <h1 className="text-base font-black tracking-tight">{t('setup_title')}</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${activeColor}99` }}>
                {t('setup_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Smart Search */}
            <div className="hidden md:block relative group">
              <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-white/20 group-focus-within:text-white/60 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                id="setup-search"
                placeholder={t('setup_search_ph')}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl py-2 ps-10 pe-12 text-xs font-bold
                outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all placeholder:text-white/20 w-56
                focus:ring-4 focus:ring-white/5"/>

              <div className="absolute inset-y-0 end-0 flex items-center pe-2.5 gap-1.5">
                {searchQuery ? (
                  <button onClick={() => setSearchQuery('')}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/25 hover:text-white transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                ) : (
                  <div className="px-1.5 py-0.5 rounded-md border border-white/10 bg-white/5 text-[9px] font-black text-white/20 pointer-events-none">
                    /
                  </div>
                )}
              </div>

              {searchQuery && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 px-3 py-1.5 bg-[#12122A] border border-white/10 rounded-xl shadow-2xl z-50">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/40">
                    {filteredTopics.length} {lang === 'AR' ? 'نتائج' : 'results'}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Share */}
            <AnimatePresence>
              {selectedCount > 0 && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={copyShareUrl}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5
                  border border-white/[0.08] text-white/30 hover:text-white/70 hover:bg-white/10
                  transition-all text-xs font-bold">
                  <span>🔗</span><span>شارك</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Keyboard hints */}
            <div className="hidden lg:flex items-center gap-1 text-white/12 text-[10px] font-bold">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↓</kbd>
              <span className="mx-0.5 text-white/15">topics</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">1-6</kbd>
              <span className="text-white/15">cats</span>
            </div>

            <ProgressRing count={selectedCount} max={MAX_CATS} color={activeColor} />

            <AnimatePresence>
              {atMax && (
                <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="hidden md:block text-[10px] font-black text-red-400
                  bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full whitespace-nowrap">
                  {lang === 'AR' ? 'وصلت للحد الأقصى' : 'Max reached'}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Next step with animated badge */}
            <motion.button onClick={() => { setShowTeams(true); toast.success(lang === 'AR' ? 'تجهيز الفرق...' : 'Preparing teams...') }}
              whileHover={selectedCount > 0 ? { scale: 1.04 } : {}}
              whileTap={selectedCount > 0 ? { scale: 0.96 } : {}}
              disabled={selectedCount === 0}
              className="relative px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest
              transition-all duration-300 disabled:cursor-not-allowed overflow-visible"
              style={{
                background: selectedCount > 0 ? 'white' : 'rgba(255,255,255,0.05)',
                color: selectedCount > 0 ? 'black' : 'rgba(255,255,255,0.2)',
                boxShadow: selectedCount > 0 ? '0 0 28px rgba(255,255,255,0.2)' : 'none',
              }}>
              {t('setup_next_step')}
              <AnimatePresence>
                {selectedCount > 0 && (
                  <motion.span key={selectedCount}
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute -top-2 -end-2 w-5 h-5 rounded-full bg-red-500 text-white
                    text-[10px] font-black flex items-center justify-center shadow-lg">
                    {selectedCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.header>

        {/* ── MAIN LAYOUT ── */}
        <div className="flex flex-1 overflow-hidden relative z-10">

          {/* ── Topic Sidebar — tinted ── */}
          <motion.aside animate={{ borderColor: `${activeColor}25`, backgroundColor: `${activeColor}08` }}
            transition={{ duration: 0.65 }}
            className="w-72 flex-shrink-0 border-e backdrop-blur-xl flex flex-col overflow-hidden">

            {/* Sort */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/5">
                {(['admin', 'alpha', 'popular', 'new'] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className="flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all"
                    style={{
                      background: sortBy === s ? `${activeColor}28` : 'transparent',
                      color: sortBy === s ? activeColor : 'rgba(255,255,255,0.2)',
                    }}>
                    {t(`setup_sort_${s}` as any)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-3 space-y-1">
              {filteredTopics.map(topic => {
                const isActive = activeTopic?.id === topic.id
                const selCount = topic.categories.filter(c => selectedCategories.includes(c.id)).length
                return (
                  <button key={topic.id}
                    onClick={() => setActiveTopic(topic)}
                    onMouseEnter={e => {
                      // Just glow, handled by isActive/hover classes
                    }}
                    className="relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                    transition-all duration-200 text-start group overflow-hidden"
                    style={{
                      background: isActive ? `${topic.color ?? activeColor}18` : 'transparent',
                      borderLeft: isActive ? `2px solid ${topic.color ?? activeColor}` : '2px solid transparent',
                    }}>
                    <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-125' : 'group-hover:scale-110'}`}>
                      {topic.icon ?? '📚'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black truncate transition-colors ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/65'}`}>
                        {topic.name}
                      </p>
                      <p className="text-[9px] text-white/20 font-bold uppercase tracking-wider mt-0.5">
                        {topic.categories.length} {t('setup_cats')}
                      </p>
                    </div>
                    <AnimatePresence>
                      {selCount > 0 && (
                        <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
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
            <AnimatePresence>
              {activeTopic && (
                <motion.div key={activeTopic.id}
                  initial={{ opacity: 0, y: direction * 25, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: direction * -25, scale: 0.99 }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute inset-0 flex flex-col will-change-transform">

                  {/* Banner */}
                  <div className="relative overflow-hidden" style={{ minHeight: 180 }}>
                    <AnimatePresence>
                      {activeTopic.banner_url ? (
                        <motion.div key={`bn-${activeTopic.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.55 }} className="absolute inset-0">
                          <img src={activeTopic.banner_url} alt="" className="w-full h-full object-cover opacity-40" />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07071A]/55 to-[#07071A]" />
                        </motion.div>
                      ) : (
                        <motion.div key={`bg2-${activeTopic.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0"
                          style={{ background: `linear-gradient(135deg, ${activeTopic.color ?? activeColor}1e 0%, transparent 60%)` }} />
                      )}
                    </AnimatePresence>

                    <div className="relative z-10 px-10 py-8 flex items-end justify-between gap-6">
                      <div>
                        <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className="text-[10px] font-black uppercase tracking-[0.35em] mb-1.5 block"
                          style={{ color: activeTopic.color ?? activeColor }}>
                          {String(activeIndex + 1).padStart(2, '0')} / {String(filteredTopics.length).padStart(2, '0')}
                        </motion.span>
                        <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                          className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4">
                          <span>{activeTopic.icon ?? '📚'}</span><span>{activeTopic.name}</span>
                        </motion.h2>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                          className="text-white/30 text-sm mt-1.5 font-medium">
                          {activeTopic.categories.length} {t('setup_cats')} •{' '}
                          {activeTopic.categories.filter(c => selectedCategories.includes(c.id)).length}{' '}
                          {lang === 'AR' ? 'محددة' : 'selected'}
                        </motion.p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setDirection(-1); activeIndex > 0 && setActiveTopic(filteredTopics[activeIndex - 1]) }}
                          disabled={activeIndex <= 0}
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/[0.08] flex items-center
                          justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all
                          disabled:opacity-20 disabled:cursor-not-allowed">
                          ↑
                        </button>
                        <button onClick={() => { setDirection(1); activeIndex < filteredTopics.length - 1 && setActiveTopic(filteredTopics[activeIndex + 1]) }}
                          disabled={activeIndex >= filteredTopics.length - 1}
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/[0.08] flex items-center
                          justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all
                          disabled:opacity-20 disabled:cursor-not-allowed">
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex-1 overflow-y-auto no-scrollbar px-10 pt-2 pb-28">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                        {t('setup_step_cats')}
                      </h3>

                    </div>
                    {activeTopic.categories.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-white/20 text-sm font-bold">
                        {lang === 'AR' ? 'لا توجد فئات لهذا الموضوع' : 'No categories'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                        {activeTopic.categories.map((cat, i) => (
                          <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: i * 0.035, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}>
                            <CategoryCard3D
                              cat={cat} topic={activeTopic}
                              isSelected={selectedCategories.includes(cat.id)}
                              isBlocked={atMax && !selectedCategories.includes(cat.id)}
                              onToggle={toggleCategory}
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected chip strip & Mascot Guidance */}
            <AnimatePresence>
              {selectedCount > 0 && (
                <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="fixed bottom-0 start-72 end-0 z-20 px-10 py-4
                  bg-gradient-to-t from-[#07071A]/95 via-[#07071A]/80 to-transparent backdrop-blur-md">

                  {/* Mascot Guidance */}
                  <div className="absolute -top-16 end-10 flex items-end gap-4 pointer-events-none">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-black px-4 py-2 rounded-2xl rounded-br-none shadow-xl">
                      {getMascotMessage()}
                    </div>
                    <div className="w-16 h-16 drop-shadow-2xl">
                      <Mascot state={(atMax ? "happy" : "idle") as any} size={64} color={activeColor} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap relative z-10">
                    {selectedCategories.map(id => {
                      const cat = allCategories.find(c => c.id === id)
                      const owner = topics.find(t => t.id === cat?.topic_id)
                      return (
                        <motion.div key={id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold"
                          style={{
                            borderColor: `${owner?.color ?? activeColor}50`,
                            background: `${owner?.color ?? activeColor}18`,
                          }}>
                          <span className="text-white/70">{cat?.name ?? id}</span>
                          <button onClick={() => toggleCategory(id)}
                            className="text-white/25 hover:text-white/70 transition-colors leading-none">✕</button>
                        </motion.div>
                      )
                    })}
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
