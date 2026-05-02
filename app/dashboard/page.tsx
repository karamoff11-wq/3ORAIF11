'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import toast from 'react-hot-toast'
import { ensureAuthenticated } from '@/lib/testMode'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

// ── Sidebar item ──
function SidebarItem({
  icon, label, active = false, badge, locked = false, collapsed,
}: {
  icon: string; label: string; active?: boolean; badge?: string
  locked?: boolean; collapsed: boolean
}) {
  const [showTip, setShowTip] = useState(false)

  return (
    <div className="relative"
      onMouseEnter={() => locked && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}>
      <motion.div whileHover={{ x: collapsed ? 0 : -3 }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all relative ${
          active
            ? 'bg-white/10 text-white border border-white/10'
            : locked
              ? 'text-white/20 cursor-default'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
        }`}>
        <span className="text-lg shrink-0">{icon}</span>
        {!collapsed && (
          <>
            <span className="text-sm font-bold flex-1 whitespace-nowrap">{label}</span>
            {badge && !locked && (
              <span className="bg-pink-500 text-[10px] font-black px-1.5 py-0.5 rounded-full text-white">
                {badge}
              </span>
            )}
            {locked && <span className="text-white/20 text-xs">🔒</span>}
          </>
        )}
        {active && !collapsed && (
          <div className="absolute right-0 w-0.5 h-5 rounded-l-full bg-purple-500" />
        )}
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
            className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap z-50 pointer-events-none"
            style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
            🔒 قريباً
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Action Card ──
function ActionCard({ title, desc, icon, onClick, loading, color, badge }: {
  title: string; desc: string; icon: string
  onClick: () => void; loading: boolean
  color: { from: string; to: string; glow: string; bg: string; border: string }
  badge: string
}) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}
      className="relative p-8 rounded-3xl border overflow-hidden group flex flex-col justify-between min-h-[280px] cursor-default"
      style={{ background: color.bg, borderColor: color.border }}>

      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg,transparent,${color.from}60,transparent)` }} />
      <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: `linear-gradient(135deg,${color.from},${color.to})` }} />
      <div className="absolute top-5 left-5 text-[10px] font-mono tracking-widest uppercase text-white/15">{badge}</div>

      <div>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 transition-transform group-hover:scale-110 group-hover:rotate-3"
          style={{ background: `${color.from}20`, border: `1px solid ${color.border}` }}>
          {icon}
        </div>
        <h3 className="text-2xl font-black mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-white/35 leading-relaxed max-w-[220px]">{desc}</p>
      </div>

      <button onClick={onClick} disabled={loading}
        className="relative mt-6 px-7 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 w-fit"
        style={{ background: `linear-gradient(135deg,${color.from},${color.to})`, boxShadow: `0 6px 20px ${color.glow}` }}>
        {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        <span>{loading ? 'جاري التحميل...' : title}</span>
        <span>←</span>
      </button>
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [creating, setCreating] = useState<'local' | 'remote' | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function load() {
      const user = await ensureAuthenticated()
      if (!user) { router.push('/auth/login'); return }
      try {
        const { data } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single()
        setProfile(data ?? { email: user.email || 'guest@test.ai', free_sessions_used: false })
      } catch {
        setProfile({ email: user.email || 'guest@test.ai', free_sessions_used: false })
      }
    }
    load()
  }, [router, supabase])

  async function handleCreate(mode: 'local' | 'remote') {
    setCreating(mode)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const session = await gameEngine.createSession(user.id, mode)
      toast.success(mode === 'local' ? 'تم إنشاء جلسة محلية!' : 'تم إنشاء غرفة عن بعد!')
      router.push(`/game/setup/${session.id}`)
    } catch (e: any) {
      toast.error('حدث خطأ: ' + e.message)
    } finally {
      setCreating(null)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const displayName = profile?.email?.split('@')[0] ?? '...'

  const sidebarItems = [
    { icon: '🏠', label: 'الرئيسية', active: true, locked: false },
    { icon: '👤', label: 'ملفي الشخصي', locked: false },
    { icon: '👥', label: 'الأصدقاء', locked: true },
    { icon: '🏆', label: 'الإنجازات', locked: true },
    { icon: '📅', label: 'المهام اليومية', locked: true },
    { icon: '🛒', label: 'المتجر', locked: true },
    { icon: '⚙️', label: 'الإعدادات', locked: false },
  ]

  return (
    <div className="min-h-screen bg-[#07071A] text-white flex overflow-hidden"
      style={{ direction: 'rtl', fontFamily: "'Cairo','Tajawal',sans-serif" }}>

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-purple-600/8 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-blue-600/5 blur-[110px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ── SIDEBAR ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 h-screen shrink-0 border-l border-white/5 bg-black/20 backdrop-blur-2xl flex flex-col overflow-hidden hidden xl:flex">

        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg shrink-0">
            🎮
          </div>
          {!sidebarCollapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-black text-lg tracking-tight">العفريف</motion.span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item, i) => (
            <SidebarItem key={i} {...item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {/* Upgrade teaser */}
        {!sidebarCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="m-3 p-4 rounded-2xl relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.1))', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xl mb-1">👑</p>
            <h4 className="font-black text-sm mb-0.5">اشترك الآن</h4>
            <p className="text-[10px] text-white/35 mb-3 leading-relaxed">احصل على ميزات حصرية قريباً!</p>
            <div className="w-full py-2 rounded-xl text-center text-xs font-black text-white/40 border border-white/10">
              🔒 قريباً
            </div>
          </motion.div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(p => !p)}
          className="flex items-center justify-center py-3 border-t border-white/5 text-white/25 hover:text-white/60 transition-colors text-sm">
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </motion.aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">

        {/* ── TOP NAV ── */}
        <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-8 py-4 border-b border-white/5"
          style={{ background: 'rgba(7,7,26,0.7)', backdropFilter: 'blur(20px)' }}>

          {/* Search */}
          <div className="relative max-w-sm w-full hidden md:block">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-sm">🔍</span>
            <input type="text" placeholder="ابحث عن لعبة أو تحدي..."
              className="w-full bg-white/4 border border-white/8 rounded-xl py-2 pr-10 pl-4 text-sm outline-none focus:border-purple-500/40 focus:bg-white/6 transition-all" />
          </div>

          <div className="flex items-center gap-4">
            {/* Notification */}
            <button className="relative w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center hover:bg-white/8 transition-all">
              <span className="text-sm">🔔</span>
              <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-pink-500 rounded-full border border-[#07071A]" />
            </button>

            {/* User */}
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={handleSignOut}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold group-hover:text-purple-400 transition-colors">{displayName}</p>
                <p className="text-[10px] text-white/25 uppercase tracking-widest">المستوى 11</p>
              </div>
              <div className="w-9 h-9 rounded-xl border-2 border-white/10 overflow-hidden group-hover:border-purple-500/40 transition-all relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} alt="Avatar" />
              </div>
            </div>
          </div>
        </nav>

        {/* ── CONTENT ── */}
        <main className="p-6 md:p-8 space-y-8 max-w-6xl">

          {/* Compact welcome header */}
          <header className="flex items-center justify-between py-5 px-6 rounded-2xl border border-white/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                مرحباً، <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{displayName}</span> 👋
              </h1>
              <p className="text-sm text-white/35 mt-0.5">جاهز لتحدٍ جديد اليوم؟</p>
            </div>

            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-6">
              {[
                { icon: '🔥', val: '7', label: 'سلسلة' },
                { icon: '⚡', val: '1,152', label: 'نقطة' },
                { icon: '🎮', val: '142', label: 'جلسة' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg font-black text-white">{s.val}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider flex items-center gap-1">
                    <span>{s.icon}</span>{s.label}
                  </div>
                </div>
              ))}
            </div>
          </header>

          {/* ── MAIN ACTION CARDS ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ActionCard
              title="جلسة محلية"
              desc="التجربة الكلاسيكية على جهاز واحد. مثالي للتجمعات العائلية وحفلات الأصدقاء."
              icon="🎮"
              badge="النمط / 02"
              color={{
                from: '#8B5CF6', to: '#7C3AED',
                glow: 'rgba(139,92,246,0.35)',
                bg: 'rgba(139,92,246,0.08)',
                border: 'rgba(139,92,246,0.18)',
              }}
              loading={creating === 'local'}
              onClick={() => handleCreate('local')}
            />
            <ActionCard
              title="جلسة عن بعد"
              desc="العب مع أصدقائك في أي مكان في العالم. نظام مزامنة لحظي وتحدٍ بلا حدود."
              icon="🌍"
              badge="النمط / 01"
              color={{
                from: '#F59E0B', to: '#D97706',
                glow: 'rgba(245,158,11,0.35)',
                bg: 'rgba(245,158,11,0.08)',
                border: 'rgba(245,158,11,0.18)',
              }}
              loading={creating === 'remote'}
              onClick={() => handleCreate('remote')}
            />
          </section>

          {/* ── SECONDARY ACTIONS ── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { icon: '💪', title: 'المستوى الاحترافي', sub: 'احصل على جلسات غير محدودة', color: '#3B82F6', locked: true },
              { icon: '⚡', title: 'عضوية برو', sub: 'استمتع بكامل المزايا الحصرية', color: '#8B5CF6', locked: true },
              { icon: '🎟️', title: 'انضم بكود', sub: 'لديك كود جلسة من صديق؟', color: '#F59E0B', locked: false, href: '/join' },
            ].map((item, i) => (
              <motion.div key={i} whileHover={{ y: -4 }}
                className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all group-hover:scale-110"
                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}20` }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-base">{item.title}</h4>
                      {item.locked && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                          قريباً
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/30">{item.sub}</p>
                  </div>
                </div>
                {item.href ? (
                  <Link href={item.href}
                    className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                    style={{ color: item.color }}>←</Link>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-white/4 flex items-center justify-center text-white/20 text-sm">🔒</div>
                )}
              </motion.div>
            ))}
          </section>

          <div className="h-8" />
        </main>
      </div>

    </div>
  )
}
