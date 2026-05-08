'use client'

import Link from 'next/link'
import { useTranslator } from '@/lib/i18n'
import { motion } from 'framer-motion'
import { useMemo, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { PADDLE_CONFIG, getPriceId, type PlanType } from '@/lib/paddle'
import { usePlan } from '@/hooks/usePlan'

// ── Declare Paddle global (loaded via script tag) ──
declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void }
      Initialize: (opts: { token: string }) => void
      Checkout: {
        open: (opts: {
          items: Array<{ priceId: string; quantity: number }>
          customData?: Record<string, string>
          successUrl?: string
        }) => void
      }
    }
  }
}

export default function PricingClient() {
  const t = useTranslator()
  const { plan: currentPlan, loading: planLoading } = usePlan()
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [paddleReady, setPaddleReady]         = useState(false)
  const [userId, setUserId]                   = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // ── Load Paddle.js SDK ──
  useEffect(() => {
    if (window.Paddle) { setPaddleReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.async = true
    script.onload = () => {
      if (window.Paddle) {
        window.Paddle.Environment.set(PADDLE_CONFIG.environment)
        window.Paddle.Initialize({ token: PADDLE_CONFIG.clientToken })
        setPaddleReady(true)
      }
    }
    document.head.appendChild(script)
  }, [])

  // ── Get current user ID for Paddle custom_data ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [supabase])

  // ── Launch Paddle Checkout ──
  async function handleCheckout(planId: 'pro' | 'team') {
    if (!paddleReady || !window.Paddle) {
      alert('Payment system is loading. Please try again in a second.')
      return
    }
    if (!userId) {
      window.location.href = `/auth/register?plan=${planId}`
      return
    }

    const priceId = getPriceId(planId)
    if (!priceId) {
      alert('Price not configured. Please contact support.')
      return
    }

    setCheckoutLoading(planId)
    try {
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { user_id: userId },
        successUrl: `${window.location.origin}/dashboard?upgrade=success`,
      })
    } catch (err) {
      console.error('[Paddle] Checkout error:', err)
    } finally {
      setCheckoutLoading(null)
    }
  }

  const PLANS = [
    {
      id:          'free' as PlanType,
      name:        t('pricing_free_name'),
      price:       '$0',
      period:      t('pricing_forever'),
      description: t('pricing_free_desc'),
      color:       'var(--color-text-secondary)',
      highlight:   false,
      features: [
        { text: t('feat_free_1'), ok: true  },
        { text: t('feat_free_2'), ok: true  },
        { text: t('feat_free_3'), ok: true  },
        { text: t('feat_free_4'), ok: true  },
        { text: t('feat_pro_2'),  ok: false },
        { text: t('feat_pro_1'),  ok: false },
        { text: t('feat_pro_5'),  ok: false },
      ],
      cta:      t('pricing_free_cta'),
      btnClass: 'btn-ghost',
      action:   'link' as const,
      href:     '/auth/register',
    },
    {
      id:          'pro' as PlanType,
      name:        t('pricing_pro_name'),
      price:       '$9',
      period:      t('pricing_monthly'),
      description: t('pricing_pro_desc'),
      color:       'var(--color-primary-light)',
      highlight:   true,
      features: [
        { text: t('feat_pro_1'), ok: true },
        { text: t('feat_pro_2'), ok: true },
        { text: t('feat_pro_3'), ok: true },
        { text: t('feat_pro_4'), ok: true },
        { text: t('feat_pro_5'), ok: true },
        { text: t('feat_pro_6'), ok: true },
        { text: t('feat_pro_7'), ok: true },
      ],
      cta:      t('pricing_pro_cta'),
      btnClass: 'btn-primary',
      action:   'checkout' as const,
      planKey:  'pro' as 'pro' | 'team',
    },
    {
      id:          'team' as PlanType,
      name:        t('pricing_team_name'),
      price:       '$29',
      period:      t('pricing_monthly'),
      description: t('pricing_team_desc'),
      color:       'var(--color-cyan)',
      highlight:   false,
      features: [
        { text: t('feat_team_1'), ok: true },
        { text: t('feat_team_2'), ok: true },
        { text: t('feat_team_3'), ok: true },
        { text: t('feat_team_4'), ok: true },
        { text: t('feat_team_5'), ok: true },
        { text: t('feat_team_6'), ok: true },
        { text: t('feat_team_7'), ok: true },
      ],
      cta:      t('pricing_team_cta'),
      btnClass: 'btn-cyan',
      action:   'mail' as const,
      href:     'mailto:hello@al-ureef.com',
    },
  ]

  return (
    <main className="min-h-screen py-24 px-4 relative overflow-hidden">
      {/* Background ambient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle,#06b6d4,transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-10 px-5 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
              {t('pricing_back')}
            </Link>
            <h1 className="text-5xl md:text-6xl font-black mb-6 gradient-text-primary tracking-tight">
              {t('pricing_title')}
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              {t('pricing_sub')}
            </p>
          </motion.div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => {
            const isCurrent = !planLoading && currentPlan === plan.id
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex flex-col rounded-[32px] p-9 relative transition-all duration-500 ${plan.highlight ? 'card-highlight border-glow' : 'card-glass'}`}
                style={plan.highlight ? { boxShadow: '0 24px 64px rgba(124,58,237,0.18)', background: 'rgba(255,255,255,0.03)' } : {}}
              >
                {/* Most Popular badge */}
                {plan.highlight && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <div className="px-5 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-[0.15em] animate-pulse-glow"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 8px 24px rgba(124,58,237,0.5)' }}>
                      {t('pricing_popular')}
                    </div>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <div className="absolute top-5 right-5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                    ✓ Current Plan
                  </div>
                )}

                <div className="mb-8">
                  <h2 className="text-2xl font-black mb-2" style={{ color: plan.color }}>{plan.name}</h2>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-5xl font-black tracking-tighter" style={{ color: 'var(--color-text-primary)' }}>{plan.price}</span>
                    <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>/{plan.period}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{plan.description}</p>
                </div>

                <div className="h-px mb-8 opacity-20" style={{ background: plan.highlight ? plan.color : 'var(--color-text-muted)' }} />

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map(({ text, ok }, idx) => (
                    <li key={idx} className="flex items-center gap-4 text-sm font-medium">
                      <div className="shrink-0 w-6 h-6 rounded-xl flex items-center justify-center transition-all"
                        style={{
                          background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                          color:      ok ? '#10b981' : 'var(--color-text-muted)',
                          border:     `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                        {ok ? <span className="scale-125">✓</span> : <span className="scale-90">✕</span>}
                      </div>
                      <span style={{ color: ok ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan.action === 'checkout' ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={isCurrent || checkoutLoading === plan.planKey}
                    onClick={() => plan.planKey && handleCheckout(plan.planKey)}
                    className={`btn ${plan.btnClass} btn-lg w-full flex items-center justify-center gap-2`}
                    style={{ opacity: isCurrent ? 0.5 : 1 }}
                  >
                    {checkoutLoading === plan.planKey ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isCurrent ? '✓ Active' : plan.cta}
                  </motion.button>
                ) : plan.action === 'mail' ? (
                  <a href={(plan as { href?: string }).href} className={`btn ${plan.btnClass} btn-lg w-full`}>
                    {plan.cta}
                  </a>
                ) : (
                  <Link href={(plan as { href?: string }).href ?? '#'} className={`btn ${plan.btnClass} btn-lg w-full`}>
                    {plan.cta}
                  </Link>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Footer info */}
        <div className="mt-24 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <span className="text-xl">💬</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {t('pricing_queries')}{' '}
              <a href="mailto:hello@al-ureef.com" className="gradient-text-primary font-black">{t('pricing_contact')}</a>
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] font-black" style={{ color: 'var(--color-text-muted)' }}>
            {t('pricing_terms')}
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link href="/legal/terms" className="text-xs font-bold hover:underline" style={{ color: 'var(--color-text-muted)' }}>Terms</Link>
            <span style={{ color: 'var(--color-text-muted)' }}>·</span>
            <Link href="/legal/privacy" className="text-xs font-bold hover:underline" style={{ color: 'var(--color-text-muted)' }}>Privacy</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
