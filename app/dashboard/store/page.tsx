'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useTranslator } from '@/lib/i18n'
import { useFeedbackStore } from '@/store/feedbackStore'
// SVG ICONS — consistent with dashboard
const Icon = {
  Gift: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  ShoppingBag: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Zap: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Flame: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  Crown: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    </svg>
  ),
  PlusCircle: ({ size = 24, style, className }: { size?: number, style?: any, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
}

export default function StorePage() {
  const router = useRouter()
  const supabase = createClient()
  const { lang } = useFeedbackStore()
  const t = useTranslator()
  const isRtl = lang === 'AR'
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [redeemCode, setRedeemCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [creditsAdded, setCreditsAdded] = useState(0)

  useEffect(() => {
    setMounted(true)
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    }
    load()
  }, [])

  const handleRedeem = async () => {
    if (!redeemCode || !profile) return
    setRedeeming(true)
    
    // Simulate redeem logic
    // In production: await supabase.rpc('redeem_gift_code', { code: redeemCode, user_id: profile.id })
    await new Promise(r => setTimeout(r, 1500))
    
    setCreditsAdded(10) // Example
    setShowSuccess(true)
    setRedeeming(false)
    setRedeemCode('')
  }

  if (!mounted) return null

  const goldGradient = 'linear-gradient(135deg, #D4AF37 0%, #F5D142 50%, #B8860B 100%)'
  const accentColor = '#D4AF37'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      {/* ── Store Specific Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle Gold Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, ${accentColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${accentColor} 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
            maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
          }}
        />
        
        {/* Golden Bokeh Blobs */}
        <motion.div
          animate={{ 
            x: [0, 40, -20, 0], 
            y: [0, 50, -30, 0],
            scale: [1, 1.1, 0.9, 1],
            opacity: [0.05, 0.08, 0.05]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`, filter: 'blur(120px)' }}
        />
        
        <motion.div
          animate={{ 
            x: [0, -30, 40, 0], 
            y: [0, -40, 60, 0],
            scale: [1, 0.85, 1.1, 1],
            opacity: [0.03, 0.06, 0.03]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-15%] right-[-5%] w-[60%] h-[60%] rounded-full"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`, filter: 'blur(120px)' }}
        />

        {/* Deep Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505] opacity-80" />
      </div>

      <div className={`relative z-10 p-6 md:p-12 space-y-12 max-w-6xl mx-auto pb-32 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Cinematic Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-md p-10 rounded-[3rem] text-center relative overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10"
              style={{ background: 'var(--bg-card)' }}
            >
              <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 50% 50%, ${accentColor}, transparent)` }} />
              
              <div className="relative z-10 space-y-6">
                <motion.div 
                  initial={{ rotate: -20, scale: 0 }} 
                  animate={{ rotate: 0, scale: 1 }}
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl"
                  style={{ background: goldGradient }}
                >
                  ✨
                </motion.div>
                <h2 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                  {isRtl ? 'تم تفعيل الهدية!' : 'Gift Activated!'}
                </h2>
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {isRtl ? 'مبروك! تمت إضافة ' : 'Congratulations! '}
                  <span className="font-black text-xl" style={{ color: accentColor }}>{creditsAdded}</span>
                  {isRtl ? ' جلسة جديدة إلى رصيدك.' : ' new sessions added to your balance.'}
                </p>
                <button 
                  onClick={() => setShowSuccess(false)}
                  className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-white text-black transition-transform hover:scale-105 active:scale-95"
                >
                  {isRtl ? 'استمر في اللعب' : 'Continue Playing'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-black tracking-tighter"
          style={{ color: 'var(--text-primary)' }}
        >
          {isRtl ? 'رواق ' : 'The '}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: goldGradient }}>
            {isRtl ? 'العُريف' : 'Al-Arif Gallery'}
          </span>
        </motion.h1>
        <p className="font-medium tracking-wide max-w-xl" style={{ color: 'var(--text-secondary)' }}>
          {isRtl ? 'عالم من الهدايا والفرص. ارفع من مستوى تجربتك وشارك المتعة مع أصدقائك.' : 'A world of gifts and opportunities. Elevate your experience and share the fun with friends.'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* Section 1: Redeem Code */}
        <motion.div 
          initial={{ opacity: 0, x: isRtl ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 p-8 rounded-[2.5rem] border border-white/5 space-y-6 relative overflow-hidden flex flex-col justify-between"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: `${accentColor}15`, color: accentColor }}>
                <Icon.Gift />
              </div>
              <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                {isRtl ? 'تفعيل رمز' : 'Redeem Code'}
              </h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {isRtl ? 'أدخل الرمز الفريد الذي حصلت عليه لتعبئة رصيد جلساتك فوراً.' : 'Enter the unique code you received to top up your sessions immediately.'}
            </p>
            <input 
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="AR-XXXX-XXXX"
              className="w-full bg-white/5 border rounded-2xl px-6 py-4 font-black tracking-widest text-center focus:outline-none transition-all"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          <button 
            disabled={!redeemCode || redeeming}
            onClick={handleRedeem}
            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-white text-black transition-all hover:bg-[#D4AF37] disabled:opacity-20"
          >
            {redeeming ? (isRtl ? 'جاري التحقق...' : 'Verifying...') : (isRtl ? 'تفعيل الرمز' : 'Redeem Now')}
          </button>
        </motion.div>

        {/* Section 2: Studio Access — ELITE BOUTIQUE DESIGN */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-[3.5rem] relative overflow-hidden group border border-[#D4AF37]/20 shadow-2xl"
          style={{ background: 'linear-gradient(165deg, rgba(20,20,20,1) 0%, rgba(10,10,10,1) 100%)' }}
        >
          {/* Shimmering Silk Ribbon (Thin & Elegant) */}
          <div className="absolute top-0 left-[15%] w-[1px] h-full bg-gradient-to-b from-transparent via-[#D4AF37]/40 to-transparent z-0" />
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent z-0" />
          
          {/* Interactive Aura */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-1000" style={{ background: goldGradient }} />
          
          <div className="relative z-10 p-12 flex flex-col lg:flex-row items-center gap-16">
            
            <div className="flex-1 space-y-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                    {isRtl ? 'إصدار النخبة' : 'Elite Boutique Edition'}
                  </span>
                </div>
                
                <h2 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                  {isRtl ? 'رواق ' : 'The '} <br/> 
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: goldGradient }}>
                    {isRtl ? 'الإبداع اللانهائي' : 'Infinite Studio'}
                  </span>
                </h2>
                
                <p className="text-lg font-medium leading-relaxed opacity-40 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isRtl ? 'رخصة دائمة تمنحك السيادة الكاملة على محتواك. صمم، شارك، وخلد أجمل اللحظات بلمسة ذهبية.' : 'A permanent license granting full sovereignty over your content. Design, share, and immortalize your moments with a golden touch.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <button 
                  onClick={() => router.push('/dashboard/studio')}
                  className="group/btn relative px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest overflow-hidden transition-all active:scale-95"
                >
                  <div className="absolute inset-0 bg-white transition-transform group-hover/btn:scale-110" />
                  <span className="relative z-10 text-black">{isRtl ? 'دخول الاستوديو' : 'Enter Studio'}</span>
                </button>
                
                <button 
                  className="group/gift relative px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 hover:border-[#D4AF37] transition-all overflow-hidden"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <div className="absolute inset-0 bg-[#D4AF37]/0 group-hover/gift:bg-[#D4AF37]/10 transition-colors" />
                  <span className="relative z-10">{isRtl ? 'إهداء الرخصة' : 'Gift this License'}</span>
                </button>
              </div>
            </div>

            {/* The "VIP Invite" Style Icon */}
            <div className="relative">
               {/* Minimalist Floating Tag */}
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                 className="absolute -top-6 -right-6 z-20 px-6 py-3 bg-black rounded-2xl border border-[#D4AF37]/50 shadow-2xl flex items-center gap-3"
               >
                 <span className="text-xs font-black text-[#D4AF37]">$4.99</span>
                 <div className="w-[1px] h-4 bg-white/10" />
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">VIP</span>
               </motion.div>

               <div className="w-72 h-72 rounded-[3.5rem] border border-[#D4AF37]/30 flex items-center justify-center relative overflow-hidden backdrop-blur-3xl group-hover:border-[#D4AF37]/60 transition-all duration-700 bg-white/5">
                 <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity" style={{ background: goldGradient }} />
                 
                 <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-1000">
                   <div className="absolute inset-0 blur-3xl bg-[#D4AF37]/20 rounded-full" />
                   <Icon.PlusCircle size={120} style={{ color: accentColor }} className="relative z-10" />
                 </div>
                 
                 {/* Decorative fine lines */}
                 <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-[#D4AF37]/40" />
                    <div className="absolute top-8 right-8 w-4 h-4 border-t border-r border-[#D4AF37]/40" />
                    <div className="absolute bottom-8 left-8 w-4 h-4 border-b border-l border-[#D4AF37]/40" />
                    <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-[#D4AF37]/40" />
                 </div>
               </div>
            </div>

          </div>
        </motion.div>

      </div>

      {/* Section 3: Gifting Bundles */}
      <section className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-2xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: accentColor }}><Icon.ShoppingBag /></span>
            {isRtl ? 'باقات الهدايا' : 'Gift Bundles'}
          </h3>
          <p className="text-sm font-medium opacity-40 max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {isRtl 
              ? 'أهدِ المعرفة والمرح! اشترِ رموز هدايا فريدة وشاركها مع أصدقائك أو عائلتك. يمكن استخدام هذه الرموز لتعبئة الرصيد فوراً وبدء تحديات جديدة لا تُنسى.' 
              : 'Give the gift of knowledge! Purchase unique gift codes and share them with friends or family. These codes can be redeemed instantly to start new, unforgettable trivia battles.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { credits: 1, price: '$1.99', popular: false, icon: <Icon.Zap /> },
            { credits: 5, price: '$9.99', popular: true, icon: <Icon.Flame /> },
            { credits: 10, price: '$19.99', popular: false, icon: <Icon.Crown /> },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] border relative group overflow-hidden flex flex-col justify-between h-80"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              {item.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-lg text-[9px] font-black bg-[#D4AF37] text-black">
                  {isRtl ? 'الأكثر طلباً' : 'Most Popular'}
                </div>
              )}
              <div className="space-y-4">
                 <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110" style={{ background: 'rgba(255,255,255,0.03)', color: item.popular ? accentColor : 'var(--text-primary)' }}>
                   {item.icon}
                 </div>
                 <div>
                   <h4 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {item.credits} {isRtl ? 'جلسات' : 'Sessions'}
                   </h4>
                   <p className="text-[10px] uppercase tracking-widest mt-1 opacity-40" style={{ color: 'var(--text-primary)' }}>
                    {isRtl ? 'رمز هدية فريد' : 'Unique Gift Code'}
                   </p>
                 </div>
              </div>
              <button 
                className="w-full py-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-3"
                style={{ background: item.popular ? goldGradient : 'var(--bg-input)', color: item.popular ? 'black' : 'var(--text-primary)', border: item.popular ? 'none' : '1px solid var(--border-subtle)' }}
              >
                {isRtl ? 'شراء كهدية' : 'Buy as Gift'} - {item.price}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
    </div>
  )
}
