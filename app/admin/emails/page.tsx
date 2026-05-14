'use client'

import { useState } from 'react'

export default function EmailPreviewPage() {
  const [activeTab, setActiveTab] = useState<'welcome' | 'pro'>('welcome')

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-black gradient-text-primary">معاينة البريد الإلكتروني</h1>
        <p className="text-gray-400 mt-2">عرض ومعاينة القوالب المرسلة عبر Resend</p>
      </div>

      <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('welcome')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'welcome' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:bg-white/5'
          }`}
        >
          ترحيب (Welcome)
        </button>
        <button
          onClick={() => setActiveTab('pro')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'pro' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:bg-white/5'
          }`}
        >
          تفعيل Pro
        </button>
      </div>

      <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl min-h-[600px] border border-gray-100">
        <iframe
          srcDoc={activeTab === 'welcome' ? welcomeHtml : proHtml}
          className="w-full h-[800px] border-none"
          title="Email Preview"
        />
      </div>
    </div>
  )
}

const welcomeHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#06061a;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:40px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#7c3aed,#ec4899);margin-bottom:20px;">
        <span style="font-size:28px;color:white;font-weight:900;">ع</span>
      </div>
      <h1 style="color:white;font-size:28px;font-weight:900;margin:0 0 8px;">العُريف</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">منصة ألعاب المعلومات التفاعلية</p>
    </div>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;margin-bottom:24px;">
      <h2 style="color:white;font-size:22px;font-weight:900;margin:0 0 12px;">أهلاً وسهلاً، مستخدم جديد! 🎉</h2>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;margin:0 0 24px;">
        يسعدنا انضمامك إلى منصة <strong style="color:white;">العُريف</strong> — المنصة الأولى لألعاب المعلومات التفاعلية باللغة العربية.
      </p>
      <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:16px;padding:20px;margin-bottom:28px;">
        <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 8px;">ما يمكنك فعله الآن</p>
        <ul style="color:rgba(255,255,255,0.7);font-size:14px;line-height:2;margin:0;padding-right:20px;">
          <li>🎮 إنشاء جلسة محلية أو عن بُعد</li>
          <li>🤖 توليد أسئلة بالذكاء الاصطناعي</li>
          <li>🏆 متابعة نتائج الفرق بشكل فوري</li>
        </ul>
      </div>
      <a href="#"
        style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;text-decoration:none;padding:16px 32px;border-radius:14px;font-size:15px;font-weight:900;">
        ابدأ الآن ←
      </a>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;">
      حُصّن بـ العُريف ·
      <a href="#" style="color:rgba(255,255,255,0.3);">سياسة الخصوصية</a>
    </p>
  </div>
</body>
</html>
`

const proHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#06061a;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:40px;">
      <div style="display:inline-block;padding:6px 16px;border-radius:100px;background:linear-gradient(135deg,#7c3aed,#ec4899);margin-bottom:20px;">
        <span style="color:white;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;">PRO MEMBER</span>
      </div>
      <h1 style="color:white;font-size:28px;font-weight:900;margin:0;">✨ اشتراكك فعّال!</h1>
    </div>
    <div style="background:rgba(255,255,255,0.04);border:1px solid #7c3aed30;border-radius:24px;padding:40px;margin-bottom:24px;">
      <h2 style="color:white;font-size:20px;font-weight:900;margin:0 0 12px;">مبروك! 🎊</h2>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;margin:0 0 28px;">
        تم تفعيل اشتراك <strong style="color:#7c3aed;">العُريف Pro</strong> بنجاح.
      </p>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;margin-bottom:28px;">
        <ul style="color:rgba(255,255,255,0.7);font-size:14px;line-height:2.2;margin:0;padding-right:20px;list-style:none;">
          <li>✅ جلسات لا محدودة</li>
          <li>✅ حتى 4 فرق في كل جلسة</li>
          <li>✅ توليد أسئلة AI مخصصة</li>
          <li>✅ تجربة بدون إعلانات</li>
        </ul>
      </div>
      <a href="#"
        style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;text-decoration:none;padding:16px 32px;border-radius:14px;font-size:15px;font-weight:900;">
        انطلق إلى لوحة التحكم ←
      </a>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;">
      <a href="mailto:hello@al-ureef.com" style="color:rgba(255,255,255,0.4);">hello@al-ureef.com</a>
    </p>
  </div>
</body>
</html>
`
