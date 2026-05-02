'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectedFrom') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('مرحباً بعودتك! 👋')
    router.push(redirectTo)
    router.refresh()
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '14px 18px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    direction: 'ltr' as const,
    textAlign: 'left' as const,
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {/* Email */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-widest text-white/40">البريد الإلكتروني</label>
          <span className="text-white/20 text-sm">✉️</span>
        </div>
        <input
          id="email" type="email" placeholder="example@email.com"
          value={email} onChange={e => setEmail(e.target.value)} required
          style={inputStyle}
          onFocus={e => { e.target.style.border = '1px solid rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 4px rgba(139,92,246,0.12)' }}
          onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-widest text-white/40">كلمة المرور</label>
          <span className="text-white/20 text-sm">🔒</span>
        </div>
        <div className="relative">
          <input
            id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required
            style={{ ...inputStyle, paddingLeft: 48 }}
            onFocus={e => { e.target.style.border = '1px solid rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 4px rgba(139,92,246,0.12)' }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
          />
          <button type="button" onClick={() => setShowPassword(p => !p)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-sm">
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {/* Remember + Forgot */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setRemember(r => !r)}
            className="w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer"
            style={{ background: remember ? 'linear-gradient(135deg,#8B5CF6,#EC4899)' : 'rgba(255,255,255,0.06)', border: remember ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
          >
            {remember && <span className="text-xs text-white">✓</span>}
          </div>
          <span className="text-sm text-white/40">تذكّرني</span>
        </label>
        <a href="#" className="text-sm font-bold" style={{ color: '#F59E0B' }}>نسيت كلمة المرور؟</a>
      </div>

      {/* Submit */}
      <motion.button
        type="submit" id="login-submit-btn" disabled={loading}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3"
        style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', boxShadow: '0 8px 32px rgba(139,92,246,0.45)', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>جاري الدخول...</span>
          </>
        ) : (
          <><span>تسجيل الدخول</span><span>🚀</span></>
        )}
      </motion.button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-xs text-white/20 font-mono tracking-widest">أو تابع باستخدام</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Social */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'جوجل', icon: '🌐', color: '#EA4335' },
          { label: 'أبل', icon: '🍎', color: '#fff' },
          { label: 'فيسبوك', icon: '📘', color: '#1877F2' },
        ].map(s => (
          <button key={s.label} type="button"
            className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.04] hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </form>
  )
}

const floatingIcons = [
  { icon: '🎯', x: '8%', y: '25%', color: '#8B5CF6', size: 64, delay: 0 },
  { icon: '🛡️', x: '5%', y: '60%', color: '#3B82F6', size: 60, delay: 0.5 },
  { icon: '🏆', x: '88%', y: '20%', color: '#F59E0B', size: 68, delay: 0.3 },
  { icon: '🎮', x: '91%', y: '60%', color: '#EC4899', size: 62, delay: 0.8 },
]

const trustBadges = [
  { icon: '🛡️', label: 'أمن وموثوق', sub: 'حماية عالية لبياناتك' },
  { icon: '⚡', label: 'دخول سريع', sub: 'تجربة دخول سلسة وسريعة' },
  { icon: '🏆', label: 'تقدم مستمر', sub: 'احفظ تقدمك وبياناتك دائماً' },
  { icon: '👤', label: 'حسابك، تجربتك', sub: 'خصص تجربتك كما تحب' },
]

export default function LoginPage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: '#07071A', direction: 'rtl', fontFamily: "'Cairo','Tajawal',sans-serif" }}
    >
      {/* ── Background layers ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Purple glow left */}
        <div className="absolute rounded-full" style={{ width: '60vw', height: '60vw', top: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        {/* Orange glow right */}
        <div className="absolute rounded-full" style={{ width: '40vw', height: '40vw', bottom: '-5%', left: '-5%', background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        {/* Pink mid */}
        <div className="absolute rounded-full" style={{ width: '30vw', height: '30vw', top: '50%', left: '40%', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.6) 1px, transparent 1px), linear-gradient(90deg,rgba(139,92,246,0.6) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
        {/* Orbital ring */}
        <div className="absolute rounded-full border" style={{ width: '70vw', height: '70vw', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', borderColor: 'rgba(139,92,246,0.06)', animation: 'spin-slow 40s linear infinite' }} />
        <div className="absolute rounded-full border" style={{ width: '85vw', height: '85vw', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', borderColor: 'rgba(236,72,153,0.04)', animation: 'spin-slow 60s linear infinite reverse' }} />
      </div>

      {/* ── Floating Icons ── */}
      {floatingIcons.map((f, i) => (
        <motion.div
          key={i}
          className="fixed z-10 flex items-center justify-center rounded-2xl pointer-events-none"
          style={{ left: f.x, top: f.y, width: f.size, height: f.size, background: `${f.color}20`, border: `1px solid ${f.color}35`, backdropFilter: 'blur(12px)', boxShadow: `0 0 30px ${f.color}25`, fontSize: f.size * 0.45 }}
          animate={{ y: [0, -14, 0] }}
          transition={{ repeat: Infinity, duration: 4 + i * 0.8, delay: f.delay, ease: 'easeInOut' }}
        >
          {f.icon}
        </motion.div>
      ))}

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-14 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', background: 'rgba(7,7,26,0.5)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)' }}>🎮</div>
          <span className="font-black text-xl tracking-tight text-white">الغُريف</span>
        </div>
        <div className="hidden lg:flex items-center gap-7 text-sm text-white/30">
          {['الرئيسية','الألعاب','التحديات','لوحة المتصدرين','المهام اليومية','المتجر'].map(l => (
            <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white border border-white/8 hover:border-white/20 transition-all flex items-center gap-2">
            <span>الوضع الداكن</span><span>🌙</span>
          </button>
          <Link href="/auth/register" className="px-5 py-2 rounded-xl text-sm font-bold border border-white/10 hover:border-white/25 hover:bg-white/5 text-white/70 hover:text-white transition-all flex items-center gap-2">
            <span>إنشاء حساب</span><span>➕</span>
          </Link>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 250 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl text-4xl mb-5 mx-auto"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6,#EC4899)', boxShadow: '0 12px 40px rgba(139,92,246,0.5)' }}
            >
              🎯
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">الغُريف</h1>
            <p className="text-sm text-white/35">سجّل دخولك للمتابعة</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-7 border" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            <Suspense fallback={
              <div className="flex justify-center py-12">
                <span className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <LoginForm />
            </Suspense>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-white/30 mt-6">
            ليس لديك حساب؟{' '}
            <Link href="/auth/register" className="font-bold transition-colors" style={{ color: '#A78BFA' }}>
              إنشاء حساب جديد ←
            </Link>
          </p>
        </motion.div>

        {/* ── Trust Badges ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-2xl mt-10 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {trustBadges.map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border text-center" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="text-xl">{b.icon}</span>
              <span className="text-xs font-bold text-white/70">{b.label}</span>
              <span className="text-[10px] text-white/25 leading-tight">{b.sub}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap');
        @keyframes spin-slow { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
      `}</style>
    </div>
  )
}
