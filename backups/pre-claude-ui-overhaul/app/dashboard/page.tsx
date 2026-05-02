'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import toast from 'react-hot-toast'
import { isTestMode, ensureAuthenticated } from '@/lib/testMode'

// --- Components ---

const SidebarItem = ({ icon, label, active = false, badge }: { icon: string, label: string, active?: boolean, badge?: string }) => (
  <motion.div
    whileHover={{ x: -4 }}
    className={`group flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
      active 
        ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10' 
        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-sm font-bold flex-1">{label}</span>
    {badge && (
      <span className="bg-pink-500 text-[10px] font-black px-1.5 py-0.5 rounded-full text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]">
        {badge}
      </span>
    )}
    {active && (
      <motion.div layoutId="active-pill" className="absolute right-0 w-1 h-6 bg-purple-500 rounded-l-full shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
    )}
  </motion.div>
)

const StatCard = ({ icon, label, value, color }: { icon: string, label: string, value: string, color: string }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className="relative p-5 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl overflow-hidden group"
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }} />
    <div className="flex items-center gap-4 relative z-10">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-white tabular-nums">{value}</div>
        <div className="text-[10px] font-mono tracking-widest uppercase text-white/40">{label}</div>
      </div>
    </div>
  </motion.div>
)

const ActionCard = ({ title, desc, icon, badge, onClick, loading, variant = 'purple' }: any) => {
  const themes = {
    purple: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', iconBg: 'rgba(139,92,246,0.2)', shadow: 'rgba(139,92,246,0.3)', btn: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
    orange: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', iconBg: 'rgba(245,158,11,0.2)', shadow: 'rgba(245,158,11,0.3)', btn: 'linear-gradient(135deg, #F59E0B, #D97706)' }
  }
  const theme = themes[variant as keyof typeof themes] || themes.purple

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="relative p-10 rounded-[2.5rem] border overflow-hidden group flex flex-col justify-between h-[340px] cursor-default"
      style={{ background: theme.bg, borderColor: theme.border }}
    >
      <div className="absolute top-0 right-0 p-6 opacity-20 font-mono text-[9px] tracking-widest uppercase">{badge}</div>
      
      {/* Icon Area */}
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6"
          style={{ background: theme.iconBg, border: `1px solid ${theme.border}`, boxShadow: `0 0 40px ${theme.shadow}` }}>
          {icon}
        </div>
      </div>

      {/* Content Area */}
      <div>
        <h3 className="text-3xl font-black mb-3 tracking-tight">{title}</h3>
        <p className="text-sm text-white/40 font-light leading-relaxed max-w-[240px] mb-8">{desc}</p>
        
        <button 
          onClick={onClick}
          disabled={loading}
          className="relative px-8 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          style={{ background: theme.btn, boxShadow: `0 8px 24px ${theme.shadow}` }}
        >
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          <span>{loading ? 'جاري التحميل...' : (variant === 'purple' ? 'بدء لعبة محلية' : 'إنشاء غرفة عن بُعد')}</span>
          <span className="text-base">←</span>
        </button>
      </div>

      {/* Visual Decoration */}
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-[80px] opacity-20" style={{ background: theme.btn }} />
    </motion.div>
  )
}

// --- Page Component ---

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [creatingSession, setCreatingSession] = useState<'local'|'remote'|null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function loadProfile() {
      const user = await ensureAuthenticated()
      if (!user) { router.push('/auth/login'); return }
      
      try {
        const { data } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single()
        setProfile(data ?? { email: user.email || 'guest@test.ai', free_sessions_used: false })
      } catch {
        setProfile({ email: user.email || 'guest@test.ai', free_sessions_used: false })
      }
    }
    loadProfile()
  }, [router, supabase])

  async function handleCreateSession(mode: 'local' | 'remote') {
    setCreatingSession(mode)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const session = await gameEngine.createSession(user.id, mode)
      toast.success(mode === 'local' ? 'تم إنشاء جلسة محلية!' : 'تم إنشاء غرفة عن بُعد!')
      router.push(`/game/setup/${session.id}`)
    } catch (error: any) {
      toast.error('حدث خطأ: ' + error.message)
    } finally {
      setCreatingSession(null)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const displayName = profile?.email?.split('@')[0] ?? '...'
  const hasFreeSession = !profile?.free_sessions_used

  return (
    <div className="min-h-screen bg-[#07071A] text-white selection:bg-purple-500/30 overflow-hidden flex" style={{ direction: 'rtl', fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
      
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-blue-600/5 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ── Sidebar ── */}
      <aside className="relative z-30 w-72 h-screen border-l border-white/5 bg-black/20 backdrop-blur-2xl flex flex-col p-6 hidden xl:flex">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">🎮</div>
          <span className="font-black text-2xl tracking-tighter">العُريف</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon="🏠" label="الرئيسية" active />
          <SidebarItem icon="👤" label="ملفي الشخصي" />
          <SidebarItem icon="👥" label="الأصدقاء" badge="3" />
          <SidebarItem icon="🏆" label="الإنجازات" />
          <SidebarItem icon="📅" label="المهام اليومية" badge="2" />
          <SidebarItem icon="🛒" label="المتجر" />
          <SidebarItem icon="⚙️" label="الإعدادات" />
        </nav>

        {/* Upgrade Card */}
        <div className="mt-auto p-6 rounded-3xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-[-20px] left-[-20px] w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="text-xl mb-2">👑</div>
            <h4 className="font-black text-sm mb-1">اشترك الآن</h4>
            <p className="text-[10px] text-white/40 leading-relaxed mb-4">واحصل على مزايا حصرية وتجربة أفضل!</p>
            <Link href="/pricing" className="block w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-center text-xs font-bold shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">عرض الباقات</Link>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10 scrollbar-hide">
        
        {/* ── Top Nav ── */}
        <nav className="sticky top-0 z-40 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/10 backdrop-blur-xl">
          <div className="flex items-center gap-8 flex-1">
            {/* Search */}
            <div className="relative max-w-md w-full group hidden md:block">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors">🔍</span>
              <input 
                type="text" 
                placeholder="ابحث عن لعبة أو تحدي..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pr-12 pl-4 text-sm outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
              <span>🔔</span>
              <span className="absolute top-2.5 left-2.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-[#07071A]" />
            </button>
            <div className="flex items-center gap-3 pl-2 cursor-pointer group" onClick={handleSignOut}>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{displayName}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest">مستوى 11</div>
              </div>
              <div className="w-11 h-11 rounded-2xl border-2 border-white/10 overflow-hidden shadow-lg shadow-black/50 group-hover:border-purple-500/50 transition-all">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} alt="Avatar" />
              </div>
            </div>
          </div>
        </nav>

        {/* ── Dashboard Content ── */}
        <main className="p-8 md:p-12 space-y-12 max-w-7xl">
          
          {/* Welcome Header */}
          <header className="relative py-12 px-10 rounded-[3rem] border border-white/5 bg-gradient-to-bl from-white/[0.02] to-transparent overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-[-50%] left-[-10%] w-[80%] h-[150%] bg-purple-600/5 rotate-12 blur-[100px]" />
              <div className="absolute top-[10%] right-[10%] w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight">
                  مرحباً، <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">{displayName}</span> 👋
                </h1>
                <p className="text-lg text-white/40 font-light max-w-xl leading-relaxed">
                  أهلاً بك من جديد في العُريف. استعد لتحديات جديدة، ونافس أصدقائك، وارتقِ لمستوى أعلى من المعرفة.
                </p>
              </div>

              {/* Quick Level Info */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-black text-white">11</div>
                  <div className="text-[10px] font-mono tracking-widest uppercase text-white/30">المستوى</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="w-24 h-24 rounded-3xl border-4 border-purple-500/20 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(139,92,246,0.15)] bg-black/20">
                  🏆
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 pt-12 border-t border-white/5">
              <StatCard icon="🔥" label="سلسلة يومية" value="7" color="#F59E0B" />
              <StatCard icon="⚡" label="نقاط إجمالية" value="1,152" color="#3B82F6" />
              <StatCard icon="💎" label="إنجازات محققة" value="24" color="#A855F7" />
              <StatCard icon="🎮" label="جلسات مكتملة" value="142" color="#10B981" />
            </div>
          </header>

          {/* Main Action Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ActionCard 
              title="جلسة محلية"
              desc="التجربة الكلاسيكية على جهاز واحد. مثالي للتجمعات العائلية وحفلات الأصدقاء."
              icon="🎮"
              badge="النمط / 02"
              variant="purple"
              loading={creatingSession === 'local'}
              onClick={() => handleCreateSession('local')}
            />
            <ActionCard 
              title="جلسة عن بُعد"
              desc="العب مع أصدقاءك في أي مكان في العالم. نظام مزامنة لحظي وتحدي بلا حدود."
              icon="🌐"
              badge="النمط / 01"
              variant="orange"
              loading={creatingSession === 'remote'}
              onClick={() => handleCreateSession('remote')}
            />
          </section>

          {/* Secondary Features Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5 }} className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] flex items-center justify-between group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:bg-blue-500/20 transition-all">💪</div>
                <div>
                  <h4 className="font-black text-lg">المستوى الاحترافي</h4>
                  <p className="text-xs text-white/30">احصل على جلسات غير محدودة</p>
                </div>
              </div>
              <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-blue-400">←</button>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] flex items-center justify-between group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl group-hover:bg-purple-500/20 transition-all">⚡</div>
                <div>
                  <h4 className="font-black text-lg">عضوية برو</h4>
                  <p className="text-xs text-white/30">استمتع بكامل المزايا الحصرية</p>
                </div>
              </div>
              <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-purple-400">←</button>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] flex items-center justify-between group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl group-hover:bg-orange-500/20 transition-all">🎟️</div>
                <div>
                  <h4 className="font-black text-lg">انضم بكود</h4>
                  <p className="text-xs text-white/30">لديك كود جلسة من صديق؟</p>
                </div>
              </div>
              <Link href="/join" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-orange-400">←</Link>
            </motion.div>
          </section>

          {/* Spacer */}
          <div className="h-12" />
        </main>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap');
        
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
