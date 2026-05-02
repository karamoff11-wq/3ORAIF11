'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'

const NAV = [
  { href: '/admin',            label: 'الرئيسية',     icon: '📊' },
  { href: '/admin/topics',     label: 'المواضيع',     icon: '📂' },
  { href: '/admin/categories', label: 'الفئات',       icon: '📚' },
  { href: '/admin/generator',  label: 'مولد الأسئلة آلياً', icon: '🤖' },
  { href: '/admin/questions',  label: 'الأسئلة',      icon: '❓' },
  { href: '/admin/sessions',   label: 'الجلسات',      icon: '🎮' },
  { href: '/admin/mascot',     label: 'شخصية أبو العُريف', icon: '🧞' },
  { href: '/admin/scoring',    label: 'إعدادات النقاط', icon: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      try {
        const { data: profile } = await (supabase
          .from('profiles') as any).select('role').eq('id', user.id).single()
        if (profile && (profile as any).role !== 'admin') {
          router.push('/dashboard'); return
        }
      } catch { /* DB not set up yet — allow access */ }
      setChecking(false)
    }
    checkAdmin()
  }, [router])

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="w-9 h-9 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-primary-light)', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>جاري التحقق...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 flex flex-col relative"
        style={{ background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}>

        {/* Subtle top glow */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(124,58,237,0.5),transparent)' }} />

        {/* Logo */}
        <div className="p-5 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
              🎯
            </div>
            <div>
              <p className="font-black text-sm leading-tight" style={{ color: 'var(--color-text-primary)' }}>العُريف</p>
              <p className="text-[10px] uppercase tracking-widest font-bold mt-0.5" style={{ color: 'var(--color-text-muted)' }}>لوحة الإدارة</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-3 h-px" style={{ background: 'var(--color-border)' }} />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ href, label, icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all text-sm font-semibold"
                style={{
                  background: active ? 'rgba(124,58,237,0.14)' : 'transparent',
                  color: active ? '#c4b5fd' : 'var(--color-text-secondary)',
                  border: active ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
                  boxShadow: active ? '0 0 12px rgba(124,58,237,0.1)' : 'none',
                }}>
                <span className="text-base">{icon}</span>
                <span>{label}</span>
                {active && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-[#c4b5fd]" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-auto">
          <div className="h-px mb-4" style={{ background: 'var(--color-border)' }} />
          <Link href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all"
            style={{ color: 'var(--color-text-muted)', border: '1px solid transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}>
            ← لوحة اللاعب
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto min-h-screen" style={{ background: 'var(--color-bg)' }}>
        {children}
      </main>
    </div>
  )
}
