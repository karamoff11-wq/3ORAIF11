import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'الأسعار | العُريف',
  description: 'خطط أسعار العُريف — ابدأ مجاناً، وسّع بلا حدود',
}

const PLANS = [
  {
    id: 'free',
    name: 'مجاني',
    price: '$0',
    period: 'للأبد',
    description: 'ابدأ رحلتك وجرّب المنصة',
    color: 'var(--color-text-secondary)',
    highlight: false,
    features: [
      { text: 'جلسة واحدة مجانية', ok: true },
      { text: 'وضع اللعب المحلي', ok: true },
      { text: '60+ سؤال متاح', ok: true },
      { text: 'حتى فريقين', ok: true },
      { text: 'وضع اللعب عن بُعد', ok: false },
      { text: 'جلسات غير محدودة', ok: false },
      { text: 'إزالة الإعلانات', ok: false },
    ],
    cta: 'ابدأ مجاناً',
    href: '/auth/register',
    btnClass: 'btn-ghost',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: 'شهرياً',
    description: 'للمضيفين الجادين والمجموعات النشطة',
    color: 'var(--color-primary-light)',
    highlight: true,
    features: [
      { text: 'جلسات غير محدودة', ok: true },
      { text: 'وضع اللعب المحلي والبعيد', ok: true },
      { text: '60+ سؤال + إضافة أسئلتك', ok: true },
      { text: 'حتى 4 فرق', ok: true },
      { text: 'إزالة الإعلانات', ok: true },
      { text: 'تخصيص الثيم واللوغو', ok: true },
      { text: 'دعم أولوي', ok: true },
    ],
    cta: 'اشترك الآن',
    href: '/auth/register?plan=pro',
    btnClass: 'btn-primary',
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    period: 'شهرياً',
    description: 'للشركات والمدارس والفعاليات الكبيرة',
    color: 'var(--color-cyan)',
    highlight: false,
    features: [
      { text: 'كل مزايا Pro', ok: true },
      { text: 'حتى 10 فرق في الجلسة', ok: true },
      { text: 'لوحة إدارة مخصصة', ok: true },
      { text: 'تقارير وإحصاءات متقدمة', ok: true },
      { text: 'إضافة شعار الشركة', ok: true },
      { text: 'API للتكامل مع أنظمتك', ok: true },
      { text: 'دعم على مدار الساعة', ok: true },
    ],
    cta: 'تواصل معنا',
    href: 'mailto:hello@al-ureef.com',
    btnClass: 'btn-cyan',
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen py-24 px-4 relative">
      {/* Background ambient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle,#06b6d4,transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20 animate-slide-up">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-10 px-5 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
            ← العودة للرئيسية
          </Link>
          <h1 className="text-5xl md:text-6xl font-black mb-6 gradient-text-primary tracking-tight">اختر خطتك المثالية</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            ابدأ مجاناً اليوم واستمتع بجلسات تريفيا لا تُنسى مع أصدقائك
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-[32px] p-9 relative transition-all duration-500 animate-slide-up ${plan.highlight ? 'card-highlight border-glow' : 'card-glass'}`}
              style={{
                animationDelay: `${(i + 1) * 100}ms`,
                ...(plan.highlight ? {
                   boxShadow: '0 24px 64px rgba(124,58,237,0.18)',
                   background: 'rgba(255,255,255,0.03)'
                } : {})
              }}
            >
              {plan.highlight && (
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                   <div className="px-5 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-[0.15em] animate-pulse-glow"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 8px 24px rgba(124,58,237,0.5)' }}>
                    الأكثر شعبية ✨
                  </div>
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

              {/* Divider */}
              <div className="h-px mb-8 opacity-20" style={{ background: plan.highlight ? plan.color : 'var(--color-text-muted)' }} />

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map(({ text, ok }) => (
                  <li key={text} className="flex items-center gap-4 text-sm font-medium">
                    <div className="shrink-0 w-6 h-6 rounded-xl flex items-center justify-center transition-all"
                      style={{
                        background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                        color: ok ? '#10b981' : 'var(--color-text-muted)',
                        border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`
                      }}>
                      {ok ? <span className="scale-125">✓</span> : <span className="scale-90">✕</span>}
                    </div>
                    <span style={{ color: ok ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className={`btn ${plan.btnClass} btn-lg w-full`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-24 text-center animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <span className="text-xl">💬</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              هل لديك استفسارات خاصة؟{' '}
              <a href="mailto:hello@al-ureef.com" className="gradient-text-primary font-black">تواصل معنا الآن</a>
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] font-black" style={{ color: 'var(--color-text-muted)' }}>
            تطبق الشروط والأحكام
          </p>
        </div>
      </div>
    </main>
  )
}
