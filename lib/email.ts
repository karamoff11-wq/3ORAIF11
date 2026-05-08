// lib/email.ts
// Resend transactional email utility
// Docs: https://resend.com/docs/api-reference/emails/send-email

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'العُريف <noreply@al-ureef.com>'

// ── Email: Welcome on Signup ────────────────────────────────────────
export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  const { data, error } = await resend.emails.send({
    from:    FROM_ADDRESS,
    to:      [to],
    subject: `مرحباً بك في العُريف 🎉 | Welcome to Al-Arif`,
    html:    welcomeTemplate(name),
  })

  if (error) console.error('[Email] Welcome email failed:', error)
  return { data, error }
}

// ── Email: Pro Subscription Confirmed ─────────────────────────────
export async function sendProConfirmationEmail({ to, name, plan }: {
  to: string; name: string; plan: 'pro' | 'team'
}) {
  const { data, error } = await resend.emails.send({
    from:    FROM_ADDRESS,
    to:      [to],
    subject: `تم تفعيل اشتراكك في العُريف ✨ | Pro Subscription Active`,
    html:    proConfirmTemplate(name, plan),
  })

  if (error) console.error('[Email] Pro confirmation email failed:', error)
  return { data, error }
}

// ── Welcome Email Template ─────────────────────────────────────────
function welcomeTemplate(name: string): string {
  const username = name.split('@')[0]
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مرحباً في العُريف</title>
</head>
<body style="margin:0;padding:0;background:#06061a;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#7c3aed,#ec4899);margin-bottom:20px;">
        <span style="font-size:28px;color:white;font-weight:900;">ع</span>
      </div>
      <h1 style="color:white;font-size:28px;font-weight:900;margin:0 0 8px;">العُريف</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">منصة ألعاب المعلومات التفاعلية</p>
    </div>

    <!-- Card -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;margin-bottom:24px;">
      <h2 style="color:white;font-size:22px;font-weight:900;margin:0 0 12px;">
        أهلاً وسهلاً، ${username}! 🎉
      </h2>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;margin:0 0 24px;">
        يسعدنا انضمامك إلى منصة <strong style="color:white;">العُريف</strong> — المنصة الأولى لألعاب المعلومات التفاعلية باللغة العربية. الآن يمكنك إنشاء جلسات ترفيهية مع فريقك في أي مكان!
      </p>
      <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:16px;padding:20px;margin-bottom:28px;">
        <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 8px;">ما يمكنك فعله الآن</p>
        <ul style="color:rgba(255,255,255,0.7);font-size:14px;line-height:2;margin:0;padding-right:20px;">
          <li>🎮 إنشاء جلسة محلية أو عن بُعد</li>
          <li>🤖 توليد أسئلة بالذكاء الاصطناعي</li>
          <li>🏆 متابعة نتائج الفرق بشكل فوري</li>
        </ul>
      </div>
      <a href="https://abu-al-areef-trivia-main.vercel.app/dashboard"
        style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;text-decoration:none;padding:16px 32px;border-radius:14px;font-size:15px;font-weight:900;">
        ابدأ الآن ←
      </a>
    </div>

    <!-- Footer -->
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;">
      حُصّن بـ العُريف · 
      <a href="https://abu-al-areef-trivia-main.vercel.app/legal/privacy" style="color:rgba(255,255,255,0.3);">سياسة الخصوصية</a>
    </p>
  </div>
</body>
</html>`
}

// ── Pro Confirmation Template ──────────────────────────────────────
function proConfirmTemplate(name: string, plan: 'pro' | 'team'): string {
  const username = name.split('@')[0]
  const planLabel = plan === 'team' ? 'Team' : 'Pro'
  const planColor = plan === 'team' ? '#06b6d4' : '#7c3aed'

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تم تفعيل اشتراكك</title>
</head>
<body style="margin:0;padding:0;background:#06061a;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <div style="display:inline-block;padding:6px 16px;border-radius:100px;background:linear-gradient(135deg,${planColor},#ec4899);margin-bottom:20px;">
        <span style="color:white;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;">${planLabel} MEMBER</span>
      </div>
      <h1 style="color:white;font-size:28px;font-weight:900;margin:0;">✨ اشتراكك فعّال!</h1>
    </div>

    <!-- Card -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid ${planColor}30;border-radius:24px;padding:40px;margin-bottom:24px;box-shadow:0 0 60px ${planColor}15;">
      <h2 style="color:white;font-size:20px;font-weight:900;margin:0 0 12px;">
        مبروك ${username}! 🎊
      </h2>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;margin:0 0 28px;">
        تم تفعيل اشتراك <strong style="color:${planColor};">العُريف ${planLabel}</strong> بنجاح. يمكنك الآن الاستمتاع بجميع المزايا المتقدمة.
      </p>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;margin-bottom:28px;">
        <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 12px;">مزاياك الجديدة</p>
        <ul style="color:rgba(255,255,255,0.7);font-size:14px;line-height:2.2;margin:0;padding-right:20px;list-style:none;">
          <li>✅ جلسات لا محدودة</li>
          <li>✅ حتى ${plan === 'team' ? '10' : '4'} فرق في كل جلسة</li>
          <li>✅ توليد أسئلة AI مخصصة</li>
          <li>✅ تجربة بدون إعلانات</li>
          ${plan === 'team' ? '<li>✅ لوحة إدارة متقدمة</li>' : ''}
        </ul>
      </div>
      <a href="https://abu-al-areef-trivia-main.vercel.app/dashboard"
        style="display:block;text-align:center;background:linear-gradient(135deg,${planColor},#ec4899);color:white;text-decoration:none;padding:16px 32px;border-radius:14px;font-size:15px;font-weight:900;">
        انطلق إلى لوحة التحكم ←
      </a>
    </div>

    <!-- Footer -->
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;">
      لإلغاء اشتراكك أو الاستفسار: 
      <a href="mailto:hello@al-ureef.com" style="color:rgba(255,255,255,0.4);">hello@al-ureef.com</a>
    </p>
  </div>
</body>
</html>`
}
