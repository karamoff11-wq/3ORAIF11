'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    let t = 0

    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)

    // Particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    }))

    const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899']

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      // Animated gradient bg
      const grad = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.3, h * 0.3, w * 0.8)
      const c1 = `rgba(139,92,246,${0.18 + 0.08 * Math.sin(t * 0.4)})`
      const c2 = `rgba(59,130,246,${0.12 + 0.06 * Math.sin(t * 0.3 + 1)})`
      grad.addColorStop(0, c1); grad.addColorStop(0.5, c2); grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)

      const grad2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 0, w * 0.8, h * 0.7, w * 0.6)
      grad2.addColorStop(0, `rgba(245,158,11,${0.12 + 0.06 * Math.sin(t * 0.5)})`)
      grad2.addColorStop(0.5, `rgba(236,72,153,${0.08 + 0.04 * Math.cos(t * 0.4)})`)
      grad2.addColorStop(1, 'transparent')
      ctx.fillStyle = grad2; ctx.fillRect(0, 0, w, h)

      // Particles
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`
        ctx.fill()
      })
      t += 0.008
      requestAnimationFrame(draw)
    }
    draw()
    return () => window.removeEventListener('resize', resize)
  }, [])

  const orbitals = [
    { icon: '🎮', label: 'العب', sub: 'استمتع بتجربة لا مثيل لها', color: '#8B5CF6', angle: 0 },
    { icon: '🎯', label: 'تحدّ', sub: 'اختبر نفسك وتحدى الآخرين', color: '#EC4899', angle: 90 },
    { icon: '🏆', label: 'انتصر', sub: 'حقق البطولات وارتفع مستواك', color: '#F59E0B', angle: 180 },
    { icon: '🧠', label: 'طور نفسك', sub: 'تعلم أشياء جديدة كل يوم', color: '#3B82F6', angle: 270 },
  ]

  const stats = [
    { icon: '🔥', value: '64', label: 'سلسلة الانتصارات', color: '#F59E0B' },
    { icon: '📈', value: '99.9%', label: 'معدل النجاح', color: '#10B981' },
    { icon: '👥', value: '1152+', label: 'لاعب نشط', color: '#3B82F6' },
    { icon: '🏆', value: '4', label: 'بطولات مستمرة', color: '#8B5CF6' },
  ]

  const features = [
    { icon: '⚡', title: 'تحديثات مستمرة', desc: 'نضيف محتوى وتحديات جديدة باستمرار. لا وقت للتوقف.', color: '#8B5CF6', link: 'اكتشف الجديد' },
    { icon: '🧠', title: 'قاعدة معرفة ضخمة', desc: 'أكثر من 1000 سؤال في مختلف المجالات والثقافات.', color: '#EC4899', link: 'تصفح الأسئلة' },
    { icon: '🏆', title: 'تجربة تنافسية حقيقية', desc: 'تحدّ أصدقاءك وناقش الأفضل في القوائم العالمية.', color: '#F59E0B', link: 'لوحة المتصدرين' },
    { icon: '🎁', title: 'مكافآت وجوائز', desc: 'اربح النقاط وتبادلها بمكافآت وهدايا حصرية.', color: '#3B82F6', link: 'زيارة المتجر' },
  ]

  const trustBadges = [
    { icon: '🔒', label: 'آمن 100%', sub: 'بيانة آمنة ومحمية' },
    { icon: '⚡', label: 'دعم 24/7', sub: 'نحن هنا مساعدتك' },
    { icon: '🚀', label: 'تجربة سلسة', sub: 'أداء سريع بدون تقطيع' },
    { icon: '🌍', label: 'مجتمع كبير', sub: 'آلاف اللاعبين حول العالم' },
  ]

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white" style={{ background: '#07071A', direction: 'rtl', fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>

      {/* Animated canvas background */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.9 }} />

      {/* Grid overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* ── NAV ── */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-16 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', background: 'rgba(7,7,26,0.6)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)' }}>🎮</div>
          <span className="font-black text-xl tracking-tight">الغُريف</span>
        </div>
        <div className="hidden lg:flex items-center gap-8 text-sm text-white/40">
          {['الألعاب','التحديات','لوحة المتصدرين','المهام اليومية','المتجر'].map(l => (
            <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-2">
            <span>دخول</span><span>🔑</span>
          </button>
          <Link href="/auth/register" className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.04] flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}>
            <span>ابدأ الآن</span><span>🚀</span>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 px-6 md:px-16 pt-16 pb-24 min-h-[90vh] flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Text */}
          <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease', transitionDelay: '0.1s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8 border" style={{ background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', color: '#A78BFA' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#8B5CF6' }} />
              منصة تريفيا من الجيل القادم
            </div>

            <h1 className="font-black leading-[1.1] tracking-tight mb-6" style={{ fontSize: 'clamp(52px, 8vw, 100px)' }}>
              <span className="block text-white">اللعب.</span>
              <span className="block" style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>تحدّي.</span>
              <span className="block" style={{ background: 'linear-gradient(135deg,#F59E0B,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>انتصار.</span>
            </h1>

            <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-md">
              منصة ترفيهية تعليمية تجمع بين التحدي، المعرفة، والمتعة. تعلم، تنافس، وكن الأفضل كل يوم!
            </p>

            <div className="flex items-center gap-4 mb-12">
              <Link href="/auth/register" className="px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.04] hover:shadow-2xl flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)', boxShadow: '0 8px 32px rgba(139,92,246,0.5)' }}>
                🚀 ابدأ اللعب الآن
              </Link>
              <Link href="/join" className="px-8 py-4 rounded-2xl font-bold text-base border text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                🎮 انضم لجلسة
              </Link>
              <Link href="/dashboard?test=true" className="px-6 py-3 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all">
                🔓 دخول ضيف (تجربة)
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 space-x-reverse">
                {['🟣','🔵','🟡','🔴'].map((c,i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm" style={{ borderColor: '#07071A', background: 'rgba(255,255,255,0.1)' }}>{c}</div>
                ))}
              </div>
              <div className="text-sm text-white/40">
                <span className="text-white font-bold">+10K</span> لاعب نشط الآن
              </div>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
            </div>
          </div>

          {/* Right: Orbital diagram */}
          <div className="relative flex items-center justify-center" style={{ height: '420px', opacity: mounted ? 1 : 0, transition: 'opacity 1s ease', transitionDelay: '0.3s' }}>
            {/* Center glow */}
            <div className="absolute rounded-full" style={{ width: 200, height: 200, background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', filter: 'blur(30px)' }} />

            {/* Orbit rings */}
            <div className="absolute rounded-full border" style={{ width: 320, height: 320, borderColor: 'rgba(255,255,255,0.05)', animation: 'spin-orbit 20s linear infinite' }} />
            <div className="absolute rounded-full border" style={{ width: 380, height: 380, borderColor: 'rgba(139,92,246,0.08)', animation: 'spin-orbit 30s linear infinite reverse' }} />

            {/* Orbital nodes */}
            {orbitals.map((o, i) => {
              const rad = (i * 90 - 90) * Math.PI / 180
              const r = 160
              const x = Math.cos(rad) * r
              const y = Math.sin(rad) * r
              return (
                <div key={i} className="absolute flex flex-col items-center gap-2 group cursor-pointer" style={{ transform: `translate(${x}px, ${y}px)` }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all group-hover:scale-110 group-hover:rotate-6" style={{ background: `linear-gradient(135deg,${o.color}40,${o.color}20)`, border: `1px solid ${o.color}50`, boxShadow: `0 0 20px ${o.color}30`, backdropFilter: 'blur(10px)' }}>
                    {o.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">{o.label}</div>
                    <div className="text-[10px] text-white/30 max-w-[90px] leading-tight">{o.sub}</div>
                  </div>
                </div>
              )
            })}

            {/* Center diamond */}
            <div className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center text-3xl rotate-12 transition-transform hover:rotate-0" style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6,#EC4899)', boxShadow: '0 0 40px rgba(139,92,246,0.6)', animation: 'float-diamond 4s ease-in-out infinite' }}>
              💎
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 px-6 md:px-16 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="p-5 rounded-2xl border transition-all hover:scale-[1.02] hover:border-opacity-50" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/40 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 px-6 md:px-16 pb-24">
        <div className="text-center mb-16">
          <div className="text-xs font-mono tracking-[0.4em] uppercase text-white/25 mb-4">لماذا العُريف</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            كل شيء صُمّم{' '}
            <span style={{ background: 'linear-gradient(135deg,#8B5CF6,#F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>لتفوز</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i} className="group p-7 rounded-3xl border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 30%, ${f.color}15 0%, transparent 70%)` }} />
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${f.color}60, transparent)` }} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-5 transition-transform group-hover:scale-110" style={{ background: `${f.color}20`, border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-3 tracking-tight">{f.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed mb-5">{f.desc}</p>
                <a href="#" className="text-xs font-bold flex items-center gap-2 transition-colors hover:gap-3" style={{ color: f.color }}>
                  {f.link} ←
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 px-6 md:px-16 pb-24">
        <div className="relative overflow-hidden rounded-3xl p-12 md:p-20 text-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.15) 40%, rgba(236,72,153,0.15) 100%)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 0 80px rgba(139,92,246,0.1)' }}>
          {/* Corner glows */}
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', filter: 'blur(40px)', transform: 'translate(-30%,-30%)' }} />
          <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)', filter: 'blur(40px)', transform: 'translate(30%,30%)' }} />

          <div className="relative z-10">
            <div className="text-5xl mb-6">🏆</div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">جاهز للتحدي؟</h2>
            <p className="text-xl text-white/50 mb-10 font-light">انضم الآن، وابدأ رحلتك نحو القمة!</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <Link href="/auth/register" className="px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-[1.04] hover:shadow-2xl flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', boxShadow: '0 8px 40px rgba(139,92,246,0.5)' }}>
                🚀 ابدأ اللعب الآن
              </Link>
              <Link href="/join" className="px-10 py-5 rounded-2xl font-bold text-lg border text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                🎮 انضم لجلسة
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {trustBadges.map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-2xl">{b.icon}</span>
                  <div className="text-sm font-bold text-white">{b.label}</div>
                  <div className="text-xs text-white/30">{b.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 px-6 md:px-16 py-10 border-t flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)' }}>🎮</div>
          <span className="font-black text-lg tracking-tight">الغُريف</span>
        </div>
        <div className="text-xs font-mono tracking-[0.4em] uppercase text-white/15">تحديد مستقبل التحدي — 2026</div>
        <div className="flex gap-8 text-xs font-mono tracking-[0.3em] uppercase text-white/25">
          {['الفهرس','التواصل','قانوني'].map(l => <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>)}
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap');
        @keyframes spin-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float-diamond { 0%,100% { transform: rotate(12deg) translateY(0); } 50% { transform: rotate(12deg) translateY(-12px); } }
      `}</style>
    </main>
  )
}
