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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent]   = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
      setGoogleLoading(false)
    }
    // If no error, browser will redirect — no need to setLoading(false)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail) return
    setResetLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    if (error) {
      toast.error(error.message)
    } else {
      setResetSent(true)
    }
    setResetLoading(false)
  }

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

          <form onSubmit={handleLogin} className="space-y-5">
            <SmartInput label={t('auth_email')} value={email} onChange={(e:any) => setEmail(e.target.value)} placeholder="name@example.com" theme={theme} />
            <SmartInput label={t('auth_password')} value={password} onChange={(e:any) => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="••••••••" showToggle={showPw ? '🙈' : '👁️'} toggleAction={() => setShowPw(!showPw)} theme={theme} />
            
            <div className="flex items-center justify-end">
              <button type="button" onClick={() => setShowReset(true)} className={`text-xs font-bold transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-900' : 'text-white/20 hover:text-white'}`}>
                {t('auth_forgot')}
              </button>
            </div>

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.96 }}
              className="w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group"
              style={{ background: `linear-gradient(135deg,${accentColor},#EC4899)`, opacity: loading ? 0.8 : 1 }}>
              {loading ? (
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="relative z-10 text-white">{t('auth_login_btn')}</span>
              )}
            </motion.button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className={`flex-1 h-px ${theme === 'light' ? 'bg-slate-200' : 'bg-white/8'}`} />
            <span className={`text-xs font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`}>{t('auth_or_divider')}</span>
            <div className={`flex-1 h-px ${theme === 'light' ? 'bg-slate-200' : 'bg-white/8'}`} />
          </div>

          {/* Google Sign-In */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all border ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                : 'bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.07]'
            }`}>
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {t('auth_google')}
          </motion.button>

          <div className={`mt-8 pt-7 border-t text-center ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
              {t('auth_no_account')}{' '}
              <Link href="/auth/register" className="font-black hover:underline" style={{ color: accentColor }}>
                {t('auth_register_btn')}
              </Link>
            </p>
            <p className="mt-2">
              <Link href="/legal/terms" className={`text-[10px] font-bold uppercase tracking-widest hover:underline transition-colors ${ theme === 'light' ? 'text-slate-300' : 'text-white/15' }`}>
                {t('legal_terms_title')}
              </Link>
              <span className={`mx-2 text-[10px] ${theme === 'light' ? 'text-slate-200' : 'text-white/10'}`}>·</span>
              <Link href="/legal/privacy" className={`text-[10px] font-bold uppercase tracking-widest hover:underline transition-colors ${ theme === 'light' ? 'text-slate-300' : 'text-white/15' }`}>
                {t('legal_privacy_title')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Forgot Password Modal ── */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(3,3,8,0.7)' }}
            onClick={() => { if (!resetLoading) { setShowReset(false); setResetSent(false) } }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-sm rounded-[32px] p-8 border ${
                theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#0d0d20] border-white/10'
              }`}
            >
              {resetSent ? (
                <div className="text-center">
                  <div className="text-5xl mb-4">📬</div>
                  <h2 className={`text-xl font-black mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t('auth_reset_sent')}</h2>
                  <button onClick={() => { setShowReset(false); setResetSent(false) }}
                    className="mt-6 text-sm font-bold" style={{ color: accentColor }}>
                    {t('auth_back_login')}
                  </button>
                </div>
              ) : (
                <>
                  <h2 className={`text-xl font-black mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t('auth_reset_title')}</h2>
                  <p className={`text-sm mb-6 ${theme === 'light' ? 'text-slate-400' : 'text-white/30'}`}>{t('auth_reset_sub')}</p>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <SmartInput label={t('auth_email')} value={resetEmail} onChange={(e:any) => setResetEmail(e.target.value)} placeholder="name@example.com" theme={theme} />
                    <motion.button type="submit" disabled={resetLoading} whileTap={{ scale: 0.97 }}
                      className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all flex items-center justify-center gap-2"
                      style={{ background: `linear-gradient(135deg,${accentColor},#EC4899)`, opacity: resetLoading ? 0.7 : 1 }}>
                      {resetLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('auth_reset_btn')}
                    </motion.button>
                  </form>
                  <button onClick={() => setShowReset(false)} className={`mt-4 w-full text-center text-xs font-bold ${ theme === 'light' ? 'text-slate-400' : 'text-white/20' }`}>
                    {t('auth_back_login')}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}