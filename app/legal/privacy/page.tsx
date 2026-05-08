'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'

export default function PrivacyPage() {
  const { accentColor, themeMode, lang } = useFeedbackStore()
  const theme = themeMode === 'light' ? 'light' : 'dark'
  const t = useTranslator()
  const dir = lang === 'AR' ? 'rtl' : 'ltr'

  const sections = lang === 'AR' ? [
    {
      icon: '🗂️',
      title: '١. المعلومات التي نجمعها',
      body: 'نجمع المعلومات التي تقدمها مباشرةً عند إنشاء حسابك (الاسم، البريد الإلكتروني، تاريخ الميلاد). كما نجمع بيانات الاستخدام مثل الجلسات التي تنشئها والفئات التي تختارها، لتحسين تجربتك.',
    },
    {
      icon: '🔒',
      title: '٢. كيف نستخدم معلوماتك',
      body: 'نستخدم بياناتك لتشغيل المنصة، وتخصيص تجربتك، وإرسال رسائل بريدية مرتبطة بالخدمة (كتأكيد التسجيل واستعادة كلمة المرور). لا نبيع بياناتك لأي طرف ثالث.',
    },
    {
      icon: '🍪',
      title: '٣. ملفات تعريف الارتباط',
      body: 'نستخدم ملفات الارتباط الضرورية للحفاظ على جلسة تسجيل دخولك وتفضيلاتك. لا نستخدم ملفات تتبع إعلانية من طرف ثالث.',
    },
    {
      icon: '🤝',
      title: '٤. مشاركة البيانات',
      body: 'نشارك بياناتك فقط مع مزودي الخدمة الضروريين لتشغيل المنصة (مثل Supabase للتخزين و Google للمصادقة)، وذلك وفق سياساتهم الخاصة.',
    },
    {
      icon: '🌍',
      title: '٥. نقل البيانات الدولي',
      body: 'قد تُخزَّن بياناتك وتُعالَج في دول أخرى حيث توجد خوادم مزودي الخدمة. نضمن وجود ضمانات كافية لحماية بياناتك.',
    },
    {
      icon: '👤',
      title: '٦. حقوقك',
      body: 'يحق لك طلب الاطلاع على بياناتك أو تعديلها أو حذفها في أي وقت. يمكنك ممارسة هذه الحقوق بالتواصل معنا على البريد المذكور أدناه.',
    },
    {
      icon: '🔐',
      title: '٧. أمان البيانات',
      body: 'نطبّق معايير أمان صارمة لحماية بياناتك، بما في ذلك التشفير والمصادقة الآمنة وسياسات التحكم في الوصول. ومع ذلك، لا يمكن ضمان الأمان الكامل على الإنترنت.',
    },
    {
      icon: '📅',
      title: '٨. الاحتفاظ بالبيانات',
      body: 'نحتفظ ببياناتك طالما حسابك نشط. إذا طلبت حذف حسابك، نقوم بحذف بياناتك خلال 30 يوماً، مع الاحتفاظ بما يلزم قانونياً.',
    },
  ] : [
    {
      icon: '🗂️',
      title: '1. Information We Collect',
      body: 'We collect information you provide when creating your account (name, email, date of birth). We also collect usage data such as sessions you create and categories you select to improve your experience.',
    },
    {
      icon: '🔒',
      title: '2. How We Use Your Information',
      body: 'We use your data to operate the platform, personalize your experience, and send service-related emails (like registration confirmation and password reset). We do not sell your data to third parties.',
    },
    {
      icon: '🍪',
      title: '3. Cookies',
      body: 'We use necessary cookies to maintain your login session and preferences. We do not use third-party advertising tracking cookies.',
    },
    {
      icon: '🤝',
      title: '4. Data Sharing',
      body: 'We share your data only with service providers necessary to operate the platform (such as Supabase for storage and Google for authentication), subject to their respective policies.',
    },
    {
      icon: '🌍',
      title: '5. International Data Transfers',
      body: 'Your data may be stored and processed in countries where our service providers have servers. We ensure adequate safeguards are in place to protect your data.',
    },
    {
      icon: '👤',
      title: '6. Your Rights',
      body: 'You have the right to access, correct, or delete your data at any time. You can exercise these rights by contacting us at the email address below.',
    },
    {
      icon: '🔐',
      title: '7. Data Security',
      body: 'We apply strict security measures to protect your data, including encryption, secure authentication, and access control policies. However, no method of internet transmission is 100% secure.',
    },
    {
      icon: '📅',
      title: '8. Data Retention',
      body: 'We retain your data as long as your account is active. If you request account deletion, we delete your data within 30 days, retaining only what is legally required.',
    },
  ]

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#06061a] text-white' : 'bg-slate-50 text-slate-900'}`}
      style={{ direction: dir }}>

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.05] blur-3xl"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-20">
        {/* Back */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/"
            className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-12 px-4 py-2 rounded-xl transition-all hover:scale-105 ${
              theme === 'light' ? 'text-slate-500 bg-slate-100 hover:bg-slate-200' : 'text-white/40 bg-white/[0.04] hover:bg-white/[0.08]'
            }`}>
            ← {t('legal_back')}
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="mb-12">
            <div className="text-5xl mb-4">🔏</div>
            <h1 className={`text-4xl font-black mb-3 tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {t('legal_privacy_title')}
            </h1>
            <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-400' : 'text-white/30'}`}>
              {t('legal_last_updated')} {lang === 'AR' ? 'مايو ٢٠٢٦' : 'May 2026'}
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                className={`rounded-3xl p-8 border flex gap-5 ${
                  theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'bg-white/[0.02] border-white/[0.06]'
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{section.icon}</span>
                <div>
                  <h2 className={`text-base font-black mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {section.title}
                  </h2>
                  <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-white/50'}`}>
                    {section.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className={`mt-16 pt-8 border-t text-center ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
              {lang === 'AR' ? 'للاستفسار تواصل معنا:' : 'Privacy questions? Contact:'}{' '}
              <a href="mailto:privacy@al-ureef.com" className="font-black hover:underline" style={{ color: accentColor }}>
                privacy@al-ureef.com
              </a>
            </p>
            <p className="mt-4">
              <Link href="/legal/terms" className={`text-xs font-bold hover:underline ${theme === 'light' ? 'text-slate-400' : 'text-white/30'}`}>
                {t('legal_terms_title')} →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
