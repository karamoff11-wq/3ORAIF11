'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'
import { Database } from '@/types/database'
type Profile = Database['public']['Tables']['profiles']['Row']
import { ensureAuthenticated } from '@/lib/testMode'
import Image from 'next/image'

// ─────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────
interface Achievement {
  id: string
  icon: string
  titleAr: string
  titleEn: string
  descAr: string
  descEn: string
  target: number
  category: 'gameplay' | 'social' | 'streak' | 'mastery'
}

const CATEGORIES = [
  { id: 'gameplay', labelAr: 'أسلوب اللعب', labelEn: 'Gameplay', icon: '🎮' },
  { id: 'social',   labelAr: 'التواصل', labelEn: 'Social',   icon: '👥' },
  { id: 'streak',   labelAr: 'الاستمرارية', labelEn: 'Streak',   icon: '🔥' },
  { id: 'mastery',  labelAr: 'الإتقان', labelEn: 'Mastery',  icon: '🏆' },
]

// Generating a sample of achievements to reach a large number
const GENERATED_ACHIEVEMENTS: Achievement[] = [
  // Gameplay
  { id: 'g1', icon: '🎯', category: 'gameplay', target: 1, titleAr: 'أول الغيث', titleEn: 'First Session', descAr: 'استضف أول جلسة لك.', descEn: 'Host your first session.' },
  { id: 'g2', icon: '🎲', category: 'gameplay', target: 5, titleAr: 'هاوي التحدي', titleEn: 'Challenger', descAr: 'استضف ٥ جلسات.', descEn: 'Host 5 sessions.' },
  { id: 'g3', icon: '🧩', category: 'gameplay', target: 10, titleAr: 'خبير التنظيم', titleEn: 'Organizer', descAr: 'استضف ١٠ جلسات.', descEn: 'Host 10 sessions.' },
  { id: 'g4', icon: '🧠', category: 'gameplay', target: 25, titleAr: 'عقل مدبر', titleEn: 'Mastermind', descAr: 'استضف ٢٥ جلسة.', descEn: 'Host 25 sessions.' },
  { id: 'g5', icon: '🎓', category: 'gameplay', target: 50, titleAr: 'بروفيسور العُريف', titleEn: 'The Professor', descAr: 'استضف ٥٠ جلسة.', descEn: 'Host 50 sessions.' },
  { id: 'g6', icon: '🌌', category: 'gameplay', target: 100, titleAr: 'أسطورة الجلسات', titleEn: 'Legendary Host', descAr: 'استضف ١٠٠ جلسة.', descEn: 'Host 100 sessions.' },
  
  // Streak
  { id: 's1', icon: '🕯️', category: 'streak', target: 2, titleAr: 'يومان متتاليان', titleEn: '2-Day Streak', descAr: 'استضف جلسات ليومين متتاليين.', descEn: 'Host sessions for 2 consecutive days.' },
  { id: 's2', icon: '🔥', category: 'streak', target: 3, titleAr: 'سلسلة مشتعلة', titleEn: 'On Fire', descAr: 'سلسلة استضافة لـ ٣ أيام.', descEn: 'Host sessions for 3 consecutive days.' },
  { id: 's3', icon: '🌋', category: 'streak', target: 7, titleAr: 'أسبوع من الإبداع', titleEn: 'Weekly Warrior', descAr: 'سلسلة استضافة لـ ٧ أيام.', descEn: 'Host sessions for 7 consecutive days.' },
  { id: 's4', icon: '☄️', category: 'streak', target: 30, titleAr: 'شهر من التحدي', titleEn: 'Monthly Master', descAr: 'سلسلة استضافة لـ ٣٠ يوماً.', descEn: 'Host sessions for 30 consecutive days.' },

  // Social (Simulated targets)
  { id: 'c1', icon: '👋', category: 'social', target: 10, titleAr: 'مرحب بالجميع', titleEn: 'Welcomer', descAr: 'استضف ١٠ لاعبين مجموعاً.', descEn: 'Have 10 total players join.' },
  { id: 'c2', icon: '📢', category: 'social', target: 50, titleAr: 'صوت مسموع', titleEn: 'Voice of the People', descAr: 'استضف ٥٠ لاعباً مجموعاً.', descEn: 'Have 50 total players join.' },
  { id: 'c3', icon: '🎉', category: 'social', target: 100, titleAr: 'روح الحفلة', titleEn: 'Life of the Party', descAr: 'استضف ١٠٠ لاعب مجموعاً.', descEn: 'Have 100 total players join.' },
  { id: 'c4', icon: '🌍', category: 'social', target: 500, titleAr: 'شخصية عالمية', titleEn: 'Global Icon', descAr: 'استضف ٥٠٠ لاعب مجموعاً.', descEn: 'Have 500 total players join.' },

  // Mastery
  { id: 'm1', icon: '⭐', category: 'mastery', target: 1, titleAr: 'بداية الإتقان', titleEn: 'Beginner Mastery', descAr: 'أكمل جلسة بدون أي أخطاء فنية.', descEn: 'Complete a session with no technical issues.' },
  { id: 'm2', icon: '💎', category: 'mastery', target: 5, titleAr: 'الجلسة الماسية', titleEn: 'Diamond Session', descAr: 'احصل على تقييم عالي من اللاعبين.', descEn: 'Get a high rating from players.' },
]

// Adding generic ones to reach 100 for the demonstration of the scroll
for (let i = 1; i <= 80; i++) {
  GENERATED_ACHIEVEMENTS.push({
    id: `extra-${i}`,
    icon: '🎖️',
    category: i % 2 === 0 ? 'gameplay' : 'mastery',
    target: 100 + (i * 10),
    titleAr: `وسام الاستحقاق ${i}`,
    titleEn: `Merit Medal ${i}`,
    descAr: `أنجز المهمة الخاصة رقم ${i} لتطوير مستواك.`,
    descEn: `Complete special mission #${i} to level up.`,
  })
}

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

function AchievementCard({ 
  ach, progress, isRtl, accentColor 
}: { 
  ach: Achievement; progress: number; isRtl: boolean; accentColor: string 
}) {
  const isDone = progress >= 100
  const pct = Math.min(progress, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden group ${
        isDone ? 'glass-card' : 'bg-white/5 border-white/5 opacity-60'
      }`}
      style={{ borderColor: isDone ? `${accentColor}40` : undefined }}
    >
      {/* Background Glow */}
      {isDone && (
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 120%, ${accentColor}, transparent 70%)` }}
        />
      )}

      <div className="flex flex-col gap-4 relative z-10 h-full">
        <div className="flex items-center justify-between">
          <div 
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all duration-700 ${
              isDone ? 'scale-110 rotate-3 shadow-lg' : 'grayscale opacity-40 blur-[1px]'
            }`}
            style={{ 
              background: isDone ? `${accentColor}15` : 'rgba(255,255,255,0.05)',
              color: isDone ? accentColor : 'inherit'
            }}
          >
            {ach.icon}
          </div>
          {isDone && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white"
            >
              ✓
            </motion.div>
          )}
        </div>

        <div className="flex-1">
          <h3 className={`text-base font-black mb-1 ${isDone ? 'text-white' : 'text-white/40'}`}>
            {isRtl ? ach.titleAr : ach.titleEn}
          </h3>
          <p className="text-xs leading-relaxed opacity-50 font-medium">
            {isRtl ? ach.descAr : ach.descEn}
          </p>
        </div>

        <div className="mt-2 space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
            <span>{Math.round(pct)}%</span>
            <span>{ach.target}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ background: isDone ? `linear-gradient(90deg, ${accentColor}, #EC4899)` : 'rgba(255,255,255,0.2)' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AchievementsPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { accentColor, lang, mounted } = useFeedbackStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeCat, setActiveCat] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const isRtl = lang === 'AR'
  const dir = isRtl ? 'rtl' : 'ltr'

  useEffect(() => {
    async function load() {
      const user = await ensureAuthenticated()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const filtered = useMemo(() => {
    if (activeCat === 'all') return GENERATED_ACHIEVEMENTS
    return GENERATED_ACHIEVEMENTS.filter(a => a.category === activeCat)
  }, [activeCat])

  const stats = useMemo(() => {
    const total = GENERATED_ACHIEVEMENTS.length
    const unlocked = GENERATED_ACHIEVEMENTS.filter(a => {
      if (a.category === 'gameplay') return (profile?.sessions_played ?? 0) >= a.target
      if (a.category === 'streak') return (profile?.streak ?? 0) >= a.target
      return false
    }).length
    return { total, unlocked, pct: (unlocked / total) * 100 }
  }, [profile])

  if (!mounted || loading) return null

  return (
    <div 
      className="min-h-screen pb-20 transition-colors duration-700"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', direction: dir, fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-3xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/5"
            >
              {isRtl ? '→' : '←'}
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {isRtl ? 'الأوسمة والإنجازات' : 'Achievements & Medals'}
              </h1>
              <p className="text-xs opacity-50 font-bold uppercase tracking-widest">
                {stats.unlocked} / {stats.total} {isRtl ? 'مكتمل' : 'Completed'}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">
                {isRtl ? 'المستوى الحالي' : 'Current Level'}
              </p>
              <p className="text-lg font-black" style={{ color: accentColor }}>Level 1</p>
            </div>
            <div className="w-12 h-12 rounded-full border-2 p-0.5 relative" style={{ borderColor: `${accentColor}40` }}>
               <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email ?? 'user'}`} alt="Avatar" fill className="rounded-full bg-white/10" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-6 pb-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCat('all')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${activeCat === 'all' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
              style={{ background: activeCat === 'all' ? accentColor : 'rgba(255,255,255,0.05)' }}
            >
              {isRtl ? 'الكل' : 'All'}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeCat === cat.id ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                style={{ background: activeCat === cat.id ? accentColor : 'rgba(255,255,255,0.05)' }}
              >
                <span>{cat.icon}</span>
                <span>{isRtl ? cat.labelAr : cat.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Progress Overview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 p-8 rounded-[3rem] glass-card relative overflow-hidden"
        >
           <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ background: `radial-gradient(circle at 100% 0%, ${accentColor}, transparent)` }}
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-black mb-3">
                {isRtl ? 'رحلتك نحو القمة' : 'Your Journey to the Top'}
              </h2>
              <p className="text-sm opacity-60 font-medium max-w-lg">
                {isRtl 
                  ? 'كل جلسة تستضيفها وكل تحدٍ تخوضه يقربك أكثر من لقب أسطورة العُريف. استمر في اللعب لفتح المزيد من الأوسمة النادرة.' 
                  : 'Every session you host and every challenge you face brings you closer to the title of Al-Arif Legend. Keep playing to unlock more rare medals.'}
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4 min-w-[200px]">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <motion.circle 
                    cx="64" cy="64" r="58" fill="none" 
                    stroke={accentColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={364}
                    initial={{ strokeDashoffset: 364 }}
                    animate={{ strokeDashoffset: 364 - (364 * stats.pct / 100) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black">{Math.round(stats.pct)}%</span>
                  <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">{isRtl ? 'إنجاز' : 'Done'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(ach => {
            let progress = 0
            if (ach.category === 'gameplay') progress = ((profile?.sessions_played ?? 0) / ach.target) * 100
            if (ach.category === 'streak') progress = ((profile?.streak ?? 0) / ach.target) * 100
            
            return (
              <AchievementCard 
                key={ach.id} 
                ach={ach} 
                progress={progress} 
                isRtl={isRtl} 
                accentColor={accentColor} 
              />
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center opacity-40">
             <p className="text-xl font-black">{isRtl ? 'لا توجد أوسمة في هذا القسم بعد' : 'No achievements in this section yet'}</p>
          </div>
        )}
      </main>
    </div>
  )
}
