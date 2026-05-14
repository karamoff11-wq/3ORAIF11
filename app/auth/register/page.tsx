'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'react-hot-toast'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
type Gender     = 'male' | 'female'
type Step       = 1 | 2 | 3 | 4
type AvailStatus = 'idle' | 'checking' | 'available' | 'taken'

interface Country { code: string; name: string; nameEn: string; iso: string; flag: string }

interface FormErrors {
  username?:        string
  email?:           string
  password?:        string
  confirmPassword?: string
  gender?:          string
  birthdate?:       string
  otp?:             string
}

interface PwStrength {
  score:    0 | 1 | 2 | 3 | 4
  label:    string
  color:    string
  segments: string[]
}

// ─────────────────────────────────────────────────────────────────
// Countries — comprehensive, emoji-flagged, duplicates disambiguated
// ─────────────────────────────────────────────────────────────────
const ALL_COUNTRIES: Country[] = [
  // ── Arab World (priority) ──────────────────────────────────────
  { code: '+970', name: 'فلسطين',              nameEn: 'Palestine',       iso: 'ps', flag: '🇵🇸' },
  { code: '+966', name: 'السعودية',             nameEn: 'Saudi Arabia',    iso: 'sa', flag: '🇸🇦' },
  { code: '+971', name: 'الإمارات',             nameEn: 'UAE',             iso: 'ae', flag: '🇦🇪' },
  { code: '+965', name: 'الكويت',               nameEn: 'Kuwait',          iso: 'kw', flag: '🇰🇼' },
  { code: '+974', name: 'قطر',                  nameEn: 'Qatar',           iso: 'qa', flag: '🇶🇦' },
  { code: '+973', name: 'البحرين',              nameEn: 'Bahrain',         iso: 'bh', flag: '🇧🇭' },
  { code: '+968', name: 'عمان',                 nameEn: 'Oman',            iso: 'om', flag: '🇴🇲' },
  { code: '+962', name: 'الأردن',               nameEn: 'Jordan',          iso: 'jo', flag: '🇯🇴' },
  { code: '+961', name: 'لبنان',                nameEn: 'Lebanon',         iso: 'lb', flag: '🇱🇧' },
  { code: '+964', name: 'العراق',               nameEn: 'Iraq',            iso: 'iq', flag: '🇮🇶' },
  { code: '+20',  name: 'مصر',                  nameEn: 'Egypt',           iso: 'eg', flag: '🇪🇬' },
  { code: '+963', name: 'سوريا',                nameEn: 'Syria',           iso: 'sy', flag: '🇸🇾' },
  { code: '+967', name: 'اليمن',                nameEn: 'Yemen',           iso: 'ye', flag: '🇾🇪' },
  { code: '+218', name: 'ليبيا',                nameEn: 'Libya',           iso: 'ly', flag: '🇱🇾' },
  { code: '+216', name: 'تونس',                 nameEn: 'Tunisia',         iso: 'tn', flag: '🇹🇳' },
  { code: '+213', name: 'الجزائر',              nameEn: 'Algeria',         iso: 'dz', flag: '🇩🇿' },
  { code: '+212', name: 'المغرب',               nameEn: 'Morocco',         iso: 'ma', flag: '🇲🇦' },
  { code: '+249', name: 'السودان',              nameEn: 'Sudan',           iso: 'sd', flag: '🇸🇩' },
  { code: '+252', name: 'الصومال',              nameEn: 'Somalia',         iso: 'so', flag: '🇸🇴' },
  { code: '+222', name: 'موريتانيا',            nameEn: 'Mauritania',      iso: 'mr', flag: '🇲🇷' },
  { code: '+253', name: 'جيبوتي',               nameEn: 'Djibouti',        iso: 'dj', flag: '🇩🇯' },
  { code: '+269', name: 'جزر القمر',            nameEn: 'Comoros',         iso: 'km', flag: '🇰🇲' },
  // ── Caucasus ──────────────────────────────────────────────────
  { code: '+995', name: 'جورجيا',               nameEn: 'Georgia',         iso: 'ge', flag: '🇬🇪' },
  { code: '+374', name: 'أرمينيا',              nameEn: 'Armenia',         iso: 'am', flag: '🇦🇲' },
  { code: '+994', name: 'أذربيجان',             nameEn: 'Azerbaijan',      iso: 'az', flag: '🇦🇿' },
  // ── Africa ────────────────────────────────────────────────────
  { code: '+27',  name: 'جنوب أفريقيا',         nameEn: 'South Africa',    iso: 'za', flag: '🇿🇦' },
  { code: '+234', name: 'نيجيريا',              nameEn: 'Nigeria',         iso: 'ng', flag: '🇳🇬' },
  { code: '+254', name: 'كينيا',                nameEn: 'Kenya',           iso: 'ke', flag: '🇰🇪' },
  { code: '+233', name: 'غانا',                 nameEn: 'Ghana',           iso: 'gh', flag: '🇬🇭' },
  { code: '+251', name: 'إثيوبيا',              nameEn: 'Ethiopia',        iso: 'et', flag: '🇪🇹' },
  { code: '+255', name: 'تنزانيا',              nameEn: 'Tanzania',        iso: 'tz', flag: '🇹🇿' },
  { code: '+256', name: 'أوغندا',               nameEn: 'Uganda',          iso: 'ug', flag: '🇺🇬' },
  { code: '+237', name: 'الكاميرون',            nameEn: 'Cameroon',        iso: 'cm', flag: '🇨🇲' },
  { code: '+221', name: 'السنغال',              nameEn: 'Senegal',         iso: 'sn', flag: '🇸🇳' },
  { code: '+243', name: 'الكونغو الديمقراطية',  nameEn: 'DR Congo',        iso: 'cd', flag: '🇨🇩' },
  { code: '+260', name: 'زامبيا',               nameEn: 'Zambia',          iso: 'zm', flag: '🇿🇲' },
  { code: '+263', name: 'زيمبابوي',             nameEn: 'Zimbabwe',        iso: 'zw', flag: '🇿🇼' },
  { code: '+250', name: 'رواندا',               nameEn: 'Rwanda',          iso: 'rw', flag: '🇷🇼' },
  { code: '+258', name: 'موزمبيق',              nameEn: 'Mozambique',      iso: 'mz', flag: '🇲🇿' },
  // ── Asia ──────────────────────────────────────────────────────
  { code: '+90',  name: 'تركيا',                nameEn: 'Turkey',          iso: 'tr', flag: '🇹🇷' },
  { code: '+98',  name: 'إيران',                nameEn: 'Iran',            iso: 'ir', flag: '🇮🇷' },
  { code: '+92',  name: 'باكستان',              nameEn: 'Pakistan',        iso: 'pk', flag: '🇵🇰' },
  { code: '+91',  name: 'الهند',                nameEn: 'India',           iso: 'in', flag: '🇮🇳' },
  { code: '+880', name: 'بنغلاديش',             nameEn: 'Bangladesh',      iso: 'bd', flag: '🇧🇩' },
  { code: '+94',  name: 'سريلانكا',             nameEn: 'Sri Lanka',       iso: 'lk', flag: '🇱🇰' },
  { code: '+62',  name: 'إندونيسيا',            nameEn: 'Indonesia',       iso: 'id', flag: '🇮🇩' },
  { code: '+60',  name: 'ماليزيا',              nameEn: 'Malaysia',        iso: 'my', flag: '🇲🇾' },
  { code: '+63',  name: 'الفلبين',              nameEn: 'Philippines',     iso: 'ph', flag: '🇵🇭' },
  { code: '+66',  name: 'تايلاند',              nameEn: 'Thailand',        iso: 'th', flag: '🇹🇭' },
  { code: '+84',  name: 'فيتنام',               nameEn: 'Vietnam',         iso: 'vn', flag: '🇻🇳' },
  { code: '+86',  name: 'الصين',                nameEn: 'China',           iso: 'cn', flag: '🇨🇳' },
  { code: '+81',  name: 'اليابان',              nameEn: 'Japan',           iso: 'jp', flag: '🇯🇵' },
  { code: '+82',  name: 'كوريا الجنوبية',       nameEn: 'South Korea',     iso: 'kr', flag: '🇰🇷' },
  { code: '+7',   name: 'روسيا',                nameEn: 'Russia',          iso: 'ru', flag: '🇷🇺' },
  { code: '+7',   name: 'كازاخستان',            nameEn: 'Kazakhstan',      iso: 'kz', flag: '🇰🇿' },
  { code: '+993', name: 'تركمانستان',           nameEn: 'Turkmenistan',    iso: 'tm', flag: '🇹🇲' },
  { code: '+998', name: 'أوزبكستان',            nameEn: 'Uzbekistan',      iso: 'uz', flag: '🇺🇿' },
  { code: '+992', name: 'طاجيكستان',            nameEn: 'Tajikistan',      iso: 'tj', flag: '🇹🇯' },
  { code: '+996', name: 'قرغيزستان',            nameEn: 'Kyrgyzstan',      iso: 'kg', flag: '🇰🇬' },
  { code: '+93',  name: 'أفغانستان',            nameEn: 'Afghanistan',     iso: 'af', flag: '🇦🇫' },
  { code: '+95',  name: 'ميانمار',              nameEn: 'Myanmar',         iso: 'mm', flag: '🇲🇲' },
  { code: '+65',  name: 'سنغافورة',             nameEn: 'Singapore',       iso: 'sg', flag: '🇸🇬' },
  { code: '+977', name: 'نيبال',                nameEn: 'Nepal',           iso: 'np', flag: '🇳🇵' },
  { code: '+960', name: 'جزر المالديف',         nameEn: 'Maldives',        iso: 'mv', flag: '🇲🇻' },
  { code: '+886', name: 'تايوان',               nameEn: 'Taiwan',          iso: 'tw', flag: '🇹🇼' },
  { code: '+852', name: 'هونغ كونغ',            nameEn: 'Hong Kong',       iso: 'hk', flag: '🇭🇰' },
  // ── Europe ────────────────────────────────────────────────────
  { code: '+44',  name: 'المملكة المتحدة',       nameEn: 'United Kingdom',  iso: 'gb', flag: '🇬🇧' },
  { code: '+33',  name: 'فرنسا',                nameEn: 'France',          iso: 'fr', flag: '🇫🇷' },
  { code: '+49',  name: 'ألمانيا',              nameEn: 'Germany',         iso: 'de', flag: '🇩🇪' },
  { code: '+39',  name: 'إيطاليا',              nameEn: 'Italy',           iso: 'it', flag: '🇮🇹' },
  { code: '+34',  name: 'إسبانيا',              nameEn: 'Spain',           iso: 'es', flag: '🇪🇸' },
  { code: '+31',  name: 'هولندا',               nameEn: 'Netherlands',     iso: 'nl', flag: '🇳🇱' },
  { code: '+32',  name: 'بلجيكا',               nameEn: 'Belgium',         iso: 'be', flag: '🇧🇪' },
  { code: '+41',  name: 'سويسرا',               nameEn: 'Switzerland',     iso: 'ch', flag: '🇨🇭' },
  { code: '+43',  name: 'النمسا',               nameEn: 'Austria',         iso: 'at', flag: '🇦🇹' },
  { code: '+46',  name: 'السويد',               nameEn: 'Sweden',          iso: 'se', flag: '🇸🇪' },
  { code: '+47',  name: 'النرويج',              nameEn: 'Norway',          iso: 'no', flag: '🇳🇴' },
  { code: '+45',  name: 'الدنمارك',             nameEn: 'Denmark',         iso: 'dk', flag: '🇩🇰' },
  { code: '+358', name: 'فنلندا',               nameEn: 'Finland',         iso: 'fi', flag: '🇫🇮' },
  { code: '+30',  name: 'اليونان',              nameEn: 'Greece',          iso: 'gr', flag: '🇬🇷' },
  { code: '+48',  name: 'بولندا',               nameEn: 'Poland',          iso: 'pl', flag: '🇵🇱' },
  { code: '+351', name: 'البرتغال',             nameEn: 'Portugal',        iso: 'pt', flag: '🇵🇹' },
  { code: '+380', name: 'أوكرانيا',             nameEn: 'Ukraine',         iso: 'ua', flag: '🇺🇦' },
  { code: '+40',  name: 'رومانيا',              nameEn: 'Romania',         iso: 'ro', flag: '🇷🇴' },
  { code: '+420', name: 'التشيك',               nameEn: 'Czech Republic',  iso: 'cz', flag: '🇨🇿' },
  { code: '+36',  name: 'المجر',                nameEn: 'Hungary',         iso: 'hu', flag: '🇭🇺' },
  { code: '+385', name: 'كرواتيا',              nameEn: 'Croatia',         iso: 'hr', flag: '🇭🇷' },
  { code: '+381', name: 'صربيا',                nameEn: 'Serbia',          iso: 'rs', flag: '🇷🇸' },
  { code: '+357', name: 'قبرص',                 nameEn: 'Cyprus',          iso: 'cy', flag: '🇨🇾' },
  { code: '+370', name: 'ليتوانيا',             nameEn: 'Lithuania',       iso: 'lt', flag: '🇱🇹' },
  { code: '+371', name: 'لاتفيا',               nameEn: 'Latvia',          iso: 'lv', flag: '🇱🇻' },
  { code: '+372', name: 'إستونيا',              nameEn: 'Estonia',         iso: 'ee', flag: '🇪🇪' },
  { code: '+354', name: 'أيسلندا',              nameEn: 'Iceland',         iso: 'is', flag: '🇮🇸' },
  { code: '+353', name: 'أيرلندا',              nameEn: 'Ireland',         iso: 'ie', flag: '🇮🇪' },
  // ── Americas ──────────────────────────────────────────────────
  { code: '+1',   name: 'الولايات المتحدة',     nameEn: 'United States',   iso: 'us', flag: '🇺🇸' },
  { code: '+1',   name: 'كندا',                 nameEn: 'Canada',          iso: 'ca', flag: '🇨🇦' },
  { code: '+55',  name: 'البرازيل',             nameEn: 'Brazil',          iso: 'br', flag: '🇧🇷' },
  { code: '+52',  name: 'المكسيك',              nameEn: 'Mexico',          iso: 'mx', flag: '🇲🇽' },
  { code: '+54',  name: 'الأرجنتين',            nameEn: 'Argentina',       iso: 'ar', flag: '🇦🇷' },
  { code: '+57',  name: 'كولومبيا',             nameEn: 'Colombia',        iso: 'co', flag: '🇨🇴' },
  { code: '+56',  name: 'تشيلي',                nameEn: 'Chile',           iso: 'cl', flag: '🇨🇱' },
  { code: '+51',  name: 'بيرو',                 nameEn: 'Peru',            iso: 'pe', flag: '🇵🇪' },
  { code: '+58',  name: 'فنزويلا',              nameEn: 'Venezuela',       iso: 've', flag: '🇻🇪' },
  { code: '+593', name: 'الإكوادور',            nameEn: 'Ecuador',         iso: 'ec', flag: '🇪🇨' },
  // ── Oceania ───────────────────────────────────────────────────
  { code: '+61',  name: 'أستراليا',             nameEn: 'Australia',       iso: 'au', flag: '🇦🇺' },
  { code: '+64',  name: 'نيوزيلندا',            nameEn: 'New Zealand',     iso: 'nz', flag: '🇳🇿' },
]

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_AR   = ['ح','ن','ث','ر','خ','ج','س']
const DAYS_EN   = ['Su','Mo','Tu','We','Th','Fr','Sa']

const TEMP_DOMAINS = [
  'tempmail.com','mailinator.com','guerrillamail.com','10minutemail.com',
  'trashmail.com','yopmail.com','getnada.com','temp-mail.org',
  'dispostable.com','sharklasers.com','maildrop.cc','temp-mail.io',
]

const STEP_META = {
  AR: [
    { label: 'معلومات الحساب',    sub: 'أنشئ بياناتك الأساسية',       icon: '🔐' },
    { label: 'معلوماتك الشخصية', sub: 'أخبرنا قليلاً عن نفسك',       icon: '👤' },
    { label: 'مراجعة وإنشاء',    sub: 'تحقق من بياناتك وابدأ رحلتك', icon: '🚀' },
    { label: 'تحقق من بريدك',    sub: 'أدخل الرمز المُرسل إليك',     icon: '📧' },
  ],
  EN: [
    { label: 'Account Info',    sub: 'Set up your credentials',       icon: '🔐' },
    { label: 'Personal Info',   sub: 'Tell us a bit about you',       icon: '👤' },
    { label: 'Review & Create', sub: 'Confirm and start your journey',icon: '🚀' },
    { label: 'Verify Email',    sub: 'Enter the code we sent you',    icon: '📧' },
  ],
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function getPwStrength(pw: string): PwStrength {
  if (!pw) return { score: 0, label: '', color: '', segments: ['','','',''] }
  let s = 0
  if (pw.length >= 8)           s++
  if (pw.length >= 12)          s++
  if (/[A-Z]/.test(pw))        s++
  if (/[0-9]/.test(pw))        s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  if (s <= 1) return { score: 1, label: 'ضعيفة / Weak',      color: '#ef4444', segments: ['#ef4444','','',''] }
  if (s === 2) return { score: 2, label: 'مقبولة / Fair',    color: '#f97316', segments: ['#f97316','#f97316','',''] }
  if (s === 3) return { score: 3, label: 'جيدة / Good',      color: '#eab308', segments: ['#eab308','#eab308','#eab308',''] }
  return              { score: 4, label: 'قوية 💪 / Strong', color: '#22c55e', segments: ['#22c55e','#22c55e','#22c55e','#22c55e'] }
}

function formatBirthdate(raw: string, lang: string): string {
  if (!raw) return ''
  const [y,m,d] = raw.split('-')
  const months = lang === 'AR' ? MONTHS_AR : MONTHS_EN
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`
}

function maskEmail(e: string) {
  const [u, domain] = e.split('@')
  return `${u.slice(0, 2)}***@${domain}`
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────
const Logo = ({ className = 'w-9 h-9' }: { className?: string }) => {
  const { logoUrl } = useFeedbackStore()
  return logoUrl ? (
    <img src={logoUrl} alt="Logo" className={`${className} object-contain`} />
  ) : (
    <div className={`${className} rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center font-black text-white text-sm`}>ع</div>
  )
}

const AuroraBackground = ({ accentColor, theme }: { accentColor: string; theme: 'light' | 'dark' }) => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
    <div className={`absolute inset-0 transition-colors duration-700 ${theme === 'light' ? 'bg-slate-50' : 'bg-[#06061a]'}`} />
    <svg className={`absolute inset-0 w-full h-full ${theme === 'light' ? 'opacity-[0.025]' : 'opacity-[0.055]'}`} style={{ mixBlendMode: 'overlay' }}>
      <filter id="noise-r">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-r)" />
    </svg>
    <div className="absolute inset-0" style={{ background: theme === 'light'
      ? 'radial-gradient(circle at center, transparent 40%, rgba(203,213,225,0.35) 100%)'
      : 'radial-gradient(circle at center, transparent 30%, rgba(4,4,15,0.85) 100%)' }} />
    <motion.div
      animate={{ scale: [1,1.35,1], rotate: [0,40,0], opacity: theme==='light' ? [0.1,0.14,0.1] : [0.28,0.42,0.28] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute top-[-30%] left-[-20%] w-[90vw] h-[90vw] rounded-full blur-[180px]"
      style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 75%)` }}
    />
    <motion.div
      animate={{ scale: [1.3,1,1.3], rotate: [0,-30,0], opacity: theme==='light' ? [0.07,0.11,0.07] : [0.2,0.35,0.2] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute bottom-[-30%] right-[-20%] w-[80vw] h-[80vw] rounded-full blur-[180px]"
      style={{ background: 'radial-gradient(circle, #EC4899 0%, transparent 75%)' }}
    />
  </div>
)

// ── Step progress bar ──────────────────────────────────────────
const StepProgress = ({ current, accentColor, theme }: { current: Step; accentColor: string; theme: 'light' | 'dark' }) => (
  <div className="flex items-center gap-1 px-1">
    {([1,2,3,4] as Step[]).map((s, i) => (
      <React.Fragment key={s}>
        <div className="relative flex-1">
          <motion.div
            animate={{
              height:          s === current ? 3 : 2,
              opacity:         s <= current  ? 1 : 0.15,
              backgroundColor: s <= current  ? accentColor : (theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)'),
              boxShadow:       s === current ? `0 0 10px ${accentColor}70` : 'none',
            }}
            transition={{ duration: 0.45, ease: [0.16,1,0.3,1] }}
            className="w-full rounded-full"
          />
        </div>
        {i < 3 && <div className={`w-2 h-px opacity-10 ${theme==='light' ? 'bg-slate-900' : 'bg-white'}`} />}
      </React.Fragment>
    ))}
  </div>
)

// ── Generic field ──────────────────────────────────────────────
interface FieldProps {
  label: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string; placeholder?: string; error?: string
  badge?: React.ReactNode; rightSlot?: React.ReactNode
  autoComplete?: string; borderColor?: string
  theme: 'light' | 'dark'; inputDir?: 'ltr' | 'rtl'
}
const Field = ({ label, value, onChange, type='text', placeholder, error, badge, rightSlot, autoComplete, borderColor, theme, inputDir }: FieldProps) => (
  <div className="group">
    <div className="flex items-center justify-between mb-1.5 px-0.5">
      <label className={`text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${theme==='light' ? 'text-slate-400 group-focus-within:text-slate-700' : 'text-white/30 group-focus-within:text-white/55'}`}>
        {label}
      </label>
      <AnimatePresence mode="wait">
        {badge && <motion.div key="b" initial={{opacity:0,scale:0.85}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.85}}>{badge}</motion.div>}
      </AnimatePresence>
    </div>
    <div className="relative">
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        className={`w-full rounded-2xl px-4 py-4 text-sm font-semibold outline-none transition-all duration-300 border ${
          theme==='light'
            ? 'bg-slate-100/60 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
            : 'bg-white/[0.04] text-white placeholder:text-white/15 focus:bg-white/[0.08]'
        }`}
        style={{
          direction: inputDir ?? 'rtl',
          borderColor: borderColor ?? (error ? 'rgba(236,72,153,0.5)' : (theme==='light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)')),
          paddingRight: rightSlot ? '3.2rem' : undefined,
        }}
      />
      {rightSlot && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">{rightSlot}</div>
      )}
    </div>
  </div>
)

// ── Error badge ────────────────────────────────────────────────
const ErrBadge = ({ msg }: { msg: string }) => (
  <span className="text-[9px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20 whitespace-nowrap">{msg}</span>
)

// ── OK badge ───────────────────────────────────────────────────
const OkBadge = ({ msg }: { msg: string }) => (
  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">{msg}</span>
)

// ── Password strength bar ──────────────────────────────────────
const PwStrengthBar = ({ strength, theme }: { strength: PwStrength; theme: 'light'|'dark' }) => (
  <div className="flex gap-1 mt-2 px-0.5">
    {strength.segments.map((color, i) => (
      <motion.div key={i} className="flex-1 rounded-full"
        animate={{ height: 3, backgroundColor: color || (theme==='light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'), opacity: color ? 1 : 0.4 }}
        transition={{ duration: 0.35, delay: i * 0.05 }}
        style={{ height: 3 }}
      />
    ))}
  </div>
)

// ── OTP Input (6-box) ──────────────────────────────────────────
const OTPInput = ({ value, onChange, theme, accentColor }: {
  value: string; onChange: (v: string) => void; theme: 'light'|'dark'; accentColor: string
}) => {
  const refs = useRef<(HTMLInputElement|null)[]>([])
  const digits = value.padEnd(6, '').split('').slice(0,6)

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = digits.map((d, idx) => idx === i ? '' : d).join('').trim()
      onChange(next.padEnd(Math.max(0, i === 0 ? 0 : i-1), ' ').trimEnd())
      const newVal = digits.slice(0, i).join('')
      onChange(newVal)
      if (i > 0) refs.current[i-1]?.focus()
    }
  }

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const ch = e.target.value.replace(/[^0-9]/g, '').slice(-1)
    const arr = digits.map((d, idx) => idx === i ? ch : d)
    onChange(arr.join(''))
    if (ch && i < 5) refs.current[i+1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0,6)
    onChange(pasted)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {Array.from({ length: 6 }, (_, i) => (
        <motion.input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          whileFocus={{ scale: 1.06 }}
          className={`w-11 h-14 rounded-2xl text-xl font-black text-center outline-none border transition-all duration-200 ${
            theme==='light'
              ? 'bg-slate-100 text-slate-900 border-slate-200 focus:bg-white'
              : 'bg-white/[0.05] text-white border-white/10 focus:bg-white/[0.1]'
          }`}
          style={{ boxShadow: digits[i] ? `0 0 16px ${accentColor}40` : undefined,
                   borderColor: digits[i] ? accentColor : undefined }}
        />
      ))}
    </div>
  )
}

// ── Inline Calendar ────────────────────────────────────────────
const InlineCalendar = ({
  value, onChange, lang, theme, accentColor, isOpen, onClose, anchorRef,
}: {
  value: string; onChange: (v: string) => void; lang: string
  theme: 'light'|'dark'; accentColor: string; isOpen: boolean
  onClose: () => void; anchorRef: React.RefObject<HTMLButtonElement | null>
}) => {
  const today = new Date()
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date(today.getFullYear() - 20, today.getMonth()))

  const months = lang === 'AR' ? MONTHS_AR : MONTHS_EN
  const days   = lang === 'AR' ? DAYS_AR   : DAYS_EN

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate()
  const firstDay    = new Date(viewDate.getFullYear(), viewDate.getMonth(),   1).getDay()

  const calDays: (number|null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i+1),
  ]

  const selParts = value ? value.split('-').map(Number) : null
  const isSel = (d: number) =>
    selParts && selParts[0] === viewDate.getFullYear() && selParts[1]-1 === viewDate.getMonth() && selParts[2] === d

  const isFuture = (d: number) => new Date(viewDate.getFullYear(), viewDate.getMonth(), d) > today

  const isUnderage = (d: number) => {
    const birth = new Date(viewDate.getFullYear(), viewDate.getMonth(), d)
    const age = today.getFullYear() - birth.getFullYear() - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)
    return age < 13
  }

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1))
  const nextMonth = () => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth()+1)
    if (next <= today) setViewDate(next)
  }

  const select = (d: number) => {
    if (isFuture(d) || isUnderage(d)) return
    const y = viewDate.getFullYear()
    const m = String(viewDate.getMonth()+1).padStart(2,'0')
    const dd = String(d).padStart(2,'0')
    onChange(`${y}-${m}-${dd}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.4,0,0.2,1] }}
        className={`absolute z-[100] top-full mt-2 left-0 right-0 border rounded-2xl p-4 shadow-2xl ${
          theme==='light'
            ? 'bg-white border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.1)]'
            : 'bg-[#0d0d24] border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* Month / Year nav */}
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth}
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all ${theme==='light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-white/60'}`}>
            ‹
          </button>
          <div className="flex gap-2">
            <select value={viewDate.getMonth()} onChange={e => setViewDate(new Date(viewDate.getFullYear(), +e.target.value))}
              className={`text-xs font-black rounded-xl px-2 py-1.5 outline-none border-0 appearance-none text-center transition-all ${theme==='light' ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white'}`}>
              {months.map((m,i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={viewDate.getFullYear()} onChange={e => setViewDate(new Date(+e.target.value, viewDate.getMonth()))}
              className={`text-xs font-black rounded-xl px-2 py-1.5 outline-none border-0 appearance-none text-center transition-all ${theme==='light' ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white'}`}>
              {Array.from({ length: 100 }, (_,i) => today.getFullYear()-i).map(y =>
                <option key={y} value={y}>{y}</option>
              )}
            </select>
          </div>
          <button type="button" onClick={nextMonth}
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all ${
              new Date(viewDate.getFullYear(), viewDate.getMonth()+1) > today
                ? 'opacity-20 cursor-not-allowed'
                : (theme==='light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-white/60')
            }`}>
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {days.map(d => (
            <div key={d} className={`text-[9px] font-black text-center py-0.5 ${theme==='light' ? 'text-slate-300' : 'text-white/20'}`}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calDays.map((d, i) => {
            if (!d) return <div key={i} />
            const future    = isFuture(d)
            const underage  = isUnderage(d)
            const disabled  = future || underage
            const selected  = isSel(d)
            return (
              <button key={i} type="button" onClick={() => select(d)} disabled={disabled}
                className={`aspect-square rounded-xl text-[11px] font-bold transition-all flex items-center justify-center ${
                  disabled  ? 'opacity-15 cursor-not-allowed' :
                  selected  ? 'text-white shadow-lg' :
                  (theme==='light' ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900' : 'text-white/40 hover:bg-white/10 hover:text-white')
                }`}
                style={{ background: selected ? accentColor : undefined,
                         boxShadow:  selected ? `0 0 14px ${accentColor}55` : undefined }}>
                {d}
              </button>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Country Selector Modal ─────────────────────────────────────
const CountryModal = ({
  isOpen, onClose, onSelect, lang, theme, accentColor,
}: {
  isOpen: boolean; onClose: () => void; onSelect: (c: Country) => void
  lang: string; theme: 'light'|'dark'; accentColor: string
}) => {
  const [q, setQ] = useState('')
  const filtered = ALL_COUNTRIES.filter(c =>
    c.name.includes(q) || c.nameEn.toLowerCase().includes(q.toLowerCase()) ||
    c.code.includes(q) || c.iso.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }} transition={{ duration: 0.25, ease: [0.4,0,0.2,1] }}
            className={`w-full max-w-sm rounded-[28px] p-6 flex flex-col shadow-2xl border ${
              theme==='light' ? 'bg-white border-slate-200' : 'bg-[#0d0d24] border-white/10'
            }`}
            style={{ maxHeight: '75vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className={`text-base font-black ${theme==='light' ? 'text-slate-900' : 'text-white'}`}>
                {lang==='AR' ? 'رمز الدولة' : 'Country Code'}
              </h2>
              <button onClick={onClose}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all ${theme==='light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/10 hover:bg-white/15 text-white/70'}`}>
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4 shrink-0">
              <input type="text" value={q} onChange={e => setQ(e.target.value)}
                placeholder={lang==='AR' ? 'ابحث…' : 'Search…'}
                className={`w-full rounded-xl px-4 py-3 text-sm outline-none border transition-all ${
                  theme==='light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20'
                }`}
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-0.5 custom-scroll-r">
              {filtered.map((c, i) => (
                <button key={`${c.iso}-${i}`} type="button"
                  onClick={() => { onSelect(c); onClose(); setQ('') }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                    theme==='light' ? 'hover:bg-slate-50 text-slate-900' : 'hover:bg-white/5 text-white'
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{c.flag}</span>
                    <div className={`text-left`}>
                      <p className={`text-xs font-bold ${theme==='light' ? 'text-slate-900' : 'text-white'}`}>
                        {lang==='AR' ? c.name : c.nameEn}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black font-mono" style={{ color: accentColor, direction: 'ltr' }}>
                    {c.flag} {c.code}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Motion variants ────────────────────────────────────────────
const slideVariants = {
  enter:  (d: number) => ({ x: d * 50, opacity: 0, filter: 'blur(3px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit:   (d: number) => ({ x: d * -50, opacity: 0, filter: 'blur(3px)' }),
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { accentColor, themeMode, lang } = useFeedbackStore()
  const theme = themeMode === 'light' ? 'light' : 'dark'
  const dir   = lang === 'AR' ? 'rtl' : 'ltr'
  const t = useTranslator()

  // ── Step ──────────────────────────────────────────────────────
  const [step,      setStep]      = useState<Step>(1)
  const [direction, setDirection] = useState<1|-1>(1)

  // ── Fields ────────────────────────────────────────────────────
  const [username,  setUsername]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [gender,    setGender]    = useState<Gender|null>(null)
  const [phone,     setPhone]     = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [country,   setCountry]   = useState<Country>(ALL_COUNTRIES[0])
  const [otp,       setOtp]       = useState('')

  // ── UI ────────────────────────────────────────────────────────
  const [showPw,      setShowPw]      = useState(false)
  const [showCf,      setShowCf]      = useState(false)
  const [agreed,      setAgreed]      = useState(false)
  const [shakeTerms,  setShakeTerms]  = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [errors,      setErrors]      = useState<FormErrors>({})
  const [isCalOpen,   setIsCalOpen]   = useState(false)
  const [isCtryOpen,  setIsCtryOpen]  = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const calBtnRef = useRef<HTMLButtonElement>(null)

  // ── Username availability ─────────────────────────────────────
  const [unStatus, setUnStatus] = useState<AvailStatus>('idle')
  const unTimer = useRef<ReturnType<typeof setTimeout>>()

  const generateSuggestions = (base: string) => {
    const clean = base.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g,'')
    return [`${clean}${Math.floor(Math.random()*999)}`, `${clean}${Math.floor(Math.random()*99)}`, `pro_${clean}`, `${clean}_v2`]
  }

  const checkUsername = useCallback(async (val: string) => {
    const v = val.trim()
    if (v.length < 3) { setUnStatus('idle'); return }
    if (!/^[a-zA-Z0-9_\u0600-\u06FF]+$/.test(v)) {
      setUnStatus('taken')
      setErrors(p => ({ ...p, username: lang==='AR' ? 'أحرف وأرقام فقط' : 'Letters & numbers only' }))
      return
    }
    setUnStatus('checking')
    const { data } = await supabase.from('profiles').select('username').ilike('username', v).maybeSingle()
    if (data) { setUnStatus('taken'); setSuggestions(generateSuggestions(v)) }
    else      { setUnStatus('available'); setSuggestions([]) }
  }, [supabase, lang])

  useEffect(() => {
    clearTimeout(unTimer.current)
    if (username.length >= 3) unTimer.current = setTimeout(() => checkUsername(username), 600)
    else setUnStatus('idle')
    return () => clearTimeout(unTimer.current)
  }, [username, checkUsername])

  // ── Email availability ────────────────────────────────────────
  const [emailStatus, setEmailStatus] = useState<AvailStatus>('idle')
  const emailTimer = useRef<ReturnType<typeof setTimeout>>()

  const checkEmail = useCallback(async (val: string) => {
    const v = val.trim()
    if (!v.includes('@')) { setEmailStatus('idle'); return }
    setEmailStatus('checking')
    const { data } = await supabase.from('profiles').select('id').ilike('email', v).maybeSingle()
    setEmailStatus(data ? 'taken' : 'available')
  }, [supabase])

  useEffect(() => {
    clearTimeout(emailTimer.current)
    if (email.includes('@')) emailTimer.current = setTimeout(() => checkEmail(email), 800)
    else setEmailStatus('idle')
    return () => clearTimeout(emailTimer.current)
  }, [email, checkEmail])

  // ── Resend OTP timer ──────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(v => v-1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  // ── Password strength ─────────────────────────────────────────
  const pwStrength = getPwStrength(password)

  // ── Validation ────────────────────────────────────────────────
  const today = new Date()

  const validateStep = (s: Step): boolean => {
    const e: FormErrors = {}

    if (s === 1) {
      const u = username.trim()
      if (!u || u.length < 3)          e.username = lang==='AR' ? '3 أحرف على الأقل' : 'At least 3 characters'
      if (unStatus === 'taken')         e.username = errors.username || (lang==='AR' ? 'هذا الاسم مأخوذ' : 'Username taken')

      const domain = email.split('@')[1]
      if (!email.includes('@'))         e.email = lang==='AR' ? 'بريد غير صالح'           : 'Invalid email'
      else if (TEMP_DOMAINS.includes(domain)) e.email = lang==='AR' ? 'لا يُسمح بالبريد المؤقت' : 'Temporary emails not allowed'
      else if (emailStatus === 'taken') e.email = lang==='AR' ? 'هذا البريد مسجل مسبقاً'  : 'Email already registered'

      if (!password || password.length < 8)  e.password        = lang==='AR' ? '8 أحرف على الأقل' : 'At least 8 characters'
      if (password !== confirm)               e.confirmPassword = lang==='AR' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'
    }

    if (s === 2) {
      if (!gender)    e.gender = lang==='AR' ? 'يرجى اختيار الجنس' : 'Please select gender'
      if (!birthdate) {
        e.birthdate = lang==='AR' ? 'يرجى اختيار تاريخ الميلاد' : 'Please select birthdate'
      } else {
        const birth = new Date(birthdate)
        const age   = today.getFullYear() - birth.getFullYear() -
          (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)
        if (age < 13) e.birthdate = lang==='AR' ? 'يجب أن تكون 13 عاماً أو أكثر' : 'Must be at least 13 years old'
      }
      const ph = phone.replace(/[^0-9]/g,'')
      if (!ph || ph.length < 8 || ph.length > 15) {
        toast.error(lang==='AR' ? 'رقم هاتف غير صالح (8-15 رقماً)' : 'Invalid phone number (8-15 digits)')
        return false
      }
    }

    if (s === 4) {
      if (otp.replace(/[^0-9]/g,'').length < 6) e.otp = lang==='AR' ? 'أدخل الرمز كاملاً' : 'Enter the full code'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setDirection(1)
    setStep(s => (s+1) as Step)
  }
  const goBack = () => {
    setErrors({})
    setDirection(-1)
    setStep(s => (s-1) as Step)
  }

  // ── Submit (step 3 → create account → step 4) ─────────────────
  const handleRegister = async () => {
    if (!agreed) {
      setShakeTerms(true)
      setTimeout(() => setShakeTerms(false), 500)
      toast.error(lang==='AR' ? 'يرجى الموافقة على الشروط أولاً' : 'Please agree to the terms first')
      return
    }
    setLoading(true)
    const fullPhone = phone ? `${country.code}${phone}` : ''
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { username: username.toLowerCase(), gender, phone: fullPhone, birthdate },
      },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }

    if (signUpData?.user) {
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: username.toLowerCase() }),
      }).catch(() => {})
    }

    toast.success(lang==='AR' ? 'تم إرسال رمز التحقق إلى بريدك 📧' : 'Verification code sent to your email 📧')
    setResendTimer(60)
    setDirection(1)
    setStep(4)
  }

  // ── Verify OTP ────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!validateStep(4)) return
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' })
    setLoading(false)
    if (error) { toast.error(error.message); setErrors(p => ({ ...p, otp: error.message })); return }
    toast.success(lang==='AR' ? 'أهلاً بك! 🎉' : 'Welcome aboard! 🎉')
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendTimer > 0) return
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) { toast.error(error.message); return }
    toast.success(lang==='AR' ? 'تم إعادة إرسال الرمز' : 'Code resent!')
    setResendTimer(60)
    setOtp('')
  }

  // ── Google sign-in ────────────────────────────────────────────
  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  // ── Derived ───────────────────────────────────────────────────
  const stepMeta = (lang === 'AR' ? STEP_META.AR : STEP_META.EN)[step-1]

  const unBorderColor =
    errors.username       ? 'rgba(236,72,153,0.45)' :
    unStatus === 'taken'  ? 'rgba(236,72,153,0.45)' :
    unStatus === 'available' ? 'rgba(34,197,94,0.45)' :
    undefined

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen w-full flex flex-col relative transition-colors duration-500 ${theme==='dark' ? 'bg-[#06061a] text-white' : 'bg-slate-50 text-slate-900'}`}
      style={{ direction: dir, fontFamily: lang==='AR' ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}
    >
      <AuroraBackground accentColor={accentColor} theme={theme} />

      {/* ── Nav ── */}
      <nav className="relative z-50 flex-shrink-0 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className={`text-base font-black tracking-tight ${theme==='light' ? 'text-slate-900' : 'text-white'}`}>
            {lang==='AR' ? 'العُريف' : 'Al-Arif'}
          </span>
        </div>
        <Link href="/auth/login"
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
            theme==='light'
              ? 'text-slate-400 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              : 'text-white/35 border-white/10 hover:text-white hover:bg-white/5'
          }`}>
          {t('nav_login')}
        </Link>
      </nav>

      {/* ── Card ── */}
      <div className="relative z-40 flex-1 flex items-start justify-center px-4 py-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.4,0,0.2,1] }}
          className="w-full max-w-[460px]"
        >
          <div className={`backdrop-blur-[40px] border rounded-[28px] p-6 relative transition-all duration-500 ${
            theme==='light'
              ? 'bg-white/85 border-slate-200 shadow-[0_40px_80px_rgba(0,0,0,0.07)]'
              : 'bg-white/[0.03] border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.07)]'
          }`}>
            <div className={`absolute inset-0 rounded-[28px] pointer-events-none ${theme==='light' ? 'bg-gradient-to-br from-white/60 to-transparent' : 'bg-gradient-to-br from-white/[0.03] to-transparent'}`} />

            {/* Header */}
            <div className="text-center mb-4 relative z-10">
              <motion.div key={`icon-${step}`} initial={{scale:0.75,opacity:0}} animate={{scale:1,opacity:1}} className="text-2xl mb-1">
                {stepMeta.icon}
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div key={`title-${step}`}
                  initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:0.22}}>
                  <h1 className={`text-lg font-black tracking-tight ${theme==='light' ? 'text-slate-900' : 'text-white'}`}>{stepMeta.label}</h1>
                  <p className={`text-xs font-medium mt-0.5 ${theme==='light' ? 'text-slate-400' : 'text-white/25'}`}>{stepMeta.sub}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress */}
            <div className="mb-5 relative z-10">
              <StepProgress current={step} accentColor={accentColor} theme={theme} />
              <p className={`text-[10px] text-center mt-1 font-bold ${theme==='light' ? 'text-slate-300' : 'text-white/20'}`}>{step} / 4</p>
            </div>

            {/* Step content */}
            <div className="relative z-10" style={{ minHeight: 280 }}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.div key={step} custom={direction} variants={slideVariants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.26, ease: [0.4,0,0.2,1] }}>

                  {/* ══ STEP 1 — Account Info ══════════════════════════════ */}
                  {step === 1 && (
                    <div className="space-y-4">

                      {/* Username */}
                      <div>
                        <Field label={t('auth_username')} value={username}
                          onChange={e => { setUsername(e.target.value); setErrors(p => ({...p,username:''})) }}
                          placeholder="username_99" autoComplete="username"
                          borderColor={unBorderColor} theme={theme}
                          badge={
                            errors.username     ? <ErrBadge msg={errors.username} /> :
                            unStatus==='available' ? <OkBadge msg={lang==='AR' ? '✓ متاح' : '✓ Available'} /> :
                            unStatus==='taken'  ? <ErrBadge msg={lang==='AR' ? '✗ مأخوذ' : '✗ Taken'} /> :
                            unStatus==='checking' ? <span className={`text-[9px] font-bold animate-pulse ${theme==='light' ? 'text-slate-300' : 'text-white/25'}`}>{lang==='AR' ? 'جاري التحقق…' : 'Checking…'}</span> :
                            undefined
                          }
                        />
                        {/* Suggestions */}
                        <AnimatePresence>
                          {unStatus==='taken' && suggestions.length > 0 && (
                            <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} className="mt-2 px-0.5">
                              <p className={`text-[10px] mb-1.5 font-bold ${theme==='light' ? 'text-slate-400' : 'text-white/40'}`}>
                                {lang==='AR' ? 'اقتراحات:' : 'Suggestions:'}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {suggestions.map(s => (
                                  <button key={s} type="button" onClick={() => setUsername(s)}
                                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                                      theme==='light' ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                    }`}>{s}</button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Email */}
                      <Field label={t('auth_email')} type="email" value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(p => ({...p,email:''})) }}
                        placeholder="name@example.com" autoComplete="email" inputDir="ltr"
                        theme={theme}
                        badge={
                          errors.email         ? <ErrBadge msg={errors.email} /> :
                          emailStatus==='taken' ? <ErrBadge msg={lang==='AR' ? 'مسجل مسبقاً' : 'Already registered'} /> :
                          emailStatus==='available' ? <OkBadge msg={lang==='AR' ? '✓ صالح' : '✓ Valid'} /> :
                          emailStatus==='checking'  ? <span className={`text-[9px] font-bold animate-pulse ${theme==='light' ? 'text-slate-300' : 'text-white/25'}`}>{lang==='AR' ? 'جاري التحقق…' : 'Checking…'}</span> :
                          undefined
                        }
                      />

                      {/* Password */}
                      <div className="group">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <label className={`text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${theme==='light' ? 'text-slate-400 group-focus-within:text-slate-700' : 'text-white/30 group-focus-within:text-white/55'}`}>
                            {t('auth_password')}
                          </label>
                          <AnimatePresence mode="wait">
                            {errors.password
                              ? <motion.div key="ep" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ErrBadge msg={errors.password} /></motion.div>
                              : password
                              ? <motion.span key="sp" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
                                  style={{ color: pwStrength.color, borderColor: `${pwStrength.color}40`, background: `${pwStrength.color}12` }}>
                                  {pwStrength.label}
                                </motion.span>
                              : null
                            }
                          </AnimatePresence>
                        </div>
                        <div className="relative">
                          <input type={showPw ? 'text' : 'password'} value={password}
                            onChange={e => { setPassword(e.target.value); setErrors(p => ({...p,password:''})) }}
                            placeholder="••••••••" autoComplete="new-password"
                            className={`w-full rounded-2xl px-4 py-4 pr-12 text-sm font-semibold outline-none transition-all duration-300 border ${
                              theme==='light'
                                ? 'bg-slate-100/60 text-slate-900 placeholder:text-slate-300 focus:bg-white'
                                : 'bg-white/[0.04] text-white placeholder:text-white/15 focus:bg-white/[0.08]'
                            }`}
                            style={{ direction:'ltr', borderColor: errors.password ? 'rgba(236,72,153,0.45)' : (theme==='light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)') }}
                          />
                          <button type="button" onClick={() => setShowPw(v => !v)}
                            className={`absolute top-1/2 -translate-y-1/2 right-3.5 text-sm transition-opacity ${theme==='light' ? 'opacity-30 hover:opacity-80' : 'opacity-25 hover:opacity-70'}`}>
                            {showPw ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {/* Strength bar */}
                        {password && <PwStrengthBar strength={pwStrength} theme={theme} />}
                      </div>

                      {/* Confirm password */}
                      <div className="group">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <label className={`text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${theme==='light' ? 'text-slate-400 group-focus-within:text-slate-700' : 'text-white/30 group-focus-within:text-white/55'}`}>
                            {lang==='AR' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                          </label>
                          <AnimatePresence mode="wait">
                            {errors.confirmPassword && (
                              <motion.div key="ecf" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                                <ErrBadge msg={errors.confirmPassword} />
                              </motion.div>
                            )}
                            {confirm && confirm === password && !errors.confirmPassword && (
                              <motion.div key="cfok" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                                <OkBadge msg={lang==='AR' ? '✓ متطابق' : '✓ Match'} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="relative">
                          <input type={showCf ? 'text' : 'password'} value={confirm}
                            onChange={e => { setConfirm(e.target.value); setErrors(p => ({...p,confirmPassword:''})) }}
                            placeholder="••••••••" autoComplete="new-password"
                            className={`w-full rounded-2xl px-4 py-4 pr-12 text-sm font-semibold outline-none transition-all duration-300 border ${
                              theme==='light'
                                ? 'bg-slate-100/60 text-slate-900 placeholder:text-slate-300 focus:bg-white'
                                : 'bg-white/[0.04] text-white placeholder:text-white/15 focus:bg-white/[0.08]'
                            }`}
                            style={{
                              direction: 'ltr',
                              borderColor: errors.confirmPassword ? 'rgba(236,72,153,0.45)'
                                : confirm && confirm===password ? 'rgba(34,197,94,0.45)'
                                : (theme==='light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)')
                            }}
                          />
                          <button type="button" onClick={() => setShowCf(v => !v)}
                            className={`absolute top-1/2 -translate-y-1/2 right-3.5 text-sm transition-opacity ${theme==='light' ? 'opacity-30 hover:opacity-80' : 'opacity-25 hover:opacity-70'}`}>
                            {showCf ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      {/* ── Google sign-up (bottom of step 1) ── */}
                      <div>
                        <div className="flex items-center gap-3 my-1">
                          <div className={`flex-1 h-px ${theme==='light' ? 'bg-slate-200' : 'bg-white/[0.06]'}`} />
                          <span className={`text-[10px] font-bold whitespace-nowrap ${theme==='light' ? 'text-slate-300' : 'text-white/20'}`}>
                            {lang==='AR' ? 'أو التسجيل بـ' : 'or sign up with'}
                          </span>
                          <div className={`flex-1 h-px ${theme==='light' ? 'bg-slate-200' : 'bg-white/[0.06]'}`} />
                        </div>
                        <motion.button type="button" onClick={handleGoogle}
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border text-sm font-bold transition-all duration-200 ${
                            theme==='light'
                              ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
                              : 'bg-white/[0.04] border-white/[0.1] text-white/60 hover:bg-white/[0.08] hover:border-white/[0.18]'
                          }`}>
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 19.07 12c0 .68-.09 1.34-.24 1.97H12v-3.73h7.84A9 9 0 0 0 5.27 9.76z"/>
                            <path fill="#34A853" d="M12 21a8.97 8.97 0 0 0 6.18-2.46l-3.02-2.34A5.37 5.37 0 0 1 12 17.2a5.4 5.4 0 0 1-5.1-3.63H3.77A9 9 0 0 0 12 21z"/>
                            <path fill="#FBBC05" d="M6.9 13.57A5.46 5.46 0 0 1 6.6 12c0-.55.09-1.08.3-1.57V7.86H3.77A9 9 0 0 0 3 12c0 1.44.34 2.8.95 4l2.95-2.43z"/>
                            <path fill="#4285F4" d="M12 6.8c1.47 0 2.8.5 3.84 1.5l2.87-2.87A8.96 8.96 0 0 0 12 3a9 9 0 0 0-8.05 4.95l2.96 2.3A5.4 5.4 0 0 1 12 6.8z"/>
                          </svg>
                          <span>{lang==='AR' ? 'التسجيل عبر Google' : 'Continue with Google'}</span>
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* ══ STEP 2 — Personal Info ════════════════════════════ */}
                  {step === 2 && (
                    <div className="space-y-4">

                      {/* Gender */}
                      <div>
                        <label className={`text-[10px] font-black uppercase tracking-[0.18em] px-0.5 mb-2 block ${theme==='light' ? 'text-slate-400' : 'text-white/25'}`}>
                          {t('auth_gender')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {(['male','female'] as Gender[]).map(g => (
                            <motion.button key={g} type="button" whileTap={{ scale: 0.96 }}
                              onClick={() => { setGender(g); setErrors(p => ({...p,gender:''})) }}
                              className="py-4 rounded-2xl text-sm font-bold transition-all duration-200 border"
                              style={{
                                borderColor: gender===g ? accentColor : (errors.gender ? 'rgba(236,72,153,0.3)' : (theme==='light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)')),
                                background:  gender===g ? `${accentColor}1a` : (theme==='light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.02)'),
                                color:       gender===g ? (theme==='light' ? accentColor : '#fff') : (theme==='light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)'),
                                boxShadow:   gender===g ? `0 0 18px ${accentColor}20` : undefined,
                              }}>
                              <span className="text-lg mr-1">{g==='male' ? '👦' : '👩'}</span>
                              {g==='male' ? t('auth_male') : t('auth_female')}
                            </motion.button>
                          ))}
                        </div>
                        {errors.gender && <p className="text-[10px] text-pink-400 mt-1.5 px-0.5 font-bold">{errors.gender}</p>}
                      </div>

                      {/* Birthdate — inline calendar popover */}
                      <div className="relative">
                        <label className={`text-[10px] font-black uppercase tracking-[0.18em] px-0.5 mb-2 block ${theme==='light' ? 'text-slate-400' : 'text-white/25'}`}>
                          {t('auth_birthdate')}
                        </label>
                        <button ref={calBtnRef} type="button" onClick={() => setIsCalOpen(v => !v)}
                          className={`w-full border rounded-2xl py-3.5 px-4 text-sm font-bold flex items-center justify-between transition-all ${
                            theme==='light' ? 'bg-slate-100/60 hover:bg-slate-200/50 text-slate-900' : 'bg-white/[0.04] hover:bg-white/[0.07] text-white'
                          }`}
                          style={{ direction: dir, borderColor: errors.birthdate ? 'rgba(236,72,153,0.45)' : (theme==='light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)') }}>
                          <span className={birthdate ? '' : (theme==='light' ? 'text-slate-400' : 'text-white/25')}>
                            {birthdate ? formatBirthdate(birthdate, lang) : (lang==='AR' ? 'اختر تاريخ ميلادك' : 'Select your birthdate')}
                          </span>
                          <div className="flex items-center gap-2">
                            {birthdate && (() => {
                              const b = new Date(birthdate)
                              const age = today.getFullYear() - b.getFullYear() - (today < new Date(today.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0)
                              return age >= 13 ? <OkBadge msg={`${age}y ✓`} /> : null
                            })()}
                            <span className={`text-sm ${theme==='light' ? 'opacity-35' : 'opacity-20'}`}>📅</span>
                          </div>
                        </button>
                        {errors.birthdate && <p className="text-[10px] text-pink-400 mt-1 px-0.5 font-bold">{errors.birthdate}</p>}

                        <InlineCalendar
                          value={birthdate} onChange={v => { setBirthdate(v); setErrors(p => ({...p,birthdate:''})) }}
                          lang={lang} theme={theme} accentColor={accentColor}
                          isOpen={isCalOpen} onClose={() => setIsCalOpen(false)} anchorRef={calBtnRef}
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className={`text-[10px] font-black uppercase tracking-[0.18em] px-0.5 mb-2 block ${theme==='light' ? 'text-slate-400' : 'text-white/25'}`}>
                          {t('auth_phone')}
                        </label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setIsCtryOpen(true)}
                            className={`border rounded-2xl py-4 px-3 flex items-center gap-1.5 transition-all flex-shrink-0 ${
                              theme==='light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 'bg-white/[0.04] border-white/[0.1] hover:bg-white/[0.08]'
                            }`}>
                            <span className="text-xl leading-none">{country.flag}</span>
                            <span className={`text-xs font-black ${theme==='light' ? 'text-slate-700' : 'text-white/70'}`} style={{ direction:'ltr' }}>{country.code}</span>
                            <span className={`text-[9px] ${theme==='light' ? 'text-slate-300' : 'text-white/20'}`}>▾</span>
                          </button>
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                            placeholder="59 123 4567"
                            className={`flex-1 border rounded-2xl px-4 py-4 text-sm font-semibold outline-none transition-all ${
                              theme==='light' ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white' : 'bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/15 focus:bg-white/[0.08]'
                            }`}
                            style={{ direction:'ltr' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ STEP 3 — Review + Submit ══════════════════════════ */}
                  {step === 3 && (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className={`border rounded-2xl p-4 space-y-2.5 ${theme==='light' ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                        {[
                          { icon: '👤', label: t('auth_username'),  value: `@${username}` },
                          { icon: '📧', label: t('auth_email'),     value: email },
                          { icon: '🔒', label: t('auth_password'),  value: '••••••••' },
                          { icon: '🪪', label: t('auth_gender'),    value: gender==='male' ? t('auth_male') : t('auth_female') },
                          { icon: '🎂', label: t('auth_birthdate'), value: formatBirthdate(birthdate, lang) || '—' },
                          { icon: '📱', label: t('auth_phone'),     value: phone ? `${country.flag} ${country.code} ${phone}` : (lang==='AR' ? 'غير محدد' : 'Not specified') },
                        ].map(({ icon, label, value }) => (
                          <div key={label} className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold flex items-center gap-1.5 shrink-0 ${theme==='light' ? 'text-slate-400' : 'text-white/30'}`}>
                              <span className="text-sm leading-none">{icon}</span>{label}
                            </span>
                            <span className={`text-xs font-black truncate ${theme==='light' ? 'text-slate-900' : 'text-white/80'}`} style={{ direction:'ltr' }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Terms */}
                      <motion.div
                        animate={shakeTerms ? { x: [-6,6,-6,6,0] } : {}}
                        transition={{ duration: 0.35 }}
                        className="flex items-start gap-3 cursor-pointer group"
                        onClick={() => setAgreed(v => !v)}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          agreed ? '' : (theme==='light' ? 'bg-slate-100 border border-slate-200' : 'bg-white/5 border border-white/10')
                        }`} style={agreed ? { background: accentColor, boxShadow: `0 0 12px ${accentColor}50` } : {}}>
                          {agreed && <span className="text-white text-[10px] font-black">✓</span>}
                        </div>
                        <p className={`text-xs leading-relaxed select-none ${theme==='light' ? 'text-slate-400 group-hover:text-slate-700' : 'text-white/25 group-hover:text-white/40'}`}>
                          {lang==='AR' ? 'أوافق على' : 'I agree to the'}{' '}
                          <span className="font-black" style={{ color: `${accentColor}cc` }}>{lang==='AR' ? 'شروط الاستخدام' : 'Terms of Service'}</span>
                          {lang==='AR' ? ' و' : ' and '}<span className="font-black" style={{ color: `${accentColor}cc` }}>{lang==='AR' ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
                        </p>
                      </motion.div>
                    </div>
                  )}

                  {/* ══ STEP 4 — Email OTP ════════════════════════════════ */}
                  {step === 4 && (
                    <div className="space-y-5">
                      {/* Info */}
                      <div className={`rounded-2xl p-4 border text-center ${theme==='light' ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/[0.07]'}`}>
                        <p className={`text-xs font-medium mb-1 ${theme==='light' ? 'text-slate-400' : 'text-white/35'}`}>
                          {lang==='AR' ? 'أرسلنا رمز تحقق إلى' : 'We sent a verification code to'}
                        </p>
                        <p className={`text-sm font-black ${theme==='light' ? 'text-slate-900' : 'text-white'}`} style={{ direction:'ltr' }}>
                          {maskEmail(email)}
                        </p>
                      </div>

                      {/* OTP boxes */}
                      <div>
                        <OTPInput value={otp} onChange={setOtp} theme={theme} accentColor={accentColor} />
                        {errors.otp && (
                          <p className="text-center text-[10px] text-pink-400 mt-2 font-bold">{errors.otp}</p>
                        )}
                      </div>

                      {/* Verify button */}
                      <motion.button type="button" onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor} 0%, #EC4899 100%)`,
                          boxShadow: `0 10px 30px ${accentColor}35`,
                          opacity: (loading || otp.length < 6) ? 0.6 : 1,
                        }}>
                        {loading
                          ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <>{lang==='AR' ? 'تحقق وابدأ' : 'Verify & Start'} ✓</>}
                      </motion.button>

                      {/* Resend */}
                      <div className="text-center">
                        {resendTimer > 0 ? (
                          <p className={`text-xs font-bold ${theme==='light' ? 'text-slate-300' : 'text-white/20'}`}>
                            {lang==='AR' ? `إعادة الإرسال بعد ${resendTimer}ث` : `Resend in ${resendTimer}s`}
                          </p>
                        ) : (
                          <button type="button" onClick={handleResend}
                            className={`text-xs font-bold transition-colors ${theme==='light' ? 'text-slate-400 hover:text-slate-900' : 'text-white/30 hover:text-white/70'}`}>
                            {lang==='AR' ? 'لم يصلك الرمز؟ أعد الإرسال' : "Didn't receive it? Resend"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Footer nav (not shown on step 4 since it has its own button) ── */}
            {step !== 4 && (
              <div className="relative z-10 flex gap-3 mt-6">
                {step > 1 && (
                  <motion.button type="button" onClick={goBack} whileTap={{ scale: 0.96 }}
                    className={`flex-shrink-0 px-5 py-4 rounded-2xl border transition-all text-sm font-bold ${
                      theme==='light'
                        ? 'text-slate-400 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-white/35 border-white/10 hover:text-white/70 hover:bg-white/5'
                    }`}>
                    {dir==='rtl' ? `← ${t('auth_back')}` : `← ${t('auth_back')}`}
                  </motion.button>
                )}

                {step < 3 ? (
                  <motion.button type="button" onClick={goNext}
                    whileHover={{ scale: 1.01, filter: 'brightness(1.08)' }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #EC4899 100%)`, boxShadow: `0 10px 30px ${accentColor}35` }}>
                    <span>{t('auth_next')}</span>
                    <span>{dir==='rtl' ? '←' : '→'}</span>
                  </motion.button>
                ) : (
                  <motion.button type="button" onClick={handleRegister} disabled={loading}
                    whileHover={{ scale: 1.01, filter: 'brightness(1.08)' }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, #EC4899 100%)`,
                      boxShadow: `0 10px 30px ${accentColor}35`,
                      opacity: loading ? 0.75 : 1,
                    }}>
                    {loading
                      ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <>{t('auth_submit')} 🚀</>}
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Login link */}
          <p className={`text-center mt-4 text-xs font-medium ${theme==='light' ? 'text-slate-400' : 'text-white/25'}`}>
            {lang==='AR' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link href="/auth/login" className="font-black transition-colors" style={{ color: accentColor }}>
              {lang==='AR' ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Country modal */}
      <CountryModal
        isOpen={isCtryOpen} onClose={() => setIsCtryOpen(false)}
        onSelect={c => setCountry(c)} lang={lang} theme={theme} accentColor={accentColor}
      />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .custom-scroll-r::-webkit-scrollbar       { width: 3px; }
        .custom-scroll-r::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll-r::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 20px; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}
