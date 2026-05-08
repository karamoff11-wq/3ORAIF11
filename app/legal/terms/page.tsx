'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'

export default function TermsPage() {
  const { accentColor, themeMode, lang } = useFeedbackStore()
  const theme = themeMode === 'light' ? 'light' : 'dark'
  const t = useTranslator()
  const dir = lang === 'AR' ? 'rtl' : 'ltr'

  const sections = lang === 'AR' ? [
    {
      title: '١. قبول الشروط',
      body: 'باستخدامك لمنصة العُريف، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام المنصة.',
    },
    {
      title: '٢. وصف الخدمة',
      body: 'العُريف هي منصة ألعاب معلومات تفاعلية تتيح للمستخدمين إنشاء جلسات ترفيهية وتنافسية. تتضمن الخدمة إنشاء الأسئلة بالذكاء الاصطناعي وإدارة الجلسات والتحكم في الفرق.',
    },
    {
      title: '٣. حسابات المستخدمين',
      body: 'يجب أن تكون المعلومات المقدمة عند التسجيل دقيقة وصحيحة. أنت مسؤول عن الحفاظ على سرية بيانات حسابك، وعن أي نشاط يتم تحت حسابك.',
    },
    {
      title: '٤. الاستخدام المقبول',
      body: 'يُحظر استخدام المنصة لأي غرض غير قانوني أو ضار، بما في ذلك نشر محتوى مسيء أو محاولة اختراق المنصة أو إساءة استخدام الذكاء الاصطناعي لتوليد محتوى مسيء.',
    },
    {
      title: '٥. الملكية الفكرية',
      body: 'جميع المحتويات والتصاميم والبرمجيات المتعلقة بمنصة العُريف هي ملكية حصرية للمنصة ومحمية بموجب قوانين الملكية الفكرية.',
    },
    {
      title: '٦. الاشتراكات والمدفوعات',
      body: 'الاشتراكات المدفوعة تُجدَّد تلقائياً. يحق لك إلغاء اشتراكك في أي وقت. لا يتم استرداد الرسوم عن الفترات المنقضية.',
    },
    {
      title: '٧. إنهاء الحساب',
      body: 'نحتفظ بالحق في إنهاء أو تعليق حسابك في حال انتهاك هذه الشروط، مع أو بدون إشعار مسبق.',
    },
    {
      title: '٨. تغييرات الشروط',
      body: 'قد نقوم بتحديث هذه الشروط من وقت لآخر. سيتم إبلاغك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة.',
    },
  ] : [
    {
      title: '1. Acceptance of Terms',
      body: 'By using the Al-Arif platform, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, please do not use the platform.',
    },
    {
      title: '2. Description of Service',
      body: 'Al-Arif is an interactive trivia gaming platform that allows users to create entertaining and competitive sessions. The service includes AI-generated questions, session management, and team controls.',
    },
    {
      title: '3. User Accounts',
      body: 'Information provided during registration must be accurate and truthful. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.',
    },
    {
      title: '4. Acceptable Use',
      body: 'You may not use the platform for any unlawful or harmful purpose, including posting offensive content, attempting to breach platform security, or misusing AI to generate harmful content.',
    },
    {
      title: '5. Intellectual Property',
      body: 'All content, designs, and software related to Al-Arif are the exclusive property of the platform and protected under intellectual property laws.',
    },
    {
      title: '6. Subscriptions & Payments',
      body: 'Paid subscriptions renew automatically. You may cancel at any time. Fees for elapsed periods are non-refundable.',
    },
    {
      title: '7. Account Termination',
      body: 'We reserve the right to terminate or suspend your account for violations of these terms, with or without prior notice.',
    },
    {
      title: '8. Changes to Terms',
      body: 'We may update these Terms periodically. You will be notified of material changes via email or an in-platform notice.',
    },
  ]

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#06061a] text-white' : 'bg-slate-50 text-slate-900'}`}
      style={{ direction: dir }}>

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.05] blur-3xl"
          style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }} />
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
            <div className="text-5xl mb-4">📋</div>
            <h1 className={`text-4xl font-black mb-3 tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {t('legal_terms_title')}
            </h1>
            <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-400' : 'text-white/30'}`}>
              {t('legal_last_updated')} {lang === 'AR' ? 'مايو ٢٠٢٦' : 'May 2026'}
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                className={`rounded-3xl p-8 border ${
                  theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'bg-white/[0.02] border-white/[0.06]'
                }`}
              >
                <h2 className={`text-lg font-black mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
                  style={{ color: i === 0 ? accentColor : undefined }}>
                  {section.title}
                </h2>
                <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-white/50'}`}>
                  {section.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className={`mt-16 pt-8 border-t text-center ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
              {lang === 'AR' ? 'للاستفسار تواصل معنا:' : 'Questions? Contact us:'}{' '}
              <a href="mailto:hello@al-ureef.com" className="font-black hover:underline" style={{ color: accentColor }}>
                hello@al-ureef.com
              </a>
            </p>
            <p className="mt-4">
              <Link href="/legal/privacy" className={`text-xs font-bold hover:underline ${theme === 'light' ? 'text-slate-400' : 'text-white/30'}`}>
                {t('legal_privacy_title')} →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
