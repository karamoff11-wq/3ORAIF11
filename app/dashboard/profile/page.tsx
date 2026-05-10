'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'
import { ensureAuthenticated } from '@/lib/testMode'
import { Database } from '@/types/database'
import Image from 'next/image'

type Profile = Database['public']['Tables']['profiles']['Row']

// ─── Shared Components (Simplified for Profile) ──────────────────────────────

const Icon = {
  Trophy: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  Activity: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Users: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Target: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  History: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
}

// ─── Sub-sections ────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon: IconComp, accent }: { title: string; value: string | number; sub?: string; icon: any; accent: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-6 rounded-[2rem] glass-card border border-white/5 relative overflow-hidden group"
    >
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity" style={{ background: accent }} />
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-2xl bg-white/5 text-white/40 group-hover:text-white transition-colors">
          <IconComp />
        </div>
        {sub && <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{sub}</span>}
      </div>
      <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-1">{title}</h3>
      <p className="text-3xl font-black text-white">{value}</p>
    </motion.div>
  )
}

function AchievementBadge({ icon, label, locked = false, rarity = 'Common' }: { icon: string; label: string; locked?: boolean; rarity?: string }) {
  const rarityColor = rarity === 'Legendary' ? '#F59E0B' : rarity === 'Epic' ? '#A855F7' : '#3B82F6'
  return (
    <motion.div 
      whileHover={{ scale: 1.05, rotate: 2 }}
      className={`p-6 rounded-[2.5rem] flex flex-col items-center gap-4 text-center transition-all ${locked ? 'opacity-20 grayscale' : 'glass-card border-white/10 shadow-2xl'}`}
    >
      <div className="relative">
        <span className="text-5xl filter drop-shadow-2xl">{icon}</span>
        {!locked && <div className="absolute inset-0 blur-2xl opacity-40 animate-pulse" style={{ background: rarityColor }} />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-black text-white whitespace-nowrap">{label}</p>
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: rarityColor }}>{rarity}</p>
      </div>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { accentColor, lang, mounted } = useFeedbackStore()
  const t = useTranslator()
  const isRtl = lang === 'AR'
  const dir = isRtl ? 'rtl' : 'ltr'

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const user = await ensureAuthenticated()
      if (!user) { router.push('/auth/login'); return }
      
      const { data: p } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single()
      const { data: s } = await (supabase.from('sessions') as any).select('*').eq('host_id', user.id).order('created_at', { ascending: false }).limit(10)
      
      if (p) setProfile(p)
      if (s) setSessions(s)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  if (!mounted || loading) return null

  const userId = profile?.id ?? ''
  const displayName = profile?.display_name || 'Al-Arif'
  const avatarBg = (profile as any)?.avatar_bg_color || accentColor

  return (
    <div className="min-h-screen bg-[#07071A] text-white overflow-x-hidden pb-32" style={{ direction: dir, fontFamily: 'var(--font-tajawal), sans-serif' }}>
      
      {/* Cinematic Header Background */}
      <div className="absolute top-0 inset-x-0 h-[50vh] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#07071A] z-10" />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 opacity-20 blur-[100px]"
          style={{ background: `radial-gradient(circle at 50% 30%, ${accentColor}, transparent 70%)` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-12 relative z-20 space-y-12">
        
        {/* Navigation */}
        <motion.button 
          whileHover={{ x: isRtl ? 5 : -5 }}
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-3 font-black text-xs uppercase tracking-widest group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">{isRtl ? '→' : '←'}</span>
          <span>{t('prof_back')}</span>
        </motion.button>

        {/* ── SECTION 1: IDENTITY CORE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 p-10 rounded-[3.5rem] glass-card border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-10"
          >
            <div className="relative group">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: avatarBg }} />
              <div className="w-48 h-48 rounded-[4.5rem] border-4 border-white/10 p-2 relative z-10 transition-transform duration-500 group-hover:rotate-3" style={{ backgroundColor: avatarBg }}>
                {(profile as any)?.avatar_url ? (
                  <Image src={(profile as any).avatar_url} alt="Avatar" fill className="rounded-[4rem] object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-black text-white/40">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white text-black px-4 py-2 rounded-2xl font-black text-xs shadow-2xl z-20">
                {t('dash_level')} 12
              </div>
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-1">
                <h1 className="text-5xl font-black tracking-tight">{displayName}</h1>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-white/30">{profile?.email}</p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest">
                  {t('prof_founder')}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  {t('prof_expert')}
                </span>
              </div>
              <div className="pt-4 flex items-center justify-center md:justify-start gap-6">
                <div className="text-center">
                  <p className="text-2xl font-black">2.4k</p>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-30">{t('prof_exp')}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-black">#142</p>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-30">{t('prof_rank')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Identity Stats */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard title={t('prof_accuracy')} value="92%" sub="TOP 1%" icon={Icon.Target} accent="#22c55e" />
            <StatCard title={t('prof_streak')} value="14" sub="+2 today" icon={Icon.TrendingUp} accent="#F59E0B" />
            <StatCard title={t('prof_players')} value="1.2k" sub="Lifetime" icon={Icon.Users} accent="#3B82F6" />
            <StatCard title={t('prof_playtime')} value="48h" sub="Active" icon={Icon.Activity} accent="#EC4899" />
          </div>
        </div>

        {/* ── SECTION 2: GAMER DNA (ANALYTICS) ── */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <Icon.Activity />
            <h2 className="text-xl font-black uppercase tracking-widest">{t('prof_dna')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Subject Mastery */}
            <div className="p-8 rounded-[3rem] glass-card border-white/5 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-40">{t('prof_mastery')}</h3>
              <div className="space-y-5">
                {[
                  { label: t('setup_topics'), val: 95, color: '#F59E0B' },
                  { label: 'Science', val: 78, color: '#3B82F6' },
                  { label: 'Sports', val: 62, color: '#10B981' },
                  { label: 'Arts', val: 88, color: '#EC4899' },
                ].map(item => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span>{item.label}</span>
                      <span style={{ color: item.color }}>{item.val}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.val}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full" 
                        style={{ background: item.color }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clutch Factor */}
            <div className="p-8 rounded-[3rem] glass-card border-white/5 flex flex-col justify-between items-center text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
               <h3 className="text-xs font-black uppercase tracking-widest opacity-40 w-full text-left">{t('prof_clutch')}</h3>
               <div className="relative py-8">
                  <svg className="w-40 h-40" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" strokeDasharray="283" strokeDashoffset="40" className="opacity-10" />
                    <motion.circle 
                      cx="50" cy="50" r="45" fill="none" stroke={accentColor} strokeWidth="6" strokeLinecap="round"
                      strokeDasharray="283" initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 - (283 * 0.84) }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black">84%</span>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Last Sec Accuracy</span>
                  </div>
               </div>
               <p className="text-[11px] font-bold opacity-40 leading-relaxed">
                 {isRtl ? 'أنت تتفوق على ٩٤٪ من اللاعبين في الإجابة تحت الضغط العالي.' : 'You outperform 94% of players when answering in the final 3 seconds.'}
               </p>
            </div>

            {/* Social Standing */}
            <div className="p-8 rounded-[3rem] glass-card border-white/5 space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest opacity-40">{t('prof_rivals')}</h3>
               <div className="space-y-4">
                  {[
                    { name: 'Sami_99', wins: 12, losses: 8, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sami' },
                    { name: 'TriviaQueen', wins: 4, losses: 15, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Queen' },
                    { name: 'Dr_Zero', wins: 10, losses: 10, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zero' },
                  ].map(rival => (
                    <div key={rival.name} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 relative">
                        <Image src={rival.avatar} alt={rival.name} fill className="rounded-xl bg-white/10 object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black">{rival.name}</p>
                        <div className="flex gap-2 text-[9px] font-black uppercase tracking-widest">
                          <span className="text-green-500">W: {rival.wins}</span>
                          <span className="text-red-500">L: {rival.losses}</span>
                        </div>
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">⚔️</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: THE TROPHY VAULT ── */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <Icon.Trophy />
                <h2 className="text-xl font-black uppercase tracking-widest">{t('prof_vault')}</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">8 / 42 UNLOCKED</span>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              <AchievementBadge icon="🔥" label="On Fire" rarity="Legendary" />
              <AchievementBadge icon="🧠" label="Brainiac" rarity="Epic" />
              <AchievementBadge icon="⚡" label="Flash" rarity="Rare" />
              <AchievementBadge icon="🏆" label="Champ" rarity="Epic" />
              <AchievementBadge icon="🛡️" label="Veteran" rarity="Common" />
              <AchievementBadge icon="🌌" label="Cosmic" locked />
           </div>
        </div>

        {/* ── SECTION 4: MATCH HISTORY AUDIT ── */}
        <div className="space-y-6">
           <div className="flex items-center gap-4 px-2">
              <Icon.History />
              <h2 className="text-xl font-black uppercase tracking-widest">{t('prof_audit')}</h2>
           </div>
           
           <div className="rounded-[3rem] glass-card border-white/5 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    <th className="px-8 py-5 font-black">{t('dash_session_label')}</th>
                    <th className="px-8 py-5 font-black">{isRtl ? 'النمط' : 'Mode'}</th>
                    <th className="px-8 py-5 font-black">{isRtl ? 'النتيجة' : 'Result'}</th>
                    <th className="px-8 py-5 font-black">{isRtl ? 'التاريخ' : 'Date'}</th>
                    <th className="px-8 py-5 font-black"></th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold">
                  {sessions.length > 0 ? sessions.map((s, i) => (
                    <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="font-black">#{s.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 opacity-40 uppercase tracking-widest text-xs">{s.mode}</td>
                      <td className="px-8 py-5">
                        <span className="text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{t('prof_victory')}</span>
                      </td>
                      <td className="px-8 py-5 opacity-40">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-400">
                          {t('prof_report')}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center opacity-30 font-black uppercase tracking-widest">
                        {t('prof_no_sessions')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

      </div>

      {/* Background Blobs (duplicated from dashboard for consistency) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 80, -40, 0], y: [0, -60, 80, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[-10%] left-[-5%] w-[55%] h-[55%] rounded-full"
          style={{ background: `radial-gradient(circle, ${accentColor}12, transparent 65%)`, filter: 'blur(100px)' }}
        />
        <motion.div
          animate={{ x: [0, -70, 50, 0], y: [0, 80, -40, 0], scale: [1, 0.8, 1.15, 1] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full"
          style={{ background: `radial-gradient(circle, #3B82F610, transparent 65%)`, filter: 'blur(100px)' }}
        />
      </div>
    </div>
  )
}
