'use client'

import Link from 'next/link'
import { useTranslator } from '@/lib/i18n'
import { useFeedbackStore } from '@/store/feedbackStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { PADDLE_CONFIG } from '@/lib/paddle'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type PackId = 'single' | 'five' | 'ten'

interface Pack {
  id:           PackId
  sessions:     number
  price:        number       // actual charged price
  wasPrice:     number       // crossed-out price
  perSession:   number       // price ÷ sessions
  wasPer:       number       // wasPrice ÷ sessions
  savePct:      number       // (1 - price/wasPrice) * 100
  badge?:       string       // e.g. "الأكثر شعبية"
  paddlePriceId?: string     // fill from your Paddle dashboard
  highlight:    boolean
}

// ─────────────────────────────────────────────
// Pack definitions
// ─────────────────────────────────────────────
const PACKS: Pack[] = [
  {
    id:         'single',
    sessions:   1,
    price:      1.99,
    wasPrice:   4.99,
    perSession: 1.99,
    wasPer:     4.99,
    savePct:    60,
    highlight:  false,
    paddlePriceId: PADDLE_CONFIG.prices.single,
  },
  {
    id:         'five',
    sessions:   5,
    price:      9.99,
    wasPrice:   24.99,
    perSession: 2.00,
    wasPer:     5.00,
    savePct:    60,
    badge:      '★',  // shown as popular
    highlight:  true,
    paddlePriceId: PADDLE_CONFIG.prices.five,
  },
  {
    id:         'ten',
    sessions:   10,
    price:      19.99,
    wasPrice:   49.99,
    perSession: 2.00,
    wasPer:     5.00,
    savePct:    60,
    highlight:  false,
    paddlePriceId: PADDLE_CONFIG.prices.ten,
  },
]

// ─────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3"/>
    </svg>
  )
}
function CrossIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="2" y1="2" x2="10" y2="10"/>
      <line x1="10" y1="2" x2="2" y2="10"/>
    </svg>
  )
}
function GamepadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
      <line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
      <rect x="2" y="6" width="20" height="12" rx="2"/>
    </svg>
  )
}
function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-4.2-7.8-2.1 2.1M9.3 14.7l-2.1 2.1m12.6 0-2.1-2.1M9.3 9.3 7.2 7.2"/>
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}
function InfinityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/>
      <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
    </svg>
  )
}
function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  )
}
function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

// ─────────────────────────────────────────────
// Animated counter
// ─────────────────────────────────────────────
function AnimatedPrice({ value, prefix = '$' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    if (prevRef.current === value) return
    const start = prevRef.current
    const end   = value
    const dur   = 420
    const t0    = performance.now()
    const step  = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(+(start + (end - start) * ease).toFixed(2))
      if (p < 1) requestAnimationFrame(step)
      else { setDisplay(end); prevRef.current = end }
    }
    requestAnimationFrame(step)
  }, [value])

  return <>{prefix}{display.toFixed(2)}</>
}

// ─────────────────────────────────────────────
// Session credit indicator (shown if user has credits)
// ─────────────────────────────────────────────
function SessionCredits({ credits, lang }: { credits: number; lang: string }) {
  const isRtl = lang === 'AR'
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl mb-8"
      style={{
        background:    'var(--bg-card)',
        border:        '1px solid var(--border-card)',
        backdropFilter:'blur(16px)',
      }}
    >
      <div className="flex items-center gap-1.5">
        {Array.from({ length: Math.min(credits, 5) }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 400 }}
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }}
          />
        ))}
        {credits > 5 && (
          <span className="text-xs font-black" style={{ color: 'var(--accent)' }}>+{credits - 5}</span>
        )}
      </div>
      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        {isRtl
          ? `لديك ${credits} ${credits === 1 ? 'جلسة' : 'جلسات'} متبقية`
          : `You have ${credits} session${credits !== 1 ? 's' : ''} remaining`
        }
      </span>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Pack Card
// ─────────────────────────────────────────────
function PackCard({
  pack, index, onBuy, loading, isRtl, t, accentColor, userCredits,
}: {
  pack:         Pack
  index:        number
  onBuy:        (pack: Pack) => void
  loading:      boolean
  isRtl:        boolean
  t:            any
  accentColor:  string
  userCredits:  number
}) {
  const packLabels: Record<PackId, { name: string; nameen: string; desc: string; descen: string }> = {
    single: {
      name:   'جلسة واحدة',
      nameen: 'Single Session',
      desc:   'العب جلسة واحدة كاملة مع أصدقائك',
      descen: 'Play one full session with your friends',
    },
    five: {
      name:   'حزمة ٥ جلسات',
      nameen: '5-Session Pack',
      desc:   'وفّر أكثر، العب أكثر — الأفضل قيمة',
      descen: 'Save more, play more — best value',
    },
    ten: {
      name:   'حزمة ١٠ جلسات',
      nameen: '10-Session Pack',
      desc:   'للمجموعات النشطة — توفير مضمون',
      descen: 'For active groups — guaranteed savings',
    },
  }

  const label  = packLabels[pack.id]
  const name   = isRtl ? label.name   : label.nameen
  const desc   = isRtl ? label.desc   : label.descen
  const isPopular = pack.id === 'five'

  const featureRows = pack.id === 'single'
    ? [
        { ok: true,  ar: 'جلسة لعب كاملة بدون قيود',      en: 'Full unrestricted game session' },
        { ok: true,  ar: 'توليد أسئلة ذكي بكل الفئات',     en: 'AI-powered questions (All cats)' },
        { ok: true,  ar: 'لوحة تحكم تفاعلية للمضيف',       en: 'Interactive Host Dashboard'     },
        { ok: true,  ar: 'رصيد يبقى معك للأبد',           en: 'Credits that never expire'     },
        { ok: false, ar: 'توفير حزم المجموعات',            en: 'Bulk group savings'            },
        { ok: false, ar: 'أولوية في الدعم الفني',          en: 'Priority Technical Support'    },
      ]
    : pack.id === 'five'
    ? [
        { ok: true,  ar: '٥ جلسات لعب احترافية',          en: '5 Professional Game Sessions'  },
        { ok: true,  ar: 'توليد أسئلة ذكي بكل الفئات',     en: 'AI-powered questions (All cats)' },
        { ok: true,  ar: 'لوحة تحكم تفاعلية للمضيف',       en: 'Interactive Host Dashboard'     },
        { ok: true,  ar: 'رصيد يبقى معك للأبد',           en: 'Credits that never expire'     },
        { ok: true,  ar: 'توفير ٣٣٪ عن السعر الفردي',     en: 'Save 33% vs Single Session'    },
        { ok: false, ar: 'أولوية في الدعم الفني',          en: 'Priority Technical Support'    },
      ]
    : [
        { ok: true,  ar: '١٠ جلسات لعب احترافية',         en: '10 Professional Game Sessions' },
        { ok: true,  ar: 'توليد أسئلة ذكي بكل الفئات',     en: 'AI-powered questions (All cats)' },
        { ok: true,  ar: 'لوحة تحكم تفاعلية للمضيف',       en: 'Interactive Host Dashboard'     },
        { ok: true,  ar: 'رصيد يبقى معك للأبد',           en: 'Credits that never expire'     },
        { ok: true,  ar: 'أفضل قيمة للجلسة الواحدة',       en: 'Best per-session value'        },
        { ok: true,  ar: 'أولوية في الدعم الفني',          en: 'Priority Technical Support'    },
      ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col rounded-3xl"
      style={{
        background:   pack.highlight ? `${accentColor}10` : 'var(--glass-bg)',
        border:       `1px solid ${pack.highlight ? accentColor + '40' : 'var(--glass-border)'}`,
        backdropFilter: 'blur(24px)',
        boxShadow:    pack.highlight
          ? `0 0 0 1px ${accentColor}30, 0 24px 60px ${accentColor}20`
          : 'var(--shadow-card)',
      }}
    >
      {/* Popular Highlight Line */}
      {isPopular && (
        <div
          className="absolute top-0 inset-x-0 h-[2px] rounded-t-3xl z-10"
          style={{ 
            background: `linear-gradient(90deg, transparent, ${accentColor}, #EC4899, transparent)`,
            boxShadow: `0 2px 12px ${accentColor}40`
          }}
        />
      )}
      {isPopular && (
        <div className="absolute -top-3.5 inset-x-0 flex justify-center z-20">
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="px-5 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-[0.25em] flex items-center gap-2"
            style={{ 
              background: `linear-gradient(135deg, ${accentColor}, #EC4899)`,
              boxShadow: `0 10px 25px ${accentColor}50`,
              border: '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {isRtl ? 'الأكثر شعبية' : 'Most Popular'}
          </motion.div>
        </div>
      )}

      {/* Save badge */}
      <div
        className="absolute top-5 end-5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider"
        style={{ background: 'rgba(34,197,94,0.14)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
      >
        {isRtl ? `وفّر ${pack.savePct}%` : `Save ${pack.savePct}%`}
      </div>

      <div className="p-7 flex flex-col flex-1 gap-5 pt-9">

        {/* Icon + name */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}28`, color: accentColor }}
          >
            <GamepadIcon />
          </div>
          <div>
            <h2 className="text-lg font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{name}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
          </div>
        </div>

        {/* Price block */}
        <div>
          {/* Was price */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-bold line-through"
              style={{ color: 'var(--text-tertiary)', textDecorationColor: 'var(--text-tertiary)' }}
            >
              ${pack.wasPrice.toFixed(2)}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(239,68,68,0.7)' }}>
              {isRtl ? 'السعر القديم' : 'was'}
            </span>
          </div>

          {/* Current price */}
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
              ${pack.price.toFixed(2)}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-black" style={{ color: '#A855F7' }}>
                {isRtl ? 'لمرة واحدة' : 'one-time'}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Features */}
        <ul className="flex flex-col gap-2.5 flex-1">
          {featureRows.map((row, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className="mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: row.ok ? 'rgba(34,197,94,0.12)' : 'var(--bg-input)',
                  border:     `1px solid ${row.ok ? 'rgba(34,197,94,0.22)' : 'var(--border-subtle)'}`,
                  color:      row.ok ? '#22c55e' : 'var(--text-tertiary)',
                }}
              >
                {row.ok ? <CheckIcon /> : <CrossIcon />}
              </div>
              <span
                className="text-sm leading-snug"
                style={{ color: row.ok ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              >
                {isRtl ? row.ar : row.en}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onBuy(pack)}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-base text-white transition-all flex items-center justify-center gap-2.5"
          style={{
            background:  pack.highlight
              ? `linear-gradient(135deg, ${accentColor}, #EC4899)`
              : 'var(--bg-card-hover)',
            border:      pack.highlight ? 'none' : '1px solid var(--border-card)',
            color:       pack.highlight ? 'white' : 'var(--text-primary)',
            boxShadow:   pack.highlight ? `0 8px 28px ${accentColor}35` : 'none',
          }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>
                {isRtl
                  ? `اشترِ ${pack.sessions === 1 ? 'جلسة واحدة' : `${pack.sessions} جلسات`}`
                  : `Buy ${pack.sessions} Session${pack.sessions > 1 ? 's' : ''}`
                }
              </span>
              {isRtl ? <ArrowLeftIcon /> : <ArrowRightIcon />}
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Trust Badges
// ─────────────────────────────────────────────
function TrustBar({ isRtl }: { isRtl: boolean }) {
  const items = [
    { icon: <ShieldIcon />,   ar: 'دفع آمن عبر Paddle',       en: 'Secure checkout via Paddle'   },
    { icon: <InfinityIcon />, ar: 'الجلسات لا تنتهي بمرور الوقت', en: 'Sessions never time-out'     },
    { icon: <SparkleIcon />,  ar: 'جميع الفئات متاحة',          en: 'All categories included'     },
  ]
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-14">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
            {isRtl ? item.ar : item.en}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Premium Highlights (Better than the comparison box)
// ─────────────────────────────────────────────
function PremiumHighlights({ isRtl, accentColor }: { isRtl: boolean; accentColor: string }) {
  const items = [
    {
      icon: <GamepadIcon />,
      ar: 'لا اشتراكات شهرية',
      en: 'No Subscriptions',
      subAr: 'ادفع فقط ثمن ما تلعبه، لا فواتير مفاجئة.',
      subEn: 'Only pay for what you play, no hidden fees.',
    },
    {
      icon: <SparkleIcon />,
      ar: 'وصول كامل وفوري',
      en: 'Instant Full Access',
      subAr: 'افتح جميع الأسئلة والفئات فور الشراء.',
      subEn: 'Unlock all categories and features immediately.',
    },
    {
      icon: <InfinityIcon />,
      ar: 'جلساتك ملكك للأبد',
      en: 'Lifetime Validity',
      subAr: 'الجلسات لا تنتهي صلاحيتها أبداً.',
      subEn: 'Your purchased sessions never expire.',
    },
    {
      icon: <ShieldIcon />,
      ar: 'تجربة سينمائية',
      en: 'Cinematic Experience',
      subAr: 'بدون إعلانات، جودة عالية، وتفاعل كامل.',
      subEn: 'No ads, high quality, and full interactivity.',
    },
  ]

  return (
    <div className="mt-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-[24px] text-center flex flex-col items-center gap-3"
            style={{ 
              background: 'var(--glass-bg)', 
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
              style={{ background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}20` }}
            >
              {item.icon}
            </div>
            <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
              {isRtl ? item.ar : item.en}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {isRtl ? item.subAr : item.subEn}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Smart FAQ Accordion
// ─────────────────────────────────────────────
function SmartFAQ({ isRtl, accentColor }: { isRtl: boolean; accentColor: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      q: isRtl ? 'هل تنتهي صلاحية الجلسات التي أشتريها؟' : 'Do my purchased sessions expire?',
      a: isRtl 
        ? 'أبداً. رصيدك ملكك للأبد، الجلسة تُستهلك فقط عندما تضغط على "بدء اللعب" وتنهي الجلسة بنجاح.' 
        : 'Never. Your balance is yours forever. A session is only consumed when you start a game and complete it.',
      icon: <InfinityIcon />
    },
    {
      q: isRtl ? 'ما هو الحد الأقصى للاعبين؟' : 'What is the player limit?',
      a: isRtl 
        ? 'يمكنك إضافة حتى ٤ فرق في الجلسة الواحدة. كل فريق يمكن أن يضم أي عدد من اللاعبين (شخص واحد أو ١٠ أشخاص).' 
        : 'You can have up to 4 teams per session. Each team can have any number of players (from 1 to 10+ people).',
      icon: <GamepadIcon />
    },
    {
      q: isRtl ? 'كيف أتابع رصيد جلساتي المتبقية؟' : 'How do I track my remaining sessions?',
      a: isRtl 
        ? 'ستجد رصيدك دائماً في أعلى لوحة التحكم، كما سيظهر لك تنبيه برصيدك المتبقي في كل مرة تبدأ فيها إعداد لعبة جديدة.' 
        : 'Your balance is always visible at the top of your dashboard, and you will see a reminder whenever you start setting up a new game.',
      icon: <ShieldIcon />
    },
    {
      q: isRtl ? 'ماذا لو واجهت مشكلة تقنية؟' : 'What if I encounter a technical issue?',
      a: isRtl 
        ? 'نحن ملتزمون بتوفير أفضل تجربة لك! بما أن الجلسات توفر قيمة رقمية فورية ولا تنتهي صلاحيتها أبداً، فإن تركيزنا ينصب على تقديم دعم فني استثنائي لضمان استمتاعك باللعبة. إذا واجهت أي تحدي، فريقنا سيعمل معك فوراً حتى يتم حله.' 
        : 'We are committed to your fun! Since our session credits provide instant digital value and never expire, we focus on providing top-tier support to ensure your experience is flawless. If anything feels off, we will work with you until it is perfect.',
      icon: <SparkleIcon />
    }
  ]

  return (
    <div className="mt-24 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>
          {isRtl ? 'كل ما تحتاج معرفته' : 'Everything you need to know'}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => (
          <div 
            key={i}
            className="overflow-hidden rounded-2xl transition-all duration-300"
            style={{ 
              background: 'var(--glass-bg)', 
              border: `1px solid ${openIndex === i ? accentColor + '40' : 'var(--glass-border)'}`,
              boxShadow: openIndex === i ? `0 12px 32px ${accentColor}10` : 'none'
            }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full p-5 flex items-center justify-between text-start gap-4"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: openIndex === i ? accentColor : 'var(--bg-input)', color: openIndex === i ? 'white' : accentColor }}
                >
                  {faq.icon}
                </div>
                <span className="font-bold text-sm" style={{ color: openIndex === i ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {faq.q}
                </span>
              </div>
              <motion.span
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                style={{ color: 'var(--text-tertiary)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </motion.span>
            </button>
            
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="px-5 pb-6 pt-0 ms-14 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PricingClient() {
  const t          = useTranslator()
  const { lang, accentColor, mounted } = useFeedbackStore()
  const isRtl      = lang === 'AR'
  const dir        = isRtl ? 'rtl' : 'ltr'
  const supabase   = useMemo(() => createClient(), [])

  const [paddle,         setPaddle]         = useState<Paddle | null>(null)
  const [userId,         setUserId]         = useState<string | null>(null)
  const [userCredits,    setUserCredits]    = useState<number>(0)
  const [checkoutPack,   setCheckoutPack]   = useState<PackId | null>(null)
  const [successPackId,  setSuccessPackId]  = useState<PackId | null>(null)

  // Load Paddle
  useEffect(() => {
    initializePaddle({
      environment: PADDLE_CONFIG.environment,
      token:       PADDLE_CONFIG.clientToken,
    }).then(p => { if (p) setPaddle(p) })
  }, [])

  // Get user + credits
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)
      if (uid) {
        const { data: profile } = await (supabase.from('profiles') as any)
          .select('session_credits')
          .eq('id', uid)
          .single()
        setUserCredits(profile?.session_credits ?? 0)
      }
    })
  }, [supabase])

  // Check for ?upgrade=success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const plan   = params.get('pack') as PackId | null
    if (params.get('upgrade') === 'success' && plan) {
      setSuccessPackId(plan)
    }
  }, [])

  const handleBuy = async (pack: Pack) => {
    if (!paddle) {
      alert(isRtl ? 'نظام الدفع يتحمّل، جرّب مجدداً خلال ثانية' : 'Payment loading, try again in a second.')
      return
    }
    if (!userId) {
      window.location.href = `/auth/register?pack=${pack.id}`
      return
    }
    if (!pack.paddlePriceId) {
      alert(isRtl ? 'السعر غير مُضبوط بعد' : 'Price not configured yet.')
      return
    }

    setCheckoutPack(pack.id)
    try {
      paddle.Checkout.open({
        items:      [{ priceId: pack.paddlePriceId, quantity: 1 }],
        customData: { user_id: userId, pack_id: pack.id, sessions: pack.sessions },
        settings: {
          successUrl: `${window.location.origin}/pricing?upgrade=success&pack=${pack.id}`,
        },
      })
    } catch (err) {
      console.error('[Paddle] Checkout error:', err)
    } finally {
      setCheckoutPack(null)
    }
  }

  if (!mounted) return null

  return (
    <main
      className="min-h-screen py-20 px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', direction: dir, fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif' }}
    >
      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, -40, 0], y: [0, -40, 60, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[-10%] right-[-5%] w-[55%] h-[55%] rounded-full"
          style={{ background: `radial-gradient(circle, ${accentColor}18, transparent 65%)`, filter: 'blur(100px)' }}
        />
        <motion.div
          animate={{ x: [0, -50, 30, 0], y: [0, 50, -30, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 65%)', filter: 'blur(100px)' }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)`,
            backgroundSize:  '60px 60px',
            maskImage:       'radial-gradient(ellipse 80% 60% at center, black, transparent)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* ── Success toast ── */}
        <AnimatePresence>
          {successPackId && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 inset-x-0 flex justify-center z-50 px-4"
            >
              <div
                className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', backdropFilter: 'blur(20px)' }}
              >
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-black text-sm" style={{ color: '#22c55e' }}>
                    {isRtl ? 'تم الشراء بنجاح!' : 'Purchase successful!'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {isRtl ? 'جلساتك جاهزة في لوحة التحكم' : 'Your sessions are ready in your dashboard'}
                  </p>
                </div>
                <button onClick={() => setSuccessPackId(null)} style={{ color: 'var(--text-tertiary)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Back link ── */}
        <motion.div
          initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all hover:scale-105"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}
          >
            {isRtl ? <ArrowRightIcon /> : <ArrowLeftIcon />}
            {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </motion.div>

        {/* ── Header ── */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* First game free badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider mb-6"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30`, color: accentColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
              {isRtl ? 'أول جلسة مجانية — ثم ادفع فقط ما تحتاجه' : 'First session free — then pay only what you need'}
            </div>

            <h1
              className="text-4xl md:text-6xl font-black mb-5 leading-tight tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {isRtl ? 'اختر حزمتك' : 'Choose Your Pack'}
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, #EC4899)` }}
              >
                {isRtl ? 'ادفع مرة، العب دائمًا' : 'Pay once, play forever'}
              </span>
            </h1>

            <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {isRtl
                ? 'لا قيود ولا اشتراكات 🔥، فقط جلسات ممتعة تستخدمها متى أردت مع العائلة والأصدقاء 👨👩👧👦'
                : 'No limits, no subscriptions 🔥 Just fun sessions to use whenever you want with family and friends 👨‍👩‍👧‍👦'
              }
            </p>
          </motion.div>

          {/* Credits display if logged in */}
          {userCredits > 0 && (
            <div className="flex justify-center mt-6">
              <SessionCredits credits={userCredits} lang={lang} />
            </div>
          )}
        </div>

        {/* ── Pack cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PACKS.map((pack, i) => (
            <PackCard
              key={pack.id}
              pack={pack}
              index={i}
              onBuy={handleBuy}
              loading={checkoutPack === pack.id}
              isRtl={isRtl}
              t={t}
              accentColor={accentColor}
              userCredits={userCredits}
            />
          ))}
        </div>

        {/* ── Premium highlights ── */}
        <PremiumHighlights isRtl={isRtl} accentColor={accentColor} />

        {/* ── Trust bar ── */}
        <TrustBar isRtl={isRtl} />

        {/* ── Smart FAQ ── */}
        <SmartFAQ isRtl={isRtl} accentColor={accentColor} />

        {/* ── Footer ── */}
        <div className="mt-16 text-center pb-10">
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            {isRtl ? 'أي استفسار؟' : 'Any questions?'}{' '}
            <a
              href="mailto:al.3oraif@gmail.com"
              className="font-black"
              style={{ color: accentColor }}
            >
              al.3oraif@gmail.com
            </a>
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/legal/terms" className="text-xs font-bold hover:opacity-70 transition-opacity" style={{ color: 'var(--text-tertiary)' }}>
              {isRtl ? 'الشروط' : 'Terms'}
            </Link>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <Link href="/legal/privacy" className="text-xs font-bold hover:opacity-70 transition-opacity" style={{ color: 'var(--text-tertiary)' }}>
              {isRtl ? 'الخصوصية' : 'Privacy'}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
