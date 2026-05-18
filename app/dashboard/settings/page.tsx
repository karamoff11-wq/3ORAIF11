'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useFeedbackStore, playSound } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'
import { Database } from '@/types/database'
type Profile = Database['public']['Tables']['profiles']['Row']
import { ensureAuthenticated } from '@/lib/testMode'
import { themesList } from '@/lib/themes'
import React from 'react'
import { CanvasText } from '@/components/CanvasText'
import { VortexDemoSecond } from '@/components/VortexDemoSecond'

// ─────────────────────────────────────────────
// REUSABLE HUD COMPONENTS (Moved outside for performance)
// ─────────────────────────────────────────────
const SmartHeader = React.memo(({ title, icon, isRtl, accentColor }: { title: string; icon: string; isRtl: boolean; accentColor: string }) => (
  <div className={`flex flex-col ${isRtl ? 'items-end text-right ml-auto w-fit' : 'items-start text-left w-full'} gap-3 mb-8 group/header`} dir={isRtl ? 'rtl' : 'ltr'}>
    <div className="flex items-center gap-4">
      <div className={`flex flex-col ${isRtl ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-3">
           <span className="text-xl filter drop-shadow-lg">{icon}</span>
           <h2 className="text-xl font-black tracking-tighter uppercase relative overflow-visible">
             <CanvasText text={title} colors={[accentColor, "#EC4899", "#8B5CF6", "#3B82F6", "#10B981"]} className="font-black" />
           </h2>
        </div>
      </div>
    </div>
    <div className={`relative ${isRtl ? 'w-48' : 'w-full'} min-w-[120px] h-px overflow-hidden`}>
      <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(${isRtl ? '270deg' : '90deg'}, ${accentColor} 0%, transparent 100%)` }} />
      <motion.div 
        className="absolute inset-y-0 w-64"
        animate={{ [isRtl ? 'right' : 'left']: ['-100%', '150%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 75%)`, opacity: 0.4 }}
      />
    </div>
  </div>
))

const SettingRow = React.memo(({ label, desc, children, isRtl }: { label: string; desc: string; children: React.ReactNode; isRtl: boolean }) => (
  <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[2rem] glass-card border border-white/5 hover:bg-white/[0.03] transition-all group ${isRtl ? 'text-right' : 'text-left'}`}>
    <div className="space-y-1">
      <p className="font-black text-white text-lg tracking-tight">{label}</p>
      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-relaxed max-w-md">{desc}</p>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
))

SmartHeader.displayName = 'SmartHeader'
SettingRow.displayName = 'SettingRow'

const SettingsBackground = React.memo(({ accentColor }: { accentColor: string }) => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <motion.div
      animate={{ x: [0, 50, -50, 0], y: [0, -50, 50, 0], scale: [1, 1.2, 0.9, 1] }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-40"
      style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }}
    />
    <motion.div
      animate={{ x: [0, -60, 40, 0], y: [0, 60, -40, 0], scale: [1, 0.9, 1.1, 1] }}
      transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
      className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-30"
      style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)' }}
    />
    <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay noise" />
  </div>
))
SettingsBackground.displayName = 'SettingsBackground'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { 
    accentColor, 
    lang, 
    setLang, 
    themeMode, 
    setThemeMode,
    isPlaying,
    setIsPlaying,
    mounted,
    specialTheme,
    setSpecialTheme,
    userName,
    setUserName,
    setUserAvatar,
    setUserAvatarColor,
    setUserAvatarType,
    equippedFrame,
    setEquippedFrame,
    soundEffectsEnabled,
    toggleSoundEffects,
  } = useFeedbackStore()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarBgColor, setAvatarBgColor] = useState<string>('#8B5CF6')
  const [avatarType, setAvatarType] = useState<'image' | 'color'>('image')
  
  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Validation state
  const [nameError, setNameError] = useState<string | null>(null)

  const isRtl = lang === 'AR'
  const dir = isRtl ? 'rtl' : 'ltr'
  const t = useTranslator()

  useEffect(() => {
    async function load() {
      const user = await ensureAuthenticated()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single()
      if (data) {
        const typedData = data as Record<string, unknown>
        setAvatarBgColor((typedData.avatar_bg_color as string) || '#8B5CF6')
        setAvatarType((typedData.avatar_type as 'image' | 'color') || (data.avatar_url ? 'image' : 'color'))
        
        // Sync to global store if empty
        if (!userName) setUserName(data.display_name || '')
      }
      setLoading(false)
    }
    load()
  }, [router, supabase, userName, setUserName])

  const handleSaveName = async () => {
    if (!profile || !displayName) return
    setSaving(true)
    setNameError(null)

    // Check uniqueness
    const { data: existing } = await (supabase.from('profiles') as any)
      .select('id')
      .eq('display_name', displayName)
      .neq('id', profile.id)
      .single()

    if (existing) {
      setNameError(isRtl ? 'هذا الاسم مستخدم بالفعل، اختر اسماً آخر.' : 'This name is already taken, choose another.')
      setSaving(false)
      return
    }

    const { error } = await (supabase.from('profiles') as any)
      .update({ display_name: displayName })
      .eq('id', profile.id)
    
    if (!error) {
       localStorage.setItem(`display_name_${profile.id}`, displayName)
       setUserName(displayName) // Update global store
    }
    setSaving(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setSaving(true)
    const fakeUrl = URL.createObjectURL(file)
    setAvatarUrl(fakeUrl)
    setAvatarType('image')
    
    await (supabase.from('profiles') as any)
      .update({ avatar_url: fakeUrl, avatar_type: 'image' })
      .eq('id', profile.id)
    
    setUserAvatar(fakeUrl)
    setUserAvatarType('image')

    setSaving(false)
  }

  const handleColorSelect = async (color: string) => {
    if (!profile) return
    setAvatarBgColor(color)
    setAvatarType('color')
    
    await (supabase.from('profiles') as any)
      .update({ avatar_bg_color: color, avatar_type: 'color' })
      .eq('id', profile.id)

    setUserAvatarColor(color)
    setUserAvatarType('color')
  }

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPassMessage({ type: 'error', text: isRtl ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' })
      return
    }
    if (newPassword.length < 6) {
      setPassMessage({ type: 'error', text: isRtl ? 'كلمة المرور قصيرة جداً' : 'Password is too short' })
      return
    }

    setPassLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    if (error) {
      setPassMessage({ type: 'error', text: error.message })
    } else {
      setPassMessage({ type: 'success', text: isRtl ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully' })
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPassMessage(null), 3000)
    }
    setPassLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (!mounted || loading) return null

  if (!mounted || loading) return null


  return (
    <div 
      className="min-h-screen pb-32 transition-colors duration-1000 relative overflow-hidden"
      style={{ direction: dir, background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* 1. Optimized Animated Vivid Background */}
      <SettingsBackground accentColor={accentColor} />

      {/* Cinematic Identity Header */}
      <div className="relative h-[45vh] overflow-hidden flex items-center justify-center z-10">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-primary)]" />
         <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           className="relative z-10 text-center space-y-6"
         >
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40 filter drop-shadow-2xl">
              {isRtl ? 'الإعدادات' : 'Settings'}
            </h1>
         </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-20 space-y-24">
        {/* Back Button */}
        <motion.button 
          whileHover={{ scale: 1.05, x: isRtl ? 5 : -5 }}
          onClick={() => router.push('/dashboard')}
          className="px-8 py-4 rounded-[1.5rem] bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all group"
        >
          <span className="group-hover:translate-x-[-4px] transition-transform">{isRtl ? '🏠' : '🏠'}</span>
          <span>{isRtl ? 'العودة للوحة القيادة' : 'Back to Dashboard'}</span>
        </motion.button>

        {/* Profile Section */}
        <div className="space-y-10">
          <SmartHeader title={isRtl ? 'الهوية الرقمية' : 'Digital Identity'} icon="🛡️" isRtl={isRtl} accentColor={accentColor} />
          <div className="p-1 rounded-[3.5rem] glass-card border border-white/5 overflow-hidden">
             <div className="p-10 md:p-14 space-y-12">
               <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
                  <div className="flex flex-col items-center gap-8 shrink-0">
                      <div className="relative group">
                         <motion.div 
                          whileHover={{ scale: 1.05 }}
                          onClick={() => avatarType === 'image' && fileInputRef.current?.click()}
                          className="w-48 h-48 rounded-[3.5rem] border-4 p-2 overflow-hidden transition-all duration-700 relative shadow-2xl cursor-pointer" 
                          style={{ borderColor: `${accentColor}40`, backgroundColor: avatarType === 'color' ? avatarBgColor : 'rgba(255,255,255,0.05)' }}
                         >
                            {avatarType === 'image' ? (
                              <img 
                                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email ?? 'user'}`} 
                                className="w-full h-full rounded-[3rem] object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-6xl font-black text-white/50">
                                {displayName.charAt(0).toUpperCase() || 'A'}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                               <span className="text-2xl">📸</span>
                               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                                {isRtl ? 'تغيير الصورة' : 'Change Photo'}
                               </span>
                            </div>
                         </motion.div>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      </div>
    
                      <div className="flex gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xl">
                        <button 
                          onClick={() => setAvatarType('image')}
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${avatarType === 'image' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white/60'}`}
                        >
                          {isRtl ? 'صورة' : 'Photo'}
                        </button>
                        <button 
                          onClick={() => setAvatarType('color')}
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${avatarType === 'color' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white/60'}`}
                        >
                          {isRtl ? 'لون' : 'Color'}
                        </button>
                      </div>

                      {avatarType === 'color' && (
                        <div className="grid grid-cols-4 gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                          {['#8B5CF6', '#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#E11D48', '#06b6d4', '#64748b'].map(color => (
                            <button
                              key={color}
                              onClick={() => handleColorSelect(color)}
                              className={`w-8 h-8 rounded-2xl border-2 transition-all hover:scale-125 ${avatarBgColor === color ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-40'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                  </div>
    
                  <div className="flex-1 space-y-10 w-full">
                     <div className="space-y-4">
                        <div className={`flex items-center justify-between px-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">
                            {isRtl ? 'الاسم التعريفي' : 'Display Name'}
                          </label>
                          <span className={`text-[10px] font-black ${displayName.length > 15 ? 'text-red-500' : 'text-white/20'}`}>
                            {displayName.length}/15
                          </span>
                        </div>
                        <div className="relative group">
                          <input 
                            value={displayName}
                            maxLength={15}
                            onChange={(e) => {
                              setDisplayName(e.target.value)
                              if (nameError) setNameError(null)
                            }}
                            className={`w-full bg-white/[0.03] border rounded-[2rem] px-10 py-6 font-black text-2xl focus:outline-none transition-all duration-500 shadow-2xl ${
                              nameError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-white/30 focus:bg-white/[0.06]'
                            }`}
                            placeholder={isRtl ? 'أدخل اسمك الجديد...' : 'Enter your name...'}
                          />
                          <div className={`absolute ${isRtl ? 'left-8' : 'right-8'} top-1/2 -translate-y-1/2`}>
                             {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (displayName.length > 3 && !nameError && <span className="text-green-500 text-xl">✓</span>)}
                          </div>
                        </div>
                        <AnimatePresence>
                          {nameError && (
                            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-[11px] font-black text-red-500 flex items-center gap-2 px-4">
                              <span>⚠️</span> {nameError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                     </div>
                     <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveName}
                      disabled={saving || !displayName || displayName.length < 3}
                      className="w-full py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] transition-all disabled:opacity-20 shadow-2xl group relative overflow-hidden"
                      style={{ background: accentColor, color: 'white' }}
                     >
                       <span className="relative z-10">{saving ? (isRtl ? 'جاري الحفظ...' : 'Syncing...') : (isRtl ? 'تحديث الهوية' : 'Sync Identity')}</span>
                       <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                     </motion.button>
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Special Themes Section */}
        <div className="space-y-10">
          <SmartHeader title={isRtl ? 'العوالم الخاصة' : 'Visual Environments'} icon="🌌" isRtl={isRtl} accentColor={accentColor} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {themesList.map((theme) => {
              const active = specialTheme === theme.id
              return (
                <motion.button
                  key={theme.id}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => setSpecialTheme(theme.id)}
                  className="relative h-56 rounded-[2.5rem] overflow-hidden border-2 transition-all flex flex-col items-center justify-center gap-4 p-6 group shadow-xl"
                  style={{ borderColor: active ? theme.colors.accent : 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-70 transition-opacity duration-700" style={{ background: theme.bgGradient || `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})` }} />
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/30 transition-colors z-1" />
                  
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <span className="text-5xl filter drop-shadow-2xl transition-transform duration-500 group-hover:scale-125">{theme.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">
                      {isRtl ? theme.shortNameAr : theme.shortName}
                    </span>
                  </div>

                  {active && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-2xl z-20">
                      <span className="text-black text-xs">✓</span>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
          
          {/* Contained Hero Showcase */}
          <VortexDemoSecond />
        </div>

        {/* Global Preferences */}
        <div className="space-y-10">
          <SmartHeader title={isRtl ? 'التفضيلات العامة' : 'Core Preferences'} icon="⚙️" isRtl={isRtl} accentColor={accentColor} />
          <div className="space-y-4">
              <SettingRow label={isRtl ? 'لغة الواجهة' : 'Interface Language'} desc={isRtl ? 'تغيير اللغة الأساسية للتطبيق والأسئلة' : 'Select the primary linguistic framework'} isRtl={isRtl}>
                <div className="flex gap-2 p-2 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                  {['AR', 'EN'].map((l) => (
                    <button key={l} onClick={() => setLang(l as 'AR' | 'EN')} className={`px-10 py-4 rounded-xl text-xs font-black transition-all ${lang === l ? 'bg-white text-black shadow-2xl scale-105' : 'text-white/20 hover:text-white/50'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label={isRtl ? 'وضع الرؤية' : 'Visual Spectrum'} desc={isRtl ? 'تبديل فوري بين النمطين النهاري والليلي' : 'Instant toggle between diurnal and nocturnal modes'} isRtl={isRtl}>
                <div className="flex items-center justify-center p-3 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-xl" style={{ fontSize: '18px' }}>
                  <label className="theme-switch cursor-pointer" title={isRtl ? 'تبديل المظهر' : 'Toggle Theme'}>
                    <input 
                      type="checkbox" 
                      className="theme-switch__checkbox" 
                      checked={themeMode === 'dark'} 
                      onChange={(e) => setThemeMode(e.target.checked ? 'dark' : 'light')} 
                    />
                    <div className="theme-switch__container">
                      <div className="theme-switch__clouds" />
                      <div className="theme-switch__stars-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
                          <path fill="currentColor" d="M112.827 16.5517C111.954 12.0298 107.545 9.0768 103.023 9.94978C98.5015 10.8228 95.5485 15.2315 96.4215 19.7534C97.2945 24.2753 101.703 27.2283 106.225 26.3553C110.747 25.4824 113.7 21.0736 112.827 16.5517ZM106.918 22.8465C104.093 23.3923 101.338 21.5466 100.792 18.7214C100.246 15.8962 102.092 13.1408 104.917 12.595C107.742 12.0492 110.498 13.8949 111.043 16.7201C111.589 19.5453 109.743 22.3007 106.918 22.8465Z"/>
                          <polygon fill="currentColor" points="26,0 27.5,4 31.5,5.5 27.5,7 26,11 24.5,7 20.5,5.5 24.5,4 "/>
                          <polygon fill="currentColor" points="66,20 67,22.5 69.5,23.5 67,24.5 66,27 65,24.5 62.5,23.5 65,22.5 "/>
                          <polygon fill="currentColor" points="12,35 13,37.5 15.5,38.5 13,39.5 12,42 11,39.5 8.5,38.5 11,37.5 "/>
                        </svg>
                      </div>
                      <div className="theme-switch__circle-container">
                        <div className="theme-switch__sun-moon-container">
                          <div className="theme-switch__moon">
                            <div className="theme-switch__spot" />
                            <div className="theme-switch__spot" />
                            <div className="theme-switch__spot" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </SettingRow>

              <SettingRow label={isRtl ? 'إطار الصورة الرمزية (VIP Halo)' : 'VIP Avatar Halo Frame'} desc={isRtl ? 'اختر وهج الإطار الحركي حول صورتك الرمزية في الجلسات' : 'Select your dynamic holographic avatar border'} isRtl={isRtl}>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'none', label: isRtl ? 'بدون' : 'Default' },
                    { id: 'neon', label: isRtl ? 'نيون سيبر' : 'Neon Cyber' },
                    { id: 'gold', label: isRtl ? 'تاج ذهبي' : 'Golden Crown' },
                    { id: 'diamond', label: isRtl ? 'أورورا ماسي' : 'Diamond Aurora' },
                  ].map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => {
                        playSound('chime')
                        setEquippedFrame(frame.id)
                      }}
                      className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${equippedFrame === frame.id ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-white/5 border-white/5 opacity-50 hover:opacity-100'}`}
                    >
                      {frame.label}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label={isRtl ? 'النظام الصوتي والمؤثرات' : 'Acoustic Engine & Haptics'} desc={isRtl ? 'تفعيل الموسيقى المحيطية والمؤثرات الصوتية عند التفاعل' : 'Toggle atmospheric sonics and interactive haptic audio'} isRtl={isRtl}>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => setIsPlaying(!isPlaying)} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border transition-all ${isPlaying ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/10 text-white/20'}`}>
                    {isPlaying ? (isRtl ? 'الموسيقى المحيطية: تعمل' : 'Music: Online') : (isRtl ? 'الموسيقى: متوقفة' : 'Music: Offline')}
                  </button>
                  <button onClick={() => { toggleSoundEffects(); playSound('pop'); }} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border transition-all ${soundEffectsEnabled ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.2)]' : 'bg-white/5 border-white/10 text-white/20'}`}>
                    {soundEffectsEnabled ? (isRtl ? 'المؤثرات الصوتية: تعمل' : 'SFX: Online') : (isRtl ? 'المؤثرات: متوقفة' : 'SFX: Offline')}
                  </button>
                </div>
              </SettingRow>
          </div>
        </div>

        {/* Security Section */}
        <div className="space-y-10">
          <SmartHeader title={isRtl ? 'الأمان والخصوصية' : 'Security Vault'} icon="🔒" isRtl={isRtl} accentColor={accentColor} />
          <div className="p-10 md:p-14 rounded-[3.5rem] glass-card border border-white/5 space-y-12">
              <div className={`flex items-center justify-between p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                 <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{isRtl ? 'البريد الإلكتروني الموثق' : 'Verified Core Email'}</p>
                    <p className="text-2xl font-black text-white/90 tracking-tight">{profile?.email}</p>
                 </div>
                 <div className="px-6 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em]">
                  {isRtl ? 'مشفر وآمن' : 'Secure Node'}
                 </div>
              </div>

              <div className="space-y-10">
                 <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    <p className="font-black text-xs uppercase tracking-[0.4em] text-white/60">{isRtl ? 'تحديث مفاتيح الوصول' : 'Update Access Keys'}</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className={`block text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-6 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'كلمة المرور الجديدة' : 'New Secret Key'}</label>
                       <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full bg-white/[0.02] border border-white/10 rounded-[2rem] px-8 py-6 text-xl font-black outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all ${isRtl ? 'text-right' : 'text-left'}`} />
                    </div>
                    <div className="space-y-4">
                       <label className={`block text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-6 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'تأكيد كلمة المرور' : 'Confirm Secret Key'}</label>
                       <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full bg-white/[0.02] border border-white/10 rounded-[2rem] px-8 py-6 text-xl font-black outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all ${isRtl ? 'text-right' : 'text-left'}`} />
                    </div>
                 </div>
                 
                 <AnimatePresence>
                    {passMessage && (
                       <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-6 rounded-[2rem] flex items-center gap-4 ${passMessage.type === 'success' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
                          <span className="text-2xl">{passMessage.type === 'success' ? '✅' : '⚠️'}</span>
                          <span className="text-[11px] font-black uppercase tracking-widest leading-relaxed">{passMessage.text}</span>
                       </motion.div>
                    )}
                 </AnimatePresence>

                 <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdatePassword}
                  disabled={passLoading || !newPassword}
                  className="w-full md:w-fit px-16 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] bg-white text-black hover:bg-white/90 shadow-2xl transition-all disabled:opacity-20"
                 >
                   {passLoading ? (isRtl ? 'جاري التشفير...' : 'ENCRYPTING...') : (isRtl ? 'تحديث السر الرقمي' : 'Commit to Vault')}
                 </motion.button>
              </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-20 border-t border-white/5 flex flex-col items-center gap-12">
           <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
            onClick={handleLogout}
            className="px-16 py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] bg-red-500/10 text-red-500 border border-red-500/20 shadow-2xl transition-all"
           >
             {isRtl ? 'تسجيل الخروج النهائي' : 'Terminal Logout'}
           </motion.button>
           <div className="text-center space-y-3 opacity-20">
              <p className="text-[11px] font-black uppercase tracking-[0.6em]">Al-Arif Artificial Intelligence v1.2.0</p>
              <p className="text-[9px] font-bold">Secure Cloud Node: AMY-GLOBAL-SERVER-04</p>
           </div>
        </div>
      </div>
    </div>
  )
}
