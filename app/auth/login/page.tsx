'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'react-hot-toast'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'

// ── Components ──
const Logo = ({ className = "w-10 h-10" }: { className?: string }) => {
  const { logoUrl } = useFeedbackStore()
  return logoUrl ? (
    <img src={logoUrl} alt="Logo" className={`${className} object-contain`} />
  ) : (
    <div className={`${className} rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-base`}>
      ع
    </div>
  )
}

const LiveBackground = ({ accentColor, theme }: { accentColor: string; theme: 'light' | 'dark' }) => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
    <div className={`absolute inset-0 transition-colors duration-700 ${theme === 'light' ? 'bg-slate-50' : 'bg-[#06061a]'}`} />
    
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: theme === 'light' ? [0.05, 0.1, 0.05] : [0.1, 0.15, 0.1] }} transition={{ duration: 15, repeat: Infinity }}
      className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[140px]"
      style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }} />
    
    <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: theme === 'light' ? [0.03, 0.07, 0.03] : [0.05, 0.1, 0.05] }} transition={{ duration: 18, repeat: Infinity }}
      className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px]"
      style={{ background: `radial-gradient(circle, #EC4899 0%, transparent 70%)` }} />
  </div>
)

const SmartInput = ({ label, value, onChange, type = 'text', placeholder, showToggle, toggleAction, theme }: any) => (
  <div className="relative group">
    <div className="flex items-center justify-between mb-2 px-1">
      <label className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${theme === 'light' ? 'text-slate-400 group-focus-within:text-slate-900' : 'text-white/20 group-focus-within:text-white/40'}`}>
        {label}
      </label>
    </div>
    <div className="relative">
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full border rounded-2xl px-6 py-4 text-sm font-bold transition-all duration-300 outline-none ${
          theme === 'light' 
            ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-slate-400 focus:shadow-[0_10px_30px_rgba(0,0,0,0.03)]' 
            : 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/15 focus:border-white/20 focus:bg-white/[0.05]'
        }`}
        style={{ direction: 'ltr' }} />
      {showToggle && (
        <button type="button" onClick={toggleAction} className={`absolute right-5 top-1/2 -translate-y-1/2 transition-all z-20 ${theme === 'light' ? 'text-slate-300 hover:text-slate-900' : 'text-white/20 hover:text-white'}`}>
          {showToggle}
        </button>
      )}
    </div>
  </div>
)

export default function LoginPage() {
  const router = useRouter()
  const { accentColor, themeMode, lang } = useFeedbackStore()
  const theme = themeMode === 'light' ? 'light' : 'dark'
  const dir   = lang === 'AR' ? 'rtl' : 'ltr'
  const t = useTranslator()
  
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

    toast.success(lang === 'AR' ? 'مرحباً بك مجدداً! 👋' : 'Welcome back! 👋')
    setTimeout(() => router.push('/dashboard'), 1000)
  }

  return (
    <div className={`min-h-screen w-full flex flex-col relative transition-colors duration-500 ${theme === 'dark' ? 'bg-[#06061a] text-white' : 'bg-slate-50 text-slate-900'}`}
      style={{ direction: dir, fontFamily: lang === 'AR' ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}>
      
      <LiveBackground accentColor={accentColor} theme={theme} />

      <nav className="relative z-50 flex items-center justify-between px-8 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className={`text-xl font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            {lang === 'AR' ? 'العُريف' : 'Al-Arif'}
          </span>
        </div>
        <Link href="/auth/register" className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
          theme === 'light' 
            ? 'text-slate-400 border-slate-200 hover:text-slate-900 hover:bg-slate-100' 
            : 'text-white/40 border-white/10 hover:text-white hover:bg-white/5'
        }`}>
          {t('auth_register_btn')}
        </Link>
      </nav>

      <div className="relative z-40 flex-1 flex items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md backdrop-blur-3xl border rounded-[40px] p-10 md:p-12 transition-all duration-500 ${
            theme === 'light' 
              ? 'bg-white/70 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.05)]' 
              : 'bg-white/[0.02] border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)]'
          }`}>
          
          <div className="text-center mb-10">
            <h1 className={`text-3xl font-black mb-2 tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {t('auth_login_title')}
            </h1>
            <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
              {t('auth_login_sub')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <SmartInput label={t('auth_email')} value={email} onChange={(e:any) => setEmail(e.target.value)} placeholder="name@example.com" theme={theme} />
            <SmartInput label={t('auth_password')} value={password} onChange={(e:any) => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="••••••••" showToggle={showPw ? '🙈' : '👁️'} toggleAction={() => setShowPw(!showPw)} theme={theme} />
            
            <div className="flex items-center justify-end">
              <button type="button" className={`text-xs font-bold transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-900' : 'text-white/20 hover:text-white'}`}>
                {t('auth_forgot')}
              </button>
            </div>

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.96 }}
              className="w-full py-4.5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group"
              style={{ background: `linear-gradient(135deg,${accentColor},#EC4899)`, opacity: loading ? 0.8 : 1 }}>
              {loading ? (
                <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="relative z-10 text-white">{t('auth_login_btn')}</span>
              )}
            </motion.button>
          </form>

          <div className={`mt-10 pt-8 border-t text-center ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
              {t('auth_no_account')} {' '}
              <Link href="/auth/register" className="text-purple-500 font-black hover:underline" style={{ color: accentColor }}>
                {t('auth_register_btn')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}