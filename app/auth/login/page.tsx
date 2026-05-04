'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'react-hot-toast'
import { useFeedbackStore } from '@/store/feedbackStore'

// ── Components ──
const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  const { logoUrl } = useFeedbackStore()
  return logoUrl ? (
    <img src={logoUrl} alt="Logo" className={`${className} object-contain`} />
  ) : (
    <div className={`${className} rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-white`}>A</div>
  )
}

const LiveBackground = ({ accentColor }: { accentColor: string }) => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 15, repeat: Infinity }}
      className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[140px]"
      style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }} />
    <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 18, repeat: Infinity }}
      className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px]"
      style={{ background: `radial-gradient(circle, #EC4899 0%, transparent 70%)` }} />
  </div>
)

const SmartInput = ({ label, value, onChange, type = 'text', placeholder, showToggle, toggleAction }: any) => (
  <div className="relative group">
    <div className="flex items-center justify-between mb-1.5 px-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-white/20 group-focus-within:text-white/40 transition-colors">{label}</label>
    </div>
    <div className="relative">
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-white/[0.03] border border-white/8 rounded-2xl px-6 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
        style={{ direction: 'ltr' }} />
      {showToggle && (
        <button type="button" onClick={toggleAction} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all z-20">
          {showToggle}
        </button>
      )}
    </div>
  </div>
)

export default function LoginPage() {
  const router = useRouter()
  const { accentColor } = useFeedbackStore()
  
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('مرحباً بك مجدداً! 👋')
    setTimeout(() => router.push('/dashboard'), 1000)
  }

  return (
    <div className="h-screen w-full bg-[#050510] text-white flex flex-col relative overflow-hidden"
      style={{ direction: 'rtl', fontFamily: "'Cairo', sans-serif" }}>
      
      <LiveBackground accentColor={accentColor} />

      <nav className="relative z-50 flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="text-xl font-black tracking-tight">العُريف</span>
        </div>
        <Link href="/auth/register" className="px-6 py-2 rounded-xl text-xs font-bold text-white/40 border border-white/10 hover:text-white hover:bg-white/5 transition-all">إنشاء حساب جديد</Link>
      </nav>

      <div className="relative z-40 flex-1 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black mb-2 tracking-tight">مرحباً بك مجدداً</h1>
            <p className="text-white/20 text-sm font-medium">سجل دخولك لمتابعة مغامرتك</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <SmartInput label="البريد الإلكتروني" value={email} onChange={(e:any) => setEmail(e.target.value)} placeholder="name@example.com" />
            <SmartInput label="كلمة المرور" value={password} onChange={(e:any) => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="••••••••" showToggle={showPw ? '🙈' : '👁️'} toggleAction={() => setShowPw(!showPw)} />
            
            <div className="flex items-center justify-end">
              <button type="button" className="text-xs font-bold text-white/20 hover:text-white transition-colors">نسيت كلمة المرور؟</button>
            </div>

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.96 }}
              className="w-full py-4.5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group"
              style={{ background: `linear-gradient(135deg,${accentColor},#EC4899)`, opacity: loading ? 0.8 : 1 }}>
              {loading ? (
                <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="relative z-10">تسجيل الدخول</span>
              )}
            </motion.button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/20">ليس لديك حساب؟ <Link href="/auth/register" className="text-purple-400 font-black hover:underline">اشترك الآن</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}