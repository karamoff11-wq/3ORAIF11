'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COMING_SOON = ['الألعاب', 'التحديات', 'لوحة المتصدرين', 'المهام اليومية', 'المتجر']

const orbitals = [
  { icon: '🎮', label: 'العب', sub: 'تجربة لا مثيل لها', color: '#8B5CF6', angle: 0 },
  { icon: '🎯', label: 'تحدَّ', sub: 'اختبر نفسك', color: '#EC4899', angle: 90 },
  { icon: '🏆', label: 'انتصر', sub: 'حقق البطولات', color: '#F59E0B', angle: 180 },
  { icon: '🧠', label: 'طوّر', sub: 'تعلم كل يوم', color: '#3B82F6', angle: 270 },
]

const features = [
  { icon: '⚡', title: 'تحديثات مستمرة', desc: 'نضيف محتوى وتحديات جديدة باستمرار.', color: '#8B5CF6' },
  { icon: '🧠', title: 'قاعدة معرفة ضخمة', desc: 'أكثر من 1000 سؤال في مختلف المجالات.', color: '#EC4899' },
  { icon: '🏆', title: 'تجربة تنافسية', desc: 'تحدَّ أصدقاءك وناقش الأفضل.', color: '#F59E0B' },
  { icon: '🎁', title: 'مكافآت وجوائز', desc: 'اربح النقاط وتبادلها بمكافآت حصرية.', color: '#3B82F6', comingSoon: true },
]

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const [orbitalAngle, setOrbitalAngle] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Canvas background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    let t = 0
    let raf: number

    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.8 + 0.2,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.35 + 0.05,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      const g1 = ctx.createRadialGradient(w * 0.25, h * 0.25, 0, w * 0.25, h * 0.25, w * 0.7)
      g1.addColorStop(0, `rgba(139,92,246,${0.16 + 0.07 * Math.sin(t * 0.35)})`)
      g1.addColorStop(0.5, `rgba(59,130,246,${0.09 + 0.05 * Math.sin(t * 0.28)})`)
      g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h)

      const g2 = ctx.createRadialGradient(w * 0.82, h * 0.72, 0, w * 0.82, h * 0.72, w * 0.55)
      g2.addColorStop(0, `rgba(236,72,153,${0.1 + 0.05 * Math.sin(t * 0.42)})`)
      g2.addColorStop(0.5, `rgba(245,158,11,${0.07 + 0.04 * Math.cos(t * 0.35)})`)
      g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h)

      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`
        ctx.fill()
      })
      t += 0.007
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf) }
  }, [])

  // Orbital rotation
  useEffect(() => {
    const id = setInterval(() => setOrbitalAngle(a => a + 0.12), 16)
    return () => clearInterval(id)
  }, [])

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white"
      style={{ background: '#07071A', direction: 'rtl', fontFamily: "'Cairo','Tajawal',sans-serif" }}>

      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.85 }} />

      {/* Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(139,92,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.03) 1px,transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* ── NAV ── */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-16 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', background: 'rgba(7,7,26,0.55)' }}>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)' }}>🎮</div>
          <span className="font-black text-xl tracking-tight">العفريف</span>
        </div>

        {/* Nav links with coming soon */}
        <div className="hidden lg:flex items-center gap-1">
          {COMING_SOON.map(l => (
            <div key={l} className="relative"
              onMouseEnter={() => setHoveredNav(l)}
              onMouseLeave={() => setHoveredNav(null)}>
              <button className="px-4 py-2 rounded-xl text-sm text-white/30 hover:text-white/50 transition-colors cursor-default">
                {l}
              </button>
              <AnimatePresence>
                {hoveredNav === l && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-1/2 translate-x-1/2 mt-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap z-50"
                    style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}>
                    🔒 قريباً
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/login"
            className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white border border-white/8 hover:border-white/18 transition-all">
            دخول
          </Link>
          <Link href="/auth/register"
            className="px-5 py-2.5 rounded-xl text-sm font-black transition-all hover:scale-[1.03] flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}>
            ابدأ الآن 🚀
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 px-6 md:px-16 pt-16 pb-20 min-h-[92vh] flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 24 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8 border"
              style={{ background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.28)', color: '#a78bfa' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#8B5CF6' }} />
              منصة تريفيا من الجيل القادم
            </div>

            <h1 className="font-black leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: 'clamp(48px,7vw,88px)' }}>
              <span className="block text-white">اللعب.</span>
              <span className="block" style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>تحدَّي.</span>
              <span className="block" style={{ background: 'linear-gradient(135deg,#F59E0B,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>انتصار.</span>
            </h1>

            <p className="text-lg text-white/45 leading-relaxed mb-10 max-w-md">
              منصة ترفيهية تعليمية تجمع بين التحدي والمعرفة والمتعة. تعلم، تنافس، وكن الأفضل كل يوم.
            </p>

            <div className="flex items-center gap-3 mb-10 flex-wrap">
              <Link href="/auth/register"
                className="px-8 py-4 rounded-2xl font-black text-base transition-all hover:scale-[1.03] flex items-center gap-2.5"
                style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)', boxShadow: '0 8px 28px rgba(139,92,246,0.45)' }}>
                🚀 ابدأ اللعب الآن
              </Link>
              <Link href="/join"
                className="px-8 py-4 rounded-2xl font-bold text-base border text-white/60 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all flex items-center gap-2.5"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                🎮 انضم لجلسة
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2 space-x-reverse">
                {['🟣', '🔵', '🟡', '🔴'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs"
                    style={{ borderColor: '#07071A', background: 'rgba(255,255,255,0.08)' }}>{c}</div>
                ))}
              </div>
              <p className="text-sm text-white/35">
                <span className="text-white font-bold">+10K</span> لاعب نشط الآن
              </p>
              <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: '#10B981' }} />
            </div>
          </motion.div>

          {/* Right: Upgraded orbital */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative flex items-center justify-center"
            style={{ height: 440 }}>

            {/* Glow */}
            <div className="absolute rounded-full pointer-events-none"
              style={{ width: 220, height: 220, background: 'radial-gradient(circle,rgba(139,92,246,0.25) 0%,transparent 70%)', filter: 'blur(40px)' }} />

            {/* Orbit rings */}
            <div className="absolute rounded-full border pointer-events-none"
              style={{ width: 340, height: 340, borderColor: 'rgba(139,92,246,0.1)', borderStyle: 'dashed' }} />
            <div className="absolute rounded-full border pointer-events-none"
              style={{ width: 400, height: 400, borderColor: 'rgba(255,255,255,0.04)' }} />

            {/* Orbital nodes — rotate via state */}
            {orbitals.map((o, i) => {
              const baseAngle = i * 90
              const rad = ((baseAngle + orbitalAngle) - 90) * Math.PI / 180
              const r = 162
              const x = Math.cos(rad) * r
              const y = Math.sin(rad) * r
              return (
                <motion.div key={i}
                  className="absolute flex flex-col items-center gap-1.5 group cursor-pointer"
                  style={{ transform: `translate(${x}px,${y}px)` }}
                  whileHover={{ scale: 1.12 }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
                    style={{
                      background: `linear-gradient(135deg,${o.color}35,${o.color}15)`,
                      border: `1px solid ${o.color}45`,
                      boxShadow: `0 0 24px ${o.color}25`,
                      backdropFilter: 'blur(12px)',
                    }}>
                    {o.icon}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-white">{o.label}</p>
                    <p className="text-[9px] text-white/25 max-w-[80px] leading-tight">{o.sub}</p>
                  </div>
                </motion.div>
              )
            })}

            {/* Center */}
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [12, 15, 12] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                background: 'linear-gradient(135deg,#8B5CF6,#3B82F6,#EC4899)',
                boxShadow: '0 0 50px rgba(139,92,246,0.6)',
              }}>
              💎
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 px-6 md:px-16 pb-24">
        <div className="text-center mb-14">
          <p className="text-xs font-mono tracking-[0.4em] uppercase text-white/20 mb-3">لماذا العفريف</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            كل شيء صُمِّم{' '}
            <span style={{ background: 'linear-gradient(135deg,#8B5CF6,#F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              لتفوز
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.div key={i}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25 }}
              className="group relative p-6 rounded-3xl border overflow-hidden cursor-default"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>

              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 30%,${f.color}12 0%,transparent 70%)` }} />
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg,transparent,${f.color}50,transparent)` }} />

              <div className="relative z-10">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}28` }}>
                  {f.icon}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-black tracking-tight">{f.title}</h3>
                  {f.comingSoon && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                      قريباً
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/30 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 px-6 md:px-16 pb-24">
        <div className="relative overflow-hidden rounded-3xl p-12 md:p-20 text-center max-w-5xl mx-auto"
          style={{
            background: 'linear-gradient(135deg,rgba(139,92,246,0.18) 0%,rgba(59,130,246,0.12) 50%,rgba(236,72,153,0.12) 100%)',
            border: '1px solid rgba(139,92,246,0.18)',
          }}>
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.25) 0%,transparent 70%)', filter: 'blur(40px)', transform: 'translate(-30%,-30%)' }} />
          <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(236,72,153,0.25) 0%,transparent 70%)', filter: 'blur(40px)', transform: 'translate(30%,30%)' }} />

          <div className="relative z-10">
            <div className="text-5xl mb-5">🏆</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3">جاهز للتحدي؟</h2>
            <p className="text-lg text-white/40 mb-8 font-light">انضم الآن وابدأ رحلتك نحو القمة!</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register"
                className="px-10 py-4 rounded-2xl font-black text-lg transition-all hover:scale-[1.03] flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', boxShadow: '0 8px 32px rgba(139,92,246,0.45)' }}>
                🚀 ابدأ اللعب الآن
              </Link>
              <Link href="/join"
                className="px-10 py-4 rounded-2xl font-bold text-lg border text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                🎮 انضم لجلسة
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 px-6 md:px-16 py-8 border-t flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)' }}>🎮</div>
          <span className="font-black text-base tracking-tight">العفريف</span>
        </div>
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-white/12">تحدي مستقبل التحدي — 2026</p>
        <div className="flex gap-6 text-xs text-white/20">
          {['الفهرس', 'التواصل', 'قانوني'].map(l => (
            <a key={l} href="#" className="hover:text-white/50 transition-colors">{l}</a>
          ))}
        </div>
      </footer>

    </main>
  )
}
