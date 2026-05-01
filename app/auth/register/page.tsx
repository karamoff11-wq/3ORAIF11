'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

const inputBase = {
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

const floatingIcons = [
  { icon: '🎯', x: '7%',  y: '22%', color: '#8B5CF6', size: 62, delay: 0   },
  { icon: '🛡️', x: '5%',  y: '62%', color: '#3B82F6', size: 58, delay: 0.6 },
  { icon: '🏆', x: '89%', y: '18%', color: '#F59E0B', size: 66, delay: 0.3 },
  { icon: '⭐', x: '91%', y: '58%', color: '#EC4899', size: 60, delay: 0.9 },
]

const trustBadges = [
  { icon: '🔒', label: 'تشفير كامل',   sub: 'بياناتك آمنة 100%' },
  { icon: '⚡', label: 'إعداد سريع',   sub: 'ابدأ في ثوانٍ' },
  { icon: '🎁', label: 'مجاني دائماً', sub: 'لا بطاقة ائتمان' },
  { icon: '🌍', label: 'مجتمع كبير',  sub: 'آلاف اللاعبين' },
]

function PasswordStrength({ password }: { password: string }) {
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const labels = ['', 'ضعيفة', 'جيدة', 'قوية']
  const colors = ['', '#EF4444', '#F59E0B', '#10B981']
  if (!password) return null
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex gap-1 flex-1">
        {[1,2,3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= strength ? colors[strength] : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      <span className="text-xs font-bold transition-colors" style={{ color: colors[strength] }}>{labels[strength]}</span>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showCf, setShowCf]     = useState(false)
  const [agreed, setAgreed]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  const passwordMatch = confirm.length > 0 && password === confirm

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error('كلمتا المرور غير متطابقتين ❌'); return }
    if (password.length < 6)  { toast.error('كلمة المرور قصيرة جداً — 6 أحرف على الأقل'); return }
    if (!agreed) { toast.error('يجب الموافقة على الشروط للمتابعة'); return }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      toast.error(error.message.includes('Database error') ? 'خطأ في قاعدة البيانات — تأكد من تطبيق schema.sql' : error.message)
      setLoading(false); return
    }

    if (data.user) {
      await (supabase.from('profiles') as any).upsert({
        id: data.user.id, email: data.user.email, role: 'user', free_sessions_used: false
      }, { onConflict: 'id' })
    }

    setSuccess(true)
    toast.success('تم إنشاء الحساب! مرحباً بك في الغُريف 🎉')
    setTimeout(() => { router.push('/dashboard'); router.refresh() }, 1200)
  }

  const focusStyle = (active: boolean) => active
    ? { border: '1px solid rgba(139,92,246,0.6)', boxShadow: '0 0 0 4px rgba(139,92,246,0.12)' }
    : { border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }

  const [focused, setFocused] = useState<string | null>(null)

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: '#07071A', direction: 'rtl', fontFamily: "'Cairo','Tajawal',sans-serif" }}>

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute rounded-full" style={{ width: '65vw', height: '65vw', top: '-15%', right: '-10%', background: 'radial-gradient(circle,rgba(139,92,246,0.22) 0%,transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute rounded-full" style={{ width: '45vw', height: '45vw', bottom: '-8%', left: '-8%', background: 'radial-gradient(circle,rgba(245,158,11,0.18) 0%,transparent 65%)', filter: 'blur(70px)' }} />
        <div className="absolute rounded-full" style={{ width: '35vw', height: '35vw', top: '45%', left: '35%', background: 'radial-gradient(circle,rgba(236,72,153,0.1) 0%,transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute inset-0 opacity-[0.022]" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.7) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="absolute rounded-full border" style={{ width: '72vw', height: '72vw', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', borderColor: 'rgba(139,92,246,0.05)', animation: 'spin-slow 45s linear infinite' }} />
        <div className="absolute rounded-full border" style={{ width: '88vw', height: '88vw', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', borderColor: 'rgba(236,72,153,0.04)', animation: 'spin-slow 65s linear infinite reverse' }} />
      </div>

      {/* ── Floating icons ── */}
      {floatingIcons.map((f, i) => (
        <motion.div key={i} className="fixed z-10 pointer-events-none flex items-center justify-center rounded-2xl"
          style={{ left: f.x, top: f.y, width: f.size, height: f.size, background: `${f.color}20`, border: `1px solid ${f.color}35`, backdropFilter: 'blur(12px)', boxShadow: `0 0 28px ${f.color}20`, fontSize: f.size * 0.44 }}
          animate={{ y: [0, -14, 0] }}
          transition={{ repeat: Infinity, duration: 4 + i * 0.7, delay: f.delay, ease: 'easeInOut' }}>
          {f.icon}
        </motion.div>
      ))}

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-14 py-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', background: 'rgba(7,7,26,0.5)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)' }}>🎮</div>
          <span className="font-black text-xl tracking-tight text-white">الغُريف</span>
        </div>
        <div className="hidden lg:flex items-center gap-7 text-sm text-white/30">
          {['الرئيسية','الألعاب','التحديات','لوحة المتصدرين','المتجر'].map(l => (
            <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white border border-white/8 hover:border-white/20 transition-all flex items-center gap-2">
            <span>تسجيل الدخول</span><span>🔑</span>
          </Link>
          <Link href="/auth/register" className="px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', boxShadow: '0 4px 18px rgba(139,92,246,0.4)' }}>
            <span>إنشاء حساب</span><span>➕</span>
          </Link>
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-7">
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 250 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl text-4xl mb-4 mx-auto"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6,#EC4899)', boxShadow: '0 12px 40px rgba(139,92,246,0.5)' }}>
              🎮
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1">إنشاء حساب جديد</h1>
            <p className="text-sm text-white/35">ابدأ رحلتك مع الغُريف مجاناً اليوم</p>
          </div>

          {/* Success overlay */}
          {success && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12 rounded-3xl border mb-4"
              style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }}>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-black text-white mb-2">مرحباً بك!</h2>
              <p className="text-white/50">تم إنشاء حسابك بنجاح. جاري التحويل...</p>
            </motion.div>
          )}

          {/* Card */}
          {!success && (
            <div className="rounded-3xl p-7 border"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06)' }}>

              <form onSubmit={handleRegister} className="space-y-4">

                {/* Email */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">البريد الإلكتروني</label>
                    <span className="text-white/20 text-sm">✉️</span>
                  </div>
                  <input id="reg-email" type="email" placeholder="example@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                    style={{ ...inputBase, ...focusStyle(focused === 'email') }}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">كلمة المرور</label>
                    <span className="text-white/20 text-sm">🔒</span>
                  </div>
                  <div className="relative">
                    <input id="reg-password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)} required
                      style={{ ...inputBase, paddingLeft: 48, ...focusStyle(focused === 'pw') }}
                      onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)} />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-sm">
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                {/* Confirm */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">تأكيد كلمة المرور</label>
                    {confirm.length > 0 && (
                      <span className="text-sm">{passwordMatch ? '✅' : '❌'}</span>
                    )}
                  </div>
                  <div className="relative">
                    <input id="reg-confirm" type={showCf ? 'text' : 'password'} placeholder="••••••••"
                      value={confirm} onChange={e => setConfirm(e.target.value)} required
                      style={{
                        ...inputBase, paddingLeft: 48,
                        border: confirm.length > 0
                          ? passwordMatch ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(239,68,68,0.5)'
                          : focusStyle(focused === 'cf').border,
                        boxShadow: focusStyle(focused === 'cf').boxShadow
                      }}
                      onFocus={() => setFocused('cf')} onBlur={() => setFocused(null)} />
                    <button type="button" onClick={() => setShowCf(p => !p)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-sm">
                      {showCf ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {confirm.length > 0 && !passwordMatch && (
                    <p className="text-xs mt-1.5" style={{ color: '#F87171' }}>كلمتا المرور غير متطابقتين</p>
                  )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 pt-1">
                  <div onClick={() => setAgreed(a => !a)}
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all"
                    style={{ background: agreed ? 'linear-gradient(135deg,#8B5CF6,#EC4899)' : 'rgba(255,255,255,0.06)', border: agreed ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                    {agreed && <span className="text-xs text-white">✓</span>}
                  </div>
                  <p className="text-xs text-white/35 leading-relaxed">
                    بإنشاء الحساب، أنت توافق على{' '}
                    <a href="#" className="text-purple-400 hover:text-purple-300">شروط الاستخدام</a>
                    {' '}و{' '}
                    <a href="#" className="text-purple-400 hover:text-purple-300">سياسة الخصوصية</a>
                  </p>
                </div>

                {/* Submit */}
                <motion.button type="submit" id="register-submit-btn" disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 mt-2"
                  style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', boxShadow: '0 8px 32px rgba(139,92,246,0.45)', opacity: loading ? 0.75 : 1 }}>
                  {loading ? (
                    <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>جاري الإنشاء...</span></>
                  ) : (
                    <><span>إنشاء حساب مجاني</span><span>🚀</span></>
                  )}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-xs text-white/20 font-mono tracking-widest">أو سجّل باستخدام</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Social */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'جوجل',    icon: '🌐' },
                    { label: 'أبل',     icon: '🍎' },
                    { label: 'فيسبوك', icon: '📘' },
                  ].map(s => (
                    <button key={s.label} type="button"
                      className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.04] hover:-translate-y-0.5"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)' }}>
                      <span>{s.icon}</span><span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </form>
            </div>
          )}

          {/* Login link */}
          {!success && (
            <p className="text-center text-sm text-white/30 mt-6">
              لديك حساب بالفعل؟{' '}
              <Link href="/auth/login" className="font-bold transition-colors" style={{ color: '#A78BFA' }}>
                سجّل دخولك ←
              </Link>
            </p>
          )}
        </motion.div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="w-full max-w-2xl mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {trustBadges.map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border text-center"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
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
