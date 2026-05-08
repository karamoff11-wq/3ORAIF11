'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'react-hot-toast'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Gender = 'male' | 'female'
type Step   = 1 | 2 | 3

interface Country {
  code: string
  name: string
  iso:  string
  flag: string
}

interface FormErrors {
  username?:       string
  email?:          string
  password?:       string
  confirmPassword?: string
  gender?:         string
  birthdate?:      string
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken'

interface PasswordStrength {
  score: 0 | 1 | 2 | 3
  label: string
  color: string
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ALL_COUNTRIES: Country[] = [
  // Arab World (Priority)
  { code: '+970', name: 'فلسطين',                iso: 'ps', flag: '🇵🇸' },
  { code: '+966', name: 'السعودية',               iso: 'sa', flag: '🇸🇦' },
  { code: '+971', name: 'الإمارات',               iso: 'ae', flag: '🇦🇪' },
  { code: '+965', name: 'الكويت',                 iso: 'kw', flag: '🇰🇼' },
  { code: '+974', name: 'قطر',                    iso: 'qa', flag: '🇶🇦' },
  { code: '+973', name: 'البحرين',                iso: 'bh', flag: '🇧🇭' },
  { code: '+968', name: 'عمان',                   iso: 'om', flag: '🇴🇲' },
  { code: '+962', name: 'الأردن',                 iso: 'jo', flag: '🇯🇴' },
  { code: '+961', name: 'لبنان',                  iso: 'lb', flag: '🇱🇧' },
  { code: '+964', name: 'العراق',                 iso: 'iq', flag: '🇮🇶' },
  { code: '+20',  name: 'مصر',                    iso: 'eg', flag: '🇪🇬' },
  { code: '+963', name: 'سوريا',                  iso: 'sy', flag: '🇸🇾' },
  { code: '+967', name: 'اليمن',                  iso: 'ye', flag: '🇾🇪' },
  { code: '+218', name: 'ليبيا',                  iso: 'ly', flag: '🇱🇾' },
  { code: '+216', name: 'تونس',                   iso: 'tn', flag: '🇹🇳' },
  { code: '+213', name: 'الجزائر',                iso: 'dz', flag: '🇩🇿' },
  { code: '+212', name: 'المغرب',                 iso: 'ma', flag: '🇲🇦' },
  { code: '+249', name: 'السودان',                iso: 'sd', flag: '🇸🇩' },
  { code: '+252', name: 'الصومال',                iso: 'so', flag: '🇸🇴' },
  { code: '+222', name: 'موريتانيا',              iso: 'mr', flag: '🇲🇷' },
  { code: '+253', name: 'جيبوتي',                 iso: 'dj', flag: '🇩🇯' },
  { code: '+269', name: 'جزر القمر',              iso: 'km', flag: '🇰🇲' },
  // Africa
  { code: '+27',  name: 'جنوب أفريقيا',           iso: 'za', flag: '🇿🇦' },
  { code: '+234', name: 'نيجيريا',                iso: 'ng', flag: '🇳🇬' },
  { code: '+254', name: 'كينيا',                  iso: 'ke', flag: '🇰🇪' },
  { code: '+233', name: 'غانا',                   iso: 'gh', flag: '🇬🇭' },
  { code: '+251', name: 'إثيوبيا',                iso: 'et', flag: '🇪🇹' },
  { code: '+255', name: 'تنزانيا',                iso: 'tz', flag: '🇹🇿' },
  { code: '+256', name: 'أوغندا',                 iso: 'ug', flag: '🇺🇬' },
  { code: '+237', name: 'الكاميرون',              iso: 'cm', flag: '🇨🇲' },
  { code: '+221', name: 'السنغال',                iso: 'sn', flag: '🇸🇳' },
  // Asia
  { code: '+90',  name: 'تركيا',                  iso: 'tr', flag: '🇹🇷' },
  { code: '+98',  name: 'إيران',                  iso: 'ir', flag: '🇮🇷' },
  { code: '+92',  name: 'باكستان',                iso: 'pk', flag: '🇵🇰' },
  { code: '+91',  name: 'الهند',                  iso: 'in', flag: '🇮🇳' },
  { code: '+880', name: 'بنغلاديش',              iso: 'bd', flag: '🇧🇩' },
  { code: '+94',  name: 'سريلانكا',               iso: 'lk', flag: '🇱🇰' },
  { code: '+62',  name: 'إندونيسيا',              iso: 'id', flag: '🇮🇩' },
  { code: '+60',  name: 'ماليزيا',                iso: 'my', flag: '🇲🇾' },
  { code: '+63',  name: 'الفلبين',                iso: 'ph', flag: '🇵🇭' },
  { code: '+66',  name: 'تايلاند',                iso: 'th', flag: '🇹🇭' },
  { code: '+84',  name: 'فيتنام',                 iso: 'vn', flag: '🇻🇳' },
  { code: '+86',  name: 'الصين',                  iso: 'cn', flag: '🇨🇳' },
  { code: '+81',  name: 'اليابان',                iso: 'jp', flag: '🇯🇵' },
  { code: '+82',  name: 'كوريا الجنوبية',         iso: 'kr', flag: '🇰🇷' },
  { code: '+7',   name: 'روسيا',                  iso: 'ru', flag: '🇷🇺' },
  { code: '+993', name: 'تركمانستان',             iso: 'tm', flag: '🇹🇲' },
  { code: '+998', name: 'أوزبكستان',              iso: 'uz', flag: '🇺🇿' },
  { code: '+992', name: 'طاجيكستان',              iso: 'tj', flag: '🇹🇯' },
  { code: '+996', name: 'قرغيزستان',              iso: 'kg', flag: '🇰🇬' },
  { code: '+7',   name: 'كازاخستان',              iso: 'kz', flag: '🇰🇿' },
  { code: '+993', name: 'أفغانستان',              iso: 'af', flag: '🇦🇫' },
  // Europe
  { code: '+44',  name: 'المملكة المتحدة',        iso: 'gb', flag: '🇬🇧' },
  { code: '+33',  name: 'فرنسا',                  iso: 'fr', flag: '🇫🇷' },
  { code: '+49',  name: 'ألمانيا',                iso: 'de', flag: '🇩🇪' },
  { code: '+39',  name: 'إيطاليا',                iso: 'it', flag: '🇮🇹' },
  { code: '+34',  name: 'إسبانيا',                iso: 'es', flag: '🇪🇸' },
  { code: '+31',  name: 'هولندا',                 iso: 'nl', flag: '🇳🇱' },
  { code: '+32',  name: 'بلجيكا',                 iso: 'be', flag: '🇧🇪' },
  { code: '+41',  name: 'سويسرا',                 iso: 'ch', flag: '🇨🇭' },
  { code: '+43',  name: 'النمسا',                 iso: 'at', flag: '🇦🇹' },
  { code: '+46',  name: 'السويد',                 iso: 'se', flag: '🇸🇪' },
  { code: '+47',  name: 'النرويج',                iso: 'no', flag: '🇳🇴' },
  { code: '+45',  name: 'الدنمارك',               iso: 'dk', flag: '🇩🇰' },
  { code: '+358', name: 'فنلندا',                 iso: 'fi', flag: '🇫🇮' },
  { code: '+30',  name: 'اليونان',                iso: 'gr', flag: '🇬🇷' },
  { code: '+48',  name: 'بولندا',                 iso: 'pl', flag: '🇵🇱' },
  { code: '+351', name: 'البرتغال',               iso: 'pt', flag: '🇵🇹' },
  { code: '+380', name: 'أوكرانيا',               iso: 'ua', flag: '🇺🇦' },
  // Americas
  { code: '+1',   name: 'الولايات المتحدة',       iso: 'us', flag: '🇺🇸' },
  { code: '+1',   name: 'كندا',                   iso: 'ca', flag: '🇨🇦' },
  { code: '+55',  name: 'البرازيل',               iso: 'br', flag: '🇧🇷' },
  { code: '+52',  name: 'المكسيك',                iso: 'mx', flag: '🇲🇽' },
  { code: '+54',  name: 'الأرجنتين',              iso: 'ar', flag: '🇦🇷' },
  { code: '+57',  name: 'كولومبيا',               iso: 'co', flag: '🇨🇴' },
  { code: '+56',  name: 'تشيلي',                  iso: 'cl', flag: '🇨🇱' },
  { code: '+51',  name: 'بيرو',                   iso: 'pe', flag: '🇵🇪' },
  // Oceania
  { code: '+61',  name: 'أستراليا',               iso: 'au', flag: '🇦🇺' },
  { code: '+64',  name: 'نيوزيلندا',              iso: 'nz', flag: '🇳🇿' },
  // Additional
  { code: '+972', name: 'الأراضي الفلسطينية المحتلة', iso: 'il', flag: '🇮🇱' },
]

const MONTHS      = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const DAYS_HEADER = ['ح','ن','ث','ر','خ','ج','س']

const TEMP_EMAIL_DOMAINS = [
  'tempmail.com', 'mailinator.com', 'guerrillamail.com', '10minutemail.com', 
  'trashmail.com', 'yopmail.com', 'getnada.com', 'temp-mail.org',
  'dispostable.com', 'sharklasers.com', 'maildrop.cc', 'temp-mail.io',
  'tempmailaddress.com', 'mintemail.com', 'fakeinbox.com', 'mytrashmail.com'
]

const STEP_META = [
  { label: 'معلومات الحساب',    sub: 'اختر بياناتك الأساسية',       icon: '🔐' },
  { label: 'معلوماتك الشخصية', sub: 'أخبرنا قليلاً عن نفسك',       icon: '👤' },
  { label: 'مراجعة وإنشاء',    sub: 'تحقق من بياناتك وابدأ رحلتك', icon: '🚀' },
]

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getPasswordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: '', color: '' }
  let s = 0
  if (pw.length >= 8)           s++
  if (pw.length >= 12)          s++
  if (/[A-Z]/.test(pw))        s++
  if (/[0-9]/.test(pw))        s++
  if (/[^A-Za-z0-9]/.test(pw)) s++

  if (s <= 1) return { score: 1, label: 'ضعيفة جداً', color: '#ef4444' }
  if (s <= 3) return { score: 2, label: 'متوسطة',     color: '#f59e0b' }
  return              { score: 3, label: 'قوية 💪',    color: '#22c55e' }
}

function formatBirthdate(raw: string): string {
  if (!raw) return ''
  const [y, m, d] = raw.split('-')
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]} ${y}`
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
const Logo = ({ className = 'w-9 h-9' }: { className?: string }) => {
  const { logoUrl } = useFeedbackStore()
  return logoUrl ? (
    <img src={logoUrl} alt="Logo" className={`${className} object-contain`} />
  ) : (
    <div className={`${className} rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-sm`}>
      ع
    </div>
  )
}

// Aurora + noise background
const AuroraBackground = ({ accentColor, theme }: { accentColor: string; theme: 'light' | 'dark' }) => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none transition-colors duration-1000">
    {/* Vivid Gradient Background */}
    <div className={`absolute inset-0 transition-colors duration-700 ${theme === 'light' ? 'bg-slate-50' : 'bg-[#06061a]'}`} />
    
    {/* SVG noise */}
    <svg className={`absolute inset-0 w-full h-full transition-opacity ${theme === 'light' ? 'opacity-[0.03]' : 'opacity-[0.06]'}`} style={{ mixBlendMode: 'overlay' }}>
      <filter id="noise-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-filter)" />
    </svg>

    {/* Vignette */}
    <div className="absolute inset-0"
      style={{ background: theme === 'light' 
        ? 'radial-gradient(circle at center, transparent 40%, rgba(203,213,225,0.4) 100%)' 
        : 'radial-gradient(circle at center, transparent 30%, rgba(4,4,15,0.9) 100%)' }} />

    {/* Orbs */}
    <motion.div
      animate={{ scale: [1, 1.4, 1], rotate: [0, 45, 0], opacity: theme === 'light' ? [0.1, 0.15, 0.1] : [0.3, 0.45, 0.3] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute top-[-30%] left-[-20%] w-[90vw] h-[90vw] rounded-full blur-[180px]"
      style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 75%)` }}
    />
    <motion.div
      animate={{ scale: [1.3, 1, 1.3], rotate: [0, -30, 0], opacity: theme === 'light' ? [0.08, 0.12, 0.08] : [0.25, 0.4, 0.25] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute bottom-[-30%] right-[-20%] w-[80vw] h-[80vw] rounded-full blur-[180px]"
      style={{ background: 'radial-gradient(circle, #EC4899 0%, transparent 75%)' }}
    />
  </div>
)

// Step progress bar (Sleek & Professional)
const StepProgress = ({ current, accentColor, theme }: { current: Step; accentColor: string; theme: 'light' | 'dark' }) => (
  <div className="flex items-center gap-1.5 px-2">
    {([1, 2, 3] as Step[]).map(s => (
      <React.Fragment key={s}>
        <div className="relative flex-1 flex items-center justify-center">
          <motion.div
            animate={{
              height:  s === current ? 3 : 2,
              opacity: s <= current  ? 1   : 0.15,
              backgroundColor: s <= current ? accentColor : (theme === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)'),
              boxShadow: s === current ? `0 0 12px ${accentColor}80` : 'none',
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-full flex-shrink-0"
          />
          {s === current && (
             <motion.div 
               layoutId="progress-glow"
               className="absolute inset-0 blur-[4px] rounded-full"
               style={{ background: accentColor, opacity: 0.3 }}
             />
          )}
        </div>
        {s < 3 && (
          <div className={`w-4 h-[1px] opacity-10 ${theme === 'light' ? 'bg-slate-900' : 'bg-white'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
)

// Reusable input
interface InputProps {
  label:        string
  value:        string
  onChange:     (e: React.ChangeEvent<HTMLInputElement>) => void
  type?:        string
  placeholder?: string
  error?:       string
  badge?:       React.ReactNode
  rightSlot?:   React.ReactNode
  hint?:        React.ReactNode
  autoComplete?: string
  borderColor?: string
  theme:        'light' | 'dark'
}

const Field = ({
  label, value, onChange, type = 'text', placeholder, error,
  badge, rightSlot, hint, autoComplete, borderColor, theme,
}: InputProps) => (
  <div className="group">
    <div className="flex items-center justify-between mb-2 px-1">
      <label className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${theme === 'light' ? 'text-slate-400 group-focus-within:text-slate-900' : 'text-white/30 group-focus-within:text-white/60'}`}>
        {label}
      </label>
      <AnimatePresence mode="wait">
        {badge && (
          <motion.div key="badge" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            {badge}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-2xl px-5 py-4 text-sm font-semibold outline-none transition-all duration-500 border ${
          theme === 'light' 
            ? 'bg-slate-100/50 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:shadow-[0_10px_30px_rgba(0,0,0,0.03)]' 
            : 'bg-white/[0.03] text-white placeholder:text-white/15 focus:bg-white/[0.08] focus:shadow-[0_0_30px_rgba(255,255,255,0.05)]'
        }`}
        style={{
          direction:   'rtl',
          borderColor: borderColor ?? (error ? 'rgba(236,72,153,0.5)' : (theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.12)')),
          paddingRight: rightSlot ? '3.5rem' : '1.25rem',
        }}
      />
      {rightSlot && (
        <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 transition-opacity ${theme === 'light' ? 'opacity-20 hover:opacity-100' : 'opacity-40 hover:opacity-100'}`}>
          {rightSlot}
        </div>
      )}
    </div>
    {hint}
  </div>
)

// Error badge
const ErrBadge = ({ msg }: { msg: string }) => (
  <span className="text-[9px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
    {msg}
  </span>
)

// Icon toggle button (password eye) — SVG, no overlap
const EyeBtn = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
  <button type="button" onClick={onToggle}
    className="text-white/30 hover:text-white/80 transition-colors">
    {show ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )}
  </button>
)

// ─────────────────────────────────────────────
// Framer variants
// ─────────────────────────────────────────────
const slideVariants = {
  enter:  (d: number) => ({ x: d * 55, opacity: 0, filter: 'blur(4px)' }),
  center: { x: 0,        opacity: 1, filter: 'blur(0px)' },
  exit:   (d: number) => ({ x: d * -55, opacity: 0, filter: 'blur(4px)' }),
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { accentColor, logoUrl, themeMode, lang } = useFeedbackStore()
  const theme = themeMode === 'light' ? 'light' : 'dark'
  const dir   = lang === 'AR' ? 'rtl' : 'ltr'
  const t = useTranslator()

  // ── Step state ──
  const [step,      setStep]      = useState<Step>(1)
  const [direction, setDirection] = useState<1 | -1>(1)

  // ── Form fields ──
  const [username,  setUsername]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [gender,    setGender]    = useState<Gender | null>(null)
  const [phone,     setPhone]     = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [country,   setCountry]   = useState<Country>(ALL_COUNTRIES[0])

  // ── UI flags ──
  const [showPw,        setShowPw]        = useState(false)
  const [showCf,        setShowCf]        = useState(false)
  const [agreed,        setAgreed]        = useState(false)
  const [shakeTerms,    setShakeTerms]    = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [errors,        setErrors]        = useState<FormErrors>({})
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [isCalOpen,     setIsCalOpen]     = useState(false)
  const [viewDate,      setViewDate]      = useState(new Date())
  const [countryQ,      setCountryQ]      = useState('')

  // ── Username availability ──
  const [unStatus,    setUnStatus]    = useState<UsernameStatus>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const unTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const generateSuggestions = (base: string) => {
    const clean = base.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '')
    return [
      `${clean}${Math.floor(Math.random() * 999)}`,
      `${clean}${Math.floor(Math.random() * 99)}`,
      `pro${clean}`,
      `${clean}v1`
    ]
  }

  const checkUsername = useCallback(async (val: string) => {
    const cleanVal = val.trim()
    if (cleanVal.length < 3) { setUnStatus('idle'); return }
    
    // Validate characters (Arabic, English, Numbers only)
    const isValidChar = /^[a-zA-Z0-9\u0600-\u06FF]+$/.test(cleanVal)
    if (!isValidChar) {
      setUnStatus('taken')
      setErrors(p => ({ ...p, username: 'الأحرف والأرقام فقط بدون رموز' }))
      return
    }

    setUnStatus('checking')
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', cleanVal)
      .maybeSingle()
    
    if (data) {
      setUnStatus('taken')
      setSuggestions(generateSuggestions(cleanVal))
    } else {
      setUnStatus('available')
      setSuggestions([])
    }
  }, [supabase])

  useEffect(() => {
    clearTimeout(unTimer.current)
    if (username.length >= 3) {
      unTimer.current = setTimeout(() => checkUsername(username), 600)
    } else {
      setUnStatus('idle')
    }
    return () => clearTimeout(unTimer.current)
  }, [username, checkUsername])

  // ── Email availability check ──
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const emailTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const checkEmail = useCallback(async (val: string) => {
    const cleanVal = val.trim()
    if (!cleanVal || !cleanVal.includes('@')) { setEmailStatus('idle'); return }
    
    setEmailStatus('checking')
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', cleanVal)
      .maybeSingle()
    
    setEmailStatus(data ? 'taken' : 'available')
  }, [supabase])

  useEffect(() => {
    clearTimeout(emailTimer.current)
    if (email.includes('@')) {
      emailTimer.current = setTimeout(() => checkEmail(email), 800)
    } else {
      setEmailStatus('idle')
    }
    return () => clearTimeout(emailTimer.current)
  }, [email, checkEmail])

  // ── Password strength ──
  const pwStrength = getPasswordStrength(password)

  // ── Calendar ──
  const today       = new Date()
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const firstDay    = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()
  const calDays: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const handleDateSelect = (day: number) => {
    const y = viewDate.getFullYear()
    const m = String(viewDate.getMonth() + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    setBirthdate(`${y}-${m}-${d}`)
    setIsCalOpen(false)
    setErrors(p => ({ ...p, birthdate: '' }))
  }

  // ── Validation ──
  const validateStep = (s: Step): boolean => {
    const e: FormErrors = {}
    if (s === 1) {
      const cleanUn = username.trim()
      if (!cleanUn || cleanUn.length < 3)  e.username = 'اسم المستخدم قصير جداً (3 أحرف+)'
      if (unStatus === 'taken')            e.username = errors.username || 'هذا الاسم مأخوذ بالفعل'
      
      const emailDomain = email.split('@')[1]
      if (!email || !email.includes('@')) {
        e.email = 'بريد إلكتروني غير صالح'
      } else if (TEMP_EMAIL_DOMAINS.includes(emailDomain)) {
        e.email = 'لا يُسمح باستخدام البريد المؤقت'
      } else if (emailStatus === 'taken') {
        e.email = 'هذا البريد مسجل مسبقاً'
      }
      
      if (!password || password.length < 8) e.password       = 'على الأقل 8 أحرف'
      if (password !== confirm)             e.confirmPassword = 'كلمات المرور غير متطابقة'
    }
    if (s === 2) {
      if (!gender)    e.gender    = 'يرجى اختيار الجنس'
      if (!birthdate) {
        e.birthdate = 'يرجى اختيار تاريخ الميلاد'
      } else {
        const birthDateObj = new Date(birthdate)
        const age = today.getFullYear() - birthDateObj.getFullYear()
        const m = today.getMonth() - birthDateObj.getMonth()
        if (age < 13 || (age === 13 && m < 0)) {
          e.birthdate = 'يجب أن يكون عمرك 13 عاماً على الأقل'
        }
      }
      const phoneClean = phone.replace(/[^0-9]/g, '')
      if (!phone || phoneClean.length < 8 || phoneClean.length > 15) {
        toast.error('يرجى إدخال رقم هاتف حقيقي (8-15 رقم)')
        return false 
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setDirection(1)
    setStep(s => (s + 1) as Step)
  }

  const goBack = () => {
    setErrors({})
    setDirection(-1)
    setStep(s => (s - 1) as Step)
  }

  // ── Submit ──
  const handleRegister = async () => {
    if (!agreed) {
      setShakeTerms(true)
      setTimeout(() => setShakeTerms(false), 500)
      toast.error('يرجى الموافقة على الشروط أولاً')
      return
    }
    setLoading(true)
    const fullPhone = phone ? `${country.code}${phone}` : ''

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { username: username.toLowerCase(), gender, phone: fullPhone, birthdate },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('أهلاً بك! تم إنشاء حسابك بنجاح 🎉')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  // ── Derived ──
  const filteredCountries = ALL_COUNTRIES.filter(
    c => c.name.includes(countryQ) || c.code.includes(countryQ) || c.iso.includes(countryQ.toLowerCase())
  )

  const unBorderColor =
    errors.username      ? 'rgba(236,72,153,0.45)'  :
    unStatus === 'taken' ? 'rgba(236,72,153,0.45)'  :
    unStatus === 'available' ? 'rgba(34,197,94,0.45)' :
    theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'

  const selectedDay = birthdate ? parseInt(birthdate.split('-')[2]) : null

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen w-full flex flex-col relative transition-colors duration-500 ${theme === 'dark' ? 'bg-[#06061a] text-white' : 'bg-slate-50 text-slate-900'}`}
      style={{ direction: dir, fontFamily: lang === 'AR' ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}
    >
      <AuroraBackground accentColor={accentColor} theme={theme} />

      {/* ── Nav ── */}
      <nav className="relative z-50 flex-shrink-0 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className={`text-base font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            {lang === 'AR' ? 'العُريف' : 'Al-Arif'}
          </span>
        </div>
        <Link
          href="/auth/login"
          className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
            theme === 'light' 
              ? 'text-slate-400 border-slate-200 hover:text-slate-900 hover:bg-slate-100' 
              : 'text-white/35 border-white/10 hover:text-white hover:bg-white/5 hover:border-white/20'
          }`}
        >
          {t('nav_login')}
        </Link>
      </nav>

      {/* ── Centered card ── */}
      <div className="relative z-40 flex-1 flex items-start justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[460px] relative"
        >
          {/* Glass card */}
          <div className={`backdrop-blur-[40px] border rounded-[28px] p-7 transition-all duration-500 relative ${
            theme === 'light' 
              ? 'bg-white/80 border-slate-200 shadow-[0_40px_100px_rgba(0,0,0,0.06)]' 
              : 'bg-white/[0.025] border-white/[0.09] shadow-[0_0_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)]'
          }`}>
            
            {/* Inner highlight */}
            <div className={`absolute inset-0 rounded-[28px] pointer-events-none ${theme === 'light' ? 'bg-gradient-to-br from-slate-50/50 to-transparent' : 'bg-gradient-to-br from-white/[0.04] via-transparent to-transparent'}`} />

            {/* ── Header ── */}
            <div className="text-center mb-5 relative z-10">
              <motion.div
                key={step}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                className="text-2xl mb-1.5"
              >
                {STEP_META[step - 1].icon}
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div key={`title-${step}`}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}>
                  <h1 className={`text-xl font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{STEP_META[step - 1].label}</h1>
                  <p className={`text-xs font-medium mt-0.5 ${theme === 'light' ? 'text-slate-400' : 'text-white/25'}`}>{STEP_META[step - 1].sub}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Progress ── */}
            <div className="mb-6 relative z-10">
              <StepProgress current={step} accentColor={accentColor} theme={theme} />
              <p className={`text-[10px] text-center mt-1.5 font-bold ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`}>
                {step} / 3
              </p>
            </div>

            {/* ── Step content ── */}
            <div className="relative z-10" style={{ minHeight: 288 }}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >

                  {/* ══════════════════════════
                      STEP 1 — Account info
                  ══════════════════════════ */}
                  {step === 1 && (
                    <div className="space-y-4">

                      {/* Username */}
                      <div className="space-y-2">
                        <Field
                          label={t('auth_username')}
                          value={username}
                          onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: '' })) }}
                          placeholder="username_99"
                          autoComplete="username"
                          borderColor={unBorderColor}
                          theme={theme}
                          badge={
                            errors.username ? <ErrBadge msg={errors.username} /> :
                            unStatus === 'available' ? (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">✓ {lang === 'AR' ? 'متاح' : 'Available'}</span>
                            ) : unStatus === 'taken' ? (
                              <span className="text-[9px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">✗ {lang === 'AR' ? 'مأخوذ' : 'Taken'}</span>
                            ) : unStatus === 'checking' ? (
                              <span className={`text-[9px] font-bold animate-pulse ${theme === 'light' ? 'text-slate-300' : 'text-white/25'}`}>{lang === 'AR' ? 'جاري التحقق…' : 'Checking…'}</span>
                            ) : undefined
                          }
                        />
                        
                        {/* Suggestions */}
                        <AnimatePresence>
                          {unStatus === 'taken' && suggestions.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="px-1"
                            >
                              <p className={`text-[10px] mb-2 font-bold ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>
                                {lang === 'AR' ? 'اقتراحات ذكية:' : 'Smart Suggestions:'}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.map(s => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setUsername(s)}
                                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                                      theme === 'light'
                                        ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30'
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Email */}
                      <Field
                        label={t('auth_email')}
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                        placeholder="name@example.com"
                        autoComplete="email"
                        error={errors.email}
                        theme={theme}
                        badge={
                          errors.email ? <ErrBadge msg={errors.email} /> :
                          emailStatus === 'taken' ? <ErrBadge msg={lang === 'AR' ? 'البريد مسجل مسبقاً' : 'Email already exists'} /> :
                          emailStatus === 'available' ? <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">✓ {lang === 'AR' ? 'صالح' : 'Valid'}</span> :
                          emailStatus === 'checking' ? <span className={`text-[9px] font-bold animate-pulse ${theme === 'light' ? 'text-slate-300' : 'text-white/25'}`}>{lang === 'AR' ? 'جاري التحقق…' : 'Checking…'}</span> :
                          undefined
                        }
                      />

                      {/* Password */}
                      <div className="group">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <label className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${theme === 'light' ? 'text-slate-400 group-focus-within:text-slate-900' : 'text-white/20 group-focus-within:text-white/40'}`}>
                            {t('auth_password')}
                          </label>
                          <AnimatePresence mode="wait">
                            {errors.password
                              ? <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ErrBadge msg={errors.password} /></motion.div>
                              : password
                              ? <motion.span key="str" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                                  style={{ color: pwStrength.color, borderColor: `${pwStrength.color}40`, background: `${pwStrength.color}12` }}>
                                  {pwStrength.label}
                                </motion.span>
                              : null
                            }
                          </AnimatePresence>
                        </div>
                        <div className="relative">
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={password}
                            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={`w-full rounded-2xl px-5 py-4 pr-14 text-sm font-semibold outline-none transition-all duration-300 border ${
                              theme === 'light' 
                                ? 'bg-slate-100/50 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:shadow-[0_10px_30px_rgba(0,0,0,0.03)]' 
                                : 'bg-white/[0.03] text-white placeholder:text-white/15 focus:bg-white/[0.07]'
                            }`}
                            style={{ direction: 'ltr', borderColor: errors.password ? 'rgba(236,72,153,0.45)' : (theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.12)') }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className={`absolute top-1/2 -translate-y-1/2 left-4 text-lg transition-all hover:scale-110 active:scale-95 ${theme === 'light' ? 'opacity-40' : 'opacity-20'}`}
                          >
                            {showPw ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════
                      STEP 2 — Personal info
                   ══════════════════════════ */}
                  {step === 2 && (
                    <div className="space-y-4">

                      {/* Gender */}
                      <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest px-0.5 mb-2 block ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                          {t('auth_gender')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {(['male', 'female'] as Gender[]).map(g => (
                            <motion.button key={g} type="button" whileTap={{ scale: 0.96 }}
                              onClick={() => { setGender(g); setErrors(p => ({ ...p, gender: '' })) }}
                              className="py-4 rounded-2xl text-sm font-bold transition-all duration-200 border relative overflow-hidden"
                              style={{
                                borderColor: gender === g ? accentColor : (errors.gender ? 'rgba(236,72,153,0.35)' : (theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)')),
                                background:  gender === g ? `${accentColor}20` : (theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'),
                                color:       gender === g ? (theme === 'light' ? accentColor : '#ffffff') : (theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)'),
                                boxShadow:   gender === g ? `0 0 20px ${accentColor}22` : undefined,
                              }}>
                              <span className="text-base ml-1.5">{g === 'male' ? '👦' : '👩'}</span>
                              {g === 'male' ? t('auth_male') : t('auth_female')}
                            </motion.button>
                          ))}
                        </div>
                        {errors.gender && (
                          <p className="text-[10px] text-pink-400 mt-1.5 px-0.5 font-bold">{errors.gender}</p>
                        )}
                      </div>

                      {/* Birthdate */}
                      <div className="relative">
                        <label className={`text-[10px] font-black uppercase tracking-widest px-0.5 mb-2 block ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                          {t('auth_birthdate')}
                        </label>
                        <button type="button" onClick={() => setIsCalOpen(v => !v)}
                          className={`w-full border rounded-2xl py-3.5 px-4 text-sm font-bold text-right transition-all flex items-center justify-between ${
                            theme === 'light' ? 'bg-slate-100/50 hover:bg-slate-200/50 text-slate-900' : 'bg-white/[0.04] hover:bg-white/[0.07] text-white'
                          }`}
                          style={{ direction: dir, borderColor: errors.birthdate ? 'rgba(236,72,153,0.45)' : (theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)') }}>
                          <span className={birthdate ? (theme === 'light' ? 'text-slate-900' : 'text-white') : (theme === 'light' ? 'text-slate-400' : 'text-white/30')}>
                            {birthdate ? formatBirthdate(birthdate) : (lang === 'AR' ? 'اختر تاريخ ميلادك' : 'Select your birthdate')}
                          </span>
                          <div className="flex items-center gap-2">
                            {birthdate && (new Date().getFullYear() - new Date(birthdate).getFullYear() >= 13) && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                                +13 {lang === 'AR' ? 'مؤهل' : 'Eligible'} ✓
                              </span>
                            )}
                            <span className={`text-base ${theme === 'light' ? 'opacity-40' : 'opacity-20'}`}>📅</span>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isCalOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                            >
                              <div className={`w-full max-w-sm border rounded-[40px] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden transition-colors ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0a0a1f] border-white/10'}`}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                                
                                <div className="flex items-center justify-between mb-8">
                                  <h2 className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{lang === 'AR' ? 'اختر تاريخ ميلادك' : 'Select Birthdate'}</h2>
                                  <button onClick={() => setIsCalOpen(false)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${theme === 'light' ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-white/5 text-white hover:bg-white/10'}`}>✕</button>
                                </div>

                                {/* Month/Year Selector */}
                                <div className="flex gap-2 mb-6">
                                  <select 
                                    value={viewDate.getMonth()} 
                                    onChange={e => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value)))}
                                    className={`flex-1 border rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all appearance-none text-center ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400' : 'bg-white/5 border-white/10 text-white focus:border-purple-500/50'}`}
                                  >
                                    {MONTHS.map((m, i) => <option key={m} value={i} className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-[#0a0a1f] text-white'}>{m}</option>)}
                                  </select>
                                  <select 
                                    value={viewDate.getFullYear()} 
                                    onChange={e => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth()))}
                                    className={`flex-1 border rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all appearance-none text-center ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400' : 'bg-white/5 border-white/10 text-white focus:border-purple-500/50'}`}
                                  >
                                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y} className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-[#0a0a1f] text-white'}>{y}</option>)}
                                  </select>
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                  {DAYS_HEADER.map(d => <div key={d} className={`text-[10px] font-black text-center uppercase ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`}>{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                  {calDays.map((d, i) => {
                                    const isFuture = d !== null && new Date(viewDate.getFullYear(), viewDate.getMonth(), d) > today
                                    const isSel    = d !== null && d === selectedDay &&
                                      parseInt(birthdate.split('-')[1]) - 1 === viewDate.getMonth() &&
                                      parseInt(birthdate.split('-')[0]) === viewDate.getFullYear()
                                    return (
                                      <button key={i} type="button"
                                        onClick={() => d && !isFuture && handleDateSelect(d)}
                                        disabled={!d || isFuture}
                                        className={`aspect-square rounded-2xl text-xs font-bold transition-all flex items-center justify-center ${
                                          !d      ? 'opacity-0' :
                                          isFuture ? 'opacity-10 cursor-not-allowed' :
                                          isSel   ? 'text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]' :
                                          (theme === 'light' ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-900' : 'text-white/40 hover:bg-white/10 hover:text-white')
                                        }`}
                                        style={{ background: isSel ? accentColor : undefined }}
                                      >
                                        {d}
                                      </button>
                                    )
                                  })}
                                </div>

                                <button onClick={() => setIsCalOpen(false)} 
                                  className={`w-full mt-8 py-4 rounded-2xl text-sm font-black transition-all ${theme === 'light' ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                                  {lang === 'AR' ? 'تأكيد الاختيار' : 'Confirm Selection'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Phone */}
                      <div className="relative">
                        <label className={`text-[10px] font-black uppercase tracking-[0.2em] px-1 mb-2 block ${theme === 'light' ? 'text-slate-400' : 'text-white/30'}`}>
                          {t('auth_phone')}
                        </label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setIsCountryOpen(v => !v)}
                            className={`border rounded-2xl py-4 px-4 flex items-center gap-2 transition-all flex-shrink-0 group ${
                              theme === 'light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 'bg-white/[0.03] border-white/[0.12] hover:bg-white/[0.08]'
                            }`}>
                            <span className="text-xl leading-none group-hover:scale-110 transition-transform">{country.flag}</span>
                            <span className={`text-xs font-bold transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-white/70'}`} style={{ direction: 'ltr' }}>{country.code}</span>
                            <span className={`text-[9px] transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>▼</span>
                          </button>
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                            placeholder="59 123 4567"
                            className={`flex-1 border rounded-2xl px-5 py-4 text-sm font-semibold outline-none transition-all ${
                              theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900 focus:bg-white focus:border-slate-300' : 'bg-white/[0.03] border-white/[0.12] text-white focus:bg-white/[0.08] focus:border-white/30'
                            }`}
                            style={{ direction: 'ltr' }}
                          />
                        </div>

                        <AnimatePresence>
                          {isCountryOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                            >
                              <div className={`w-full max-w-sm border rounded-[40px] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col h-[600px] max-h-[80vh] transition-colors ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0a0a1f] border-white/10'}`}>
                                <div className="flex items-center justify-between mb-6 shrink-0">
                                  <h2 className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{lang === 'AR' ? 'اختر رمز الدولة' : 'Select Country Code'}</h2>
                                  <button onClick={() => setIsCountryOpen(false)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${theme === 'light' ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-white/5 text-white hover:bg-white/10'}`}>✕</button>
                                </div>
                                <div className="relative mb-6 shrink-0">
                                  <input type="text" placeholder={lang === 'AR' ? 'ابحث عن الدولة أو الرمز…' : 'Search country or code…'} value={countryQ} onChange={e => setCountryQ(e.target.value)}
                                    className={`w-full border rounded-2xl px-5 py-4 text-sm outline-none transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400 placeholder:text-slate-300' : 'bg-white/5 border-white/10 text-white focus:border-purple-500/50 placeholder:text-white/20'}`} />
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
                                  {filteredCountries.map(c => (
                                    <button key={c.iso} type="button"
                                      onClick={() => { setCountry(c); setIsCountryOpen(false); setCountryQ('') }}
                                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${theme === 'light' ? 'hover:bg-slate-50 border-transparent hover:border-slate-200' : 'hover:bg-white/5 border-transparent hover:border-white/10'}`}>
                                      <div className="flex items-center gap-4">
                                        <span className="text-2xl">{c.flag}</span>
                                        <div className="text-right">
                                          <p className={`text-sm font-bold group-hover:text-purple-400 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{c.name}</p>
                                          <p className={`text-[10px] font-black tracking-widest uppercase ${theme === 'light' ? 'text-slate-300' : 'text-white/10'}`}>{lang === 'AR' ? 'دولة مسجلة' : 'Registered Country'}</p>
                                        </div>
                                      </div>
                                      <span className="text-sm font-mono font-black text-purple-400" style={{ direction: 'ltr' }}>{c.code}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════
                      STEP 3 — Review + submit
                   ══════════════════════════ */}
                  {step === 3 && (
                    <div className="space-y-4">

                      {/* Summary */}
                      <div className={`border rounded-2xl p-4 space-y-2.5 ${theme === 'light' ? 'bg-slate-100/50 border-slate-200/60' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                        {[
                          { icon: '👤', label: t('auth_username'),    value: `@${username}` },
                          { icon: '📧', label: t('auth_email'),       value: email },
                          { icon: '🔒', label: t('auth_password'),    value: '••••••••' },
                          { icon: '🪪', label: t('auth_gender'),      value: gender === 'male' ? t('auth_male') : t('auth_female') },
                          { icon: '🎂', label: t('auth_birthdate'),   value: formatBirthdate(birthdate) || '—' },
                          { icon: '📱', label: t('auth_phone'),       value: phone ? `${country.flag} ${country.code} ${phone}` : (lang === 'AR' ? 'غير محدد' : 'Not specified') },
                        ].map(({ icon, label, value }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className={`text-xs font-bold flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-500' : 'text-white/30'}`}>
                              <span className="text-sm leading-none">{icon}</span>{label}
                            </span>
                            <span className={`text-xs font-black transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white/80'}`} style={{ direction: 'ltr' }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Terms */}
                      <motion.div
                        animate={shakeTerms ? { x: [-7, 7, -7, 7, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className="flex items-start gap-3 cursor-pointer group"
                        onClick={() => setAgreed(v => !v)}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${agreed ? '' : (theme === 'light' ? 'bg-slate-100 border border-slate-200' : 'bg-white/5 border border-white/10 group-hover:border-white/25')}`}
                          style={agreed ? { background: accentColor, boxShadow: `0 0 14px ${accentColor}55` } : {}}>
                          {agreed && <span className="text-white text-[10px] font-black">✓</span>}
                        </div>
                        <p className={`text-xs leading-relaxed transition-colors ${theme === 'light' ? 'text-slate-400 group-hover:text-slate-900' : 'text-white/25 group-hover:text-white/40'}`}>
                          {lang === 'AR' ? 'أوافق على' : 'I agree to'} {' '}
                          <span className="font-black" style={{ color: `${accentColor}bb` }}>{lang === 'AR' ? 'شروط الاستخدام' : 'Terms of Service'}</span>
                          {' '}{lang === 'AR' ? 'و' : 'and'} {' '}
                          <span className="font-black" style={{ color: `${accentColor}bb` }}>{lang === 'AR' ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
                        </p>
                      </motion.div>

                      {/* Social divider */}
                      <div className="flex items-center gap-3">
                        <div className={`flex-1 h-px ${theme === 'light' ? 'bg-slate-200' : 'bg-white/[0.05]'}`} />
                        <span className={`text-[10px] font-bold whitespace-nowrap ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`}>{lang === 'AR' ? 'أو تابع باستخدام' : 'Or continue with'}</span>
                        <div className={`flex-1 h-px ${theme === 'light' ? 'bg-slate-200' : 'bg-white/[0.05]'}`} />
                      </div>

                      {/* Social buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button"
                          className={`flex items-center justify-center gap-2 py-3 rounded-2xl border hover:scale-[1.02] transition-all duration-200 ${
                            theme === 'light' 
                              ? 'bg-white border-slate-200 text-slate-400 hover:border-slate-300' 
                              : 'bg-white/[0.04] border-white/[0.08] text-white/45 hover:bg-white/[0.08] hover:border-white/[0.15]'
                          }`}>
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 19.07 12c0 .68-.09 1.34-.24 1.97H12v-3.73h7.84A9 9 0 0 0 5.27 9.76z"/>
                            <path fill="#34A853" d="M12 21a8.97 8.97 0 0 0 6.18-2.46l-3.02-2.34A5.37 5.37 0 0 1 12 17.2a5.4 5.4 0 0 1-5.1-3.63H3.77A9 9 0 0 0 12 21z"/>
                            <path fill="#FBBC05" d="M6.9 13.57A5.46 5.46 0 0 1 6.6 12c0-.55.09-1.08.3-1.57V7.86H3.77A9 9 0 0 0 3 12c0 1.44.34 2.8.95 4l2.95-2.43z"/>
                            <path fill="#4285F4" d="M12 6.8c1.47 0 2.8.5 3.84 1.5l2.87-2.87A8.96 8.96 0 0 0 12 3a9 9 0 0 0-8.05 4.95l2.96 2.3A5.4 5.4 0 0 1 12 6.8z"/>
                          </svg>
                          <span className="text-xs font-bold">Google</span>
                        </button>
                        <button type="button"
                          className={`flex items-center justify-center gap-2 py-3 rounded-2xl border hover:scale-[1.02] transition-all duration-200 ${
                            theme === 'light' 
                              ? 'bg-white border-slate-200 text-slate-400 hover:border-slate-300' 
                              : 'bg-white/[0.04] border-white/[0.08] text-white/45 hover:bg-white/[0.08] hover:border-white/[0.15]'
                          }`}>
                          <svg className={`w-4 h-4 flex-shrink-0 ${theme === 'light' ? 'fill-slate-900' : 'fill-white'}`} viewBox="0 0 24 24">
                            <path d="M17.05 12.536c-.02-2.017 1.643-2.99 1.717-3.038-.935-1.368-2.387-1.555-2.907-1.573-1.24-.124-2.419.726-3.047.726-.628 0-1.6-.708-2.632-.69-1.354.02-2.601.785-3.296 1.995-1.404 2.43-.36 6.02 1.008 7.99.668.972 1.466 2.063 2.514 2.024 1.01-.04 1.393-.653 2.617-.653 1.222 0 1.568.653 2.638.634 1.083-.018 1.77-.989 2.43-1.964.773-1.12 1.087-2.215 1.103-2.27-.024-.011-2.115-.813-2.145-3.181zm-2.007-5.846c.549-.672.921-1.6.82-2.53-.79.032-1.757.527-2.327 1.19-.507.59-.956 1.542-.792 2.45.885.07 1.785-.453 2.299-1.11z"/>
                          </svg>
                          <span className="text-xs font-bold">Apple</span>
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Footer nav ── */}
            <div className="relative z-10 flex gap-4 mt-8">
              {step > 1 && (
                <motion.button type="button" onClick={goBack} whileTap={{ scale: 0.96 }}
                  className={`flex-shrink-0 px-6 py-4 rounded-2xl border transition-all text-sm font-bold backdrop-blur-md ${
                    theme === 'light' 
                      ? 'text-slate-400 border-slate-200 hover:text-slate-900 hover:bg-slate-100' 
                      : 'text-white/40 border-white/10 hover:text-white hover:bg-white/5 hover:border-white/20'
                  }`}>
                  {dir === 'rtl' ? `← ${t('auth_back')}` : `← ${t('auth_back')}`}
                </motion.button>
              )}

              {step < 3 ? (
                <motion.button type="button" onClick={goNext} whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }} whileTap={{ scale: 0.98 }}
                  className="flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 relative group overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, #EC4899 100%)`,
                    boxShadow: `0 12px 40px ${accentColor}44`,
                  }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  
                  <span className="relative z-10 text-white">{t('auth_next')}</span>
                  <span className="relative z-10 text-white group-hover:translate-x-1 transition-transform">{dir === 'rtl' ? '←' : '→'}</span>
                </motion.button>
              ) : (
                <motion.button type="button" onClick={handleRegister} disabled={loading} whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }} whileTap={{ scale: 0.98 }}
                  className="flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 relative group overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, #EC4899 100%)`,
                    boxShadow: `0 12px 40px ${accentColor}44`,
                    opacity: loading ? 0.75 : 1,
                  }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2 relative z-10 text-white">
                      <span>{t('auth_submit')}</span>
                      <span className="group-hover:scale-125 group-hover:rotate-12 transition-transform">🚀</span>
                    </div>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .custom-scroll::-webkit-scrollbar       { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: ${theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'}; border-radius: 20px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.14)'}; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}
