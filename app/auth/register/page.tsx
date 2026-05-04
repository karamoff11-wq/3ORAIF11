'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'react-hot-toast'
import { useFeedbackStore } from '@/store/feedbackStore'

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
  { code: '+970', name: 'فلسطين',   iso: 'ps', flag: '🇵🇸' },
  { code: '+966', name: 'السعودية', iso: 'sa', flag: '🇸🇦' },
  { code: '+971', name: 'الإمارات', iso: 'ae', flag: '🇦🇪' },
  { code: '+965', name: 'الكويت',   iso: 'kw', flag: '🇰🇼' },
  { code: '+974', name: 'قطر',      iso: 'qa', flag: '🇶🇦' },
  { code: '+973', name: 'البحرين',  iso: 'bh', flag: '🇧🇭' },
  { code: '+968', name: 'عمان',     iso: 'om', flag: '🇴🇲' },
  { code: '+962', name: 'الأردن',   iso: 'jo', flag: '🇯🇴' },
  { code: '+961', name: 'لبنان',    iso: 'lb', flag: '🇱🇧' },
  { code: '+964', name: 'العراق',   iso: 'iq', flag: '🇮🇶' },
  { code: '+20',  name: 'مصر',      iso: 'eg', flag: '🇪🇬' },
]

const MONTHS      = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const DAYS_HEADER = ['ح','ن','ث','ر','خ','ج','س']

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
const AuroraBackground = ({ accentColor }: { accentColor: string }) => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
    {/* SVG noise */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.035]" style={{ mixBlendMode: 'overlay' }}>
      <filter id="noise-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-filter)" />
    </svg>

    {/* Vignette */}
    <div className="absolute inset-0"
      style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />

    {/* Orb 1 — accent top-left */}
    <motion.div
      animate={{ scale: [1, 1.25, 1], rotate: [0, 25, 0], opacity: [0.14, 0.2, 0.14] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute top-[-25%] left-[-10%] w-[75vw] h-[75vw] rounded-full blur-[160px]"
      style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
    />
    {/* Orb 2 — pink bottom-right */}
    <motion.div
      animate={{ scale: [1.2, 1, 1.2], rotate: [0, -18, 0], opacity: [0.08, 0.15, 0.08] }}
      transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute bottom-[-25%] right-[-10%] w-[65vw] h-[65vw] rounded-full blur-[160px]"
      style={{ background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)' }}
    />
    {/* Orb 3 — center drift */}
    <motion.div
      animate={{ y: [-40, 40, -40], x: [-20, 20, -20], opacity: [0.05, 0.1, 0.05] }}
      transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute top-[25%] left-[25%] w-[55vw] h-[55vw] rounded-full blur-[140px]"
      style={{ background: `radial-gradient(circle, ${accentColor}66 0%, transparent 70%)` }}
    />
  </div>
)

// Step progress bar
const StepProgress = ({ current, accentColor }: { current: Step; accentColor: string }) => (
  <div className="flex items-center gap-2">
    {([1, 2, 3] as Step[]).map(s => (
      <React.Fragment key={s}>
        <motion.div
          animate={{
            width:   s === current ? 28 : 8,
            opacity: s <= current  ? 1   : 0.2,
          }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="h-1.5 rounded-full flex-shrink-0"
          style={{ background: s <= current ? accentColor : 'rgba(255,255,255,0.15)' }}
        />
        {s < 3 && (
          <div className="flex-1 h-px"
            style={{ background: s < current ? `${accentColor}55` : 'rgba(255,255,255,0.05)' }} />
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
}

const Field = ({
  label, value, onChange, type = 'text', placeholder, error,
  badge, rightSlot, hint, autoComplete, borderColor,
}: InputProps) => (
  <div className="group">
    <div className="flex items-center justify-between mb-1.5 px-0.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-white/20 group-focus-within:text-white/40 transition-colors duration-200">
        {label}
      </label>
      <AnimatePresence mode="wait">
        {badge && (
          <motion.div key="badge" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.2 }}>
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
        className="w-full bg-white/[0.04] rounded-2xl px-4 py-3.5 text-white text-sm font-semibold outline-none transition-all duration-300 placeholder:text-white/20 focus:bg-white/[0.07] focus:scale-[1.005] border"
        style={{
          direction:   'ltr',
          borderColor: borderColor ?? (error ? 'rgba(236,72,153,0.45)' : 'rgba(255,255,255,0.08)'),
          boxShadow:   error ? '0 0 18px rgba(236,72,153,0.06)' : undefined,
        }}
      />
      {rightSlot && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">{rightSlot}</div>
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

// Icon toggle button (password eye)
const EyeBtn = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
  <button type="button" onClick={onToggle}
    className="text-white/25 hover:text-white/60 transition-colors text-sm leading-none">
    {show ? '🙈' : '👁️'}
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
  const { accentColor, logoUrl } = useFeedbackStore()

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
  const [unStatus, setUnStatus] = useState<UsernameStatus>('idle')
  const unTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const checkUsername = useCallback(async (val: string) => {
    if (val.length < 3) { setUnStatus('idle'); return }
    setUnStatus('checking')
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', val)
      .maybeSingle()
    setUnStatus(data ? 'taken' : 'available')
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
      if (!username || username.length < 3)  e.username       = 'اسم المستخدم قصير جداً (3 أحرف+)'
      if (unStatus === 'taken')              e.username       = 'هذا الاسم مأخوذ بالفعل'
      if (!email || !email.includes('@'))    e.email          = 'بريد إلكتروني غير صالح'
      if (!password || password.length < 8) e.password       = 'على الأقل 8 أحرف'
      if (password !== confirm)             e.confirmPassword = 'كلمات المرور غير متطابقة'
    }
    if (s === 2) {
      if (!gender)    e.gender    = 'يرجى اختيار الجنس'
      if (!birthdate) e.birthdate = 'يرجى اختيار تاريخ الميلاد'
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
    c => c.name.includes(countryQ) || c.code.includes(countryQ)
  )

  const unBorderColor =
    errors.username      ? 'rgba(236,72,153,0.45)'  :
    unStatus === 'taken' ? 'rgba(236,72,153,0.45)'  :
    unStatus === 'available' ? 'rgba(34,197,94,0.45)' :
    'rgba(255,255,255,0.08)'

  const selectedDay = birthdate ? parseInt(birthdate.split('-')[2]) : null

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div
      className="h-screen w-full bg-[#04040f] text-white flex flex-col relative overflow-hidden"
      style={{ direction: 'rtl', fontFamily: "'Cairo', sans-serif" }}
    >
      <AuroraBackground accentColor={accentColor} />

      {/* ── Nav ── */}
      <nav className="relative z-50 flex-shrink-0 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-base font-black tracking-tight">العُريف</span>
        </div>
        <Link
          href="/auth/login"
          className="px-5 py-2 rounded-xl text-xs font-bold text-white/35 border border-white/10 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all duration-200"
        >
          تسجيل دخول
        </Link>
      </nav>

      {/* ── Centered card ── */}
      <div className="relative z-40 flex-1 flex items-center justify-center px-4 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[460px] relative"
        >
          {/* Glass card */}
          <div className="bg-white/[0.025] backdrop-blur-[40px] border border-white/[0.09] rounded-[28px] p-7 shadow-[0_0_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden">
            
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />

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
                  <h1 className="text-xl font-black tracking-tight">{STEP_META[step - 1].label}</h1>
                  <p className="text-white/25 text-xs font-medium mt-0.5">{STEP_META[step - 1].sub}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Progress ── */}
            <div className="mb-6 relative z-10">
              <StepProgress current={step} accentColor={accentColor} />
              <p className="text-[10px] text-white/20 text-center mt-1.5 font-bold">
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
                      <Field
                        label="اسم المستخدم"
                        value={username}
                        onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: '' })) }}
                        placeholder="username_99"
                        autoComplete="username"
                        borderColor={unBorderColor}
                        badge={
                          errors.username ? <ErrBadge msg={errors.username} /> :
                          unStatus === 'available' ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">✓ متاح</span>
                          ) : unStatus === 'taken' ? (
                            <span className="text-[9px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">✗ مأخوذ</span>
                          ) : unStatus === 'checking' ? (
                            <span className="text-[9px] text-white/25 font-bold">جاري التحقق…</span>
                          ) : undefined
                        }
                      />

                      {/* Email */}
                      <Field
                        label="البريد الإلكتروني"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                        placeholder="name@example.com"
                        autoComplete="email"
                        error={errors.email}
                        badge={errors.email ? <ErrBadge msg={errors.email} /> : undefined}
                      />

                      {/* Password */}
                      <div className="group">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/20 group-focus-within:text-white/40 transition-colors duration-200">
                            كلمة المرور
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
                            className="w-full bg-white/[0.04] border rounded-2xl px-4 py-3.5 text-white text-sm font-semibold outline-none transition-all duration-300 placeholder:text-white/20 focus:bg-white/[0.07] focus:scale-[1.005]"
                            style={{ direction: 'ltr', borderColor: errors.password ? 'rgba(236,72,153,0.45)' : 'rgba(255,255,255,0.08)' }}
                          />
                          <button type="button" onClick={() => setShowPw(v => !v)}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors text-sm">
                            {showPw ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {/* Strength bar */}
                        <AnimatePresence>
                          {password && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="mt-2 px-0.5 overflow-hidden">
                              <div className="flex gap-1.5">
                                {([1, 2, 3] as const).map(i => (
                                  <motion.div key={i} className="h-1 flex-1 rounded-full"
                                    animate={{ backgroundColor: i <= pwStrength.score ? pwStrength.color : 'rgba(255,255,255,0.08)' }}
                                    transition={{ duration: 0.35 }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Confirm */}
                      <Field
                        label="تأكيد كلمة المرور"
                        value={confirm}
                        onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirmPassword: '' })) }}
                        type={showCf ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        error={errors.confirmPassword}
                        badge={errors.confirmPassword ? <ErrBadge msg={errors.confirmPassword} /> : undefined}
                        rightSlot={<EyeBtn show={showCf} onToggle={() => setShowCf(v => !v)} />}
                      />
                    </div>
                  )}

                  {/* ══════════════════════════
                      STEP 2 — Personal info
                  ══════════════════════════ */}
                  {step === 2 && (
                    <div className="space-y-4">

                      {/* Gender */}
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-0.5 mb-2 block">
                          الجنس
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {(['male', 'female'] as Gender[]).map(g => (
                            <motion.button key={g} type="button" whileTap={{ scale: 0.96 }}
                              onClick={() => { setGender(g); setErrors(p => ({ ...p, gender: '' })) }}
                              className="py-4 rounded-2xl text-sm font-bold transition-all duration-200 border relative overflow-hidden"
                              style={{
                                borderColor: gender === g ? accentColor             : (errors.gender ? 'rgba(236,72,153,0.35)' : 'rgba(255,255,255,0.08)'),
                                background:  gender === g ? `${accentColor}20`      : 'rgba(255,255,255,0.03)',
                                color:       gender === g ? '#ffffff'               : 'rgba(255,255,255,0.3)',
                                boxShadow:   gender === g ? `0 0 20px ${accentColor}22` : undefined,
                              }}>
                              <span className="text-base ml-1.5">{g === 'male' ? '👦' : '👩'}</span>
                              {g === 'male' ? 'ذكر' : 'أنثى'}
                            </motion.button>
                          ))}
                        </div>
                        {errors.gender && (
                          <p className="text-[10px] text-pink-400 mt-1.5 px-0.5 font-bold">{errors.gender}</p>
                        )}
                      </div>

                      {/* Birthdate */}
                      <div className="relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-0.5 mb-2 block">
                          تاريخ الميلاد
                        </label>
                        <button type="button" onClick={() => setIsCalOpen(v => !v)}
                          className="w-full bg-white/[0.04] border rounded-2xl py-3.5 px-4 text-sm font-bold text-right hover:bg-white/[0.07] transition-all flex items-center justify-between"
                          style={{ direction: 'rtl', borderColor: errors.birthdate ? 'rgba(236,72,153,0.45)' : 'rgba(255,255,255,0.08)' }}>
                          <span className={birthdate ? 'text-white' : 'text-white/30'}>
                            {birthdate ? formatBirthdate(birthdate) : 'اختر تاريخ ميلادك'}
                          </span>
                          <span className="text-white/20 text-base">📅</span>
                        </button>

                        <AnimatePresence>
                          {isCalOpen && (
                            <>
                              <div className="fixed inset-0 z-[100]" onClick={() => setIsCalOpen(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-[#08081a] border border-white/10 rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-[101] backdrop-blur-2xl"
                              >
                                {/* Month nav */}
                                <div className="flex items-center justify-between mb-4">
                                  <button type="button"
                                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                                    →
                                  </button>
                                  <span className="font-black text-sm">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                                  <button type="button"
                                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                                    disabled={viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear()}
                                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                                    ←
                                  </button>
                                </div>
                                {/* Day headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                  {DAYS_HEADER.map(d => (
                                    <div key={d} className="text-[10px] font-black text-white/15 text-center">{d}</div>
                                  ))}
                                </div>
                                {/* Days */}
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
                                        className={`h-8 rounded-xl text-xs font-bold transition-all ${
                                          !d      ? 'opacity-0 pointer-events-none' :
                                          isFuture ? 'opacity-15 cursor-not-allowed text-white/30' :
                                          isSel   ? 'text-white shadow-md' :
                                          'hover:bg-white/5 text-white/45 hover:text-white'
                                        }`}
                                        style={{ background: isSel ? accentColor : undefined }}
                                      >
                                        {d}
                                      </button>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Phone (optional) */}
                      <div className="relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-0.5 mb-2 block">
                          رقم الهاتف <span className="normal-case font-medium opacity-60">(اختياري)</span>
                        </label>
                        <div className="flex gap-2">
                          {/* Country selector trigger */}
                          <button type="button" onClick={() => setIsCountryOpen(v => !v)}
                            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3.5 px-3.5 flex items-center gap-2 hover:bg-white/[0.07] transition-all flex-shrink-0">
                            <span className="text-lg leading-none">{country.flag}</span>
                            <span className="text-xs font-bold text-white/70" style={{ direction: 'ltr' }}>{country.code}</span>
                            <span className="text-white/20 text-[9px]">▼</span>
                          </button>
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                            placeholder="59 123 4567"
                            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-sm font-semibold text-white outline-none focus:bg-white/[0.07] focus:border-white/20 transition-all placeholder:text-white/20"
                            style={{ direction: 'ltr' }}
                          />
                        </div>

                        <AnimatePresence>
                          {isCountryOpen && (
                            <>
                              <div className="fixed inset-0 z-[100]" onClick={() => setIsCountryOpen(false)} />
                              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-[#08081a] border border-white/10 rounded-3xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-[101] backdrop-blur-2xl max-h-56 overflow-hidden flex flex-col">
                                <input type="text" placeholder="ابحث عن الدولة…" value={countryQ} onChange={e => setCountryQ(e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 mb-3 text-sm text-white outline-none focus:border-white/20 placeholder:text-white/25" />
                                <div className="overflow-y-auto space-y-0.5 pr-1 custom-scroll">
                                  {filteredCountries.map(c => (
                                    <button key={c.iso} type="button"
                                      onClick={() => { setCountry(c); setIsCountryOpen(false); setCountryQ('') }}
                                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xl leading-none">{c.flag}</span>
                                        <span className="text-sm font-bold text-white/55 group-hover:text-white/80 transition-colors">{c.name}</span>
                                      </div>
                                      <span className="text-xs font-mono font-black text-purple-400" style={{ direction: 'ltr' }}>{c.code}</span>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            </>
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
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-2.5">
                        {[
                          { icon: '👤', label: 'اسم المستخدم',    value: `@${username}` },
                          { icon: '📧', label: 'البريد الإلكتروني', value: email },
                          { icon: '🔒', label: 'كلمة المرور',       value: '••••••••' },
                          { icon: '🪪', label: 'الجنس',             value: gender === 'male' ? 'ذكر' : 'أنثى' },
                          { icon: '🎂', label: 'تاريخ الميلاد',    value: formatBirthdate(birthdate) || '—' },
                          { icon: '📱', label: 'الهاتف',            value: phone ? `${country.flag} ${country.code} ${phone}` : 'غير محدد' },
                        ].map(({ icon, label, value }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-white/30 text-xs font-bold flex items-center gap-1.5">
                              <span className="text-sm leading-none">{icon}</span>{label}
                            </span>
                            <span className="text-white/80 text-xs font-black" style={{ direction: 'ltr' }}>{value}</span>
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
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${agreed ? '' : 'bg-white/5 border border-white/10 group-hover:border-white/25'}`}
                          style={agreed ? { background: accentColor, boxShadow: `0 0 14px ${accentColor}55` } : {}}>
                          {agreed && <span className="text-white text-[10px] font-black">✓</span>}
                        </div>
                        <p className="text-xs text-white/25 leading-relaxed group-hover:text-white/40 transition-colors">
                          أوافق على{' '}
                          <span className="font-black" style={{ color: `${accentColor}bb` }}>شروط الاستخدام</span>
                          {' '}و{' '}
                          <span className="font-black" style={{ color: `${accentColor}bb` }}>سياسة الخصوصية</span>
                        </p>
                      </motion.div>

                      {/* Social divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/[0.05]" />
                        <span className="text-[10px] text-white/20 font-bold whitespace-nowrap">أو تابع باستخدام</span>
                        <div className="flex-1 h-px bg-white/[0.05]" />
                      </div>

                      {/* Social buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Google */}
                        <button type="button"
                          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] hover:scale-[1.02] transition-all duration-200">
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 19.07 12c0 .68-.09 1.34-.24 1.97H12v-3.73h7.84A9 9 0 0 0 5.27 9.76z"/>
                            <path fill="#34A853" d="M12 21a8.97 8.97 0 0 0 6.18-2.46l-3.02-2.34A5.37 5.37 0 0 1 12 17.2a5.4 5.4 0 0 1-5.1-3.63H3.77A9 9 0 0 0 12 21z"/>
                            <path fill="#FBBC05" d="M6.9 13.57A5.46 5.46 0 0 1 6.6 12c0-.55.09-1.08.3-1.57V7.86H3.77A9 9 0 0 0 3 12c0 1.44.34 2.8.95 4l2.95-2.43z"/>
                            <path fill="#4285F4" d="M12 6.8c1.47 0 2.8.5 3.84 1.5l2.87-2.87A8.96 8.96 0 0 0 12 3a9 9 0 0 0-8.05 4.95l2.96 2.3A5.4 5.4 0 0 1 12 6.8z"/>
                          </svg>
                          <span className="text-xs font-bold text-white/45">Google</span>
                        </button>
                        {/* Apple */}
                        <button type="button"
                          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] hover:scale-[1.02] transition-all duration-200">
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                            <path d="M17.05 12.536c-.02-2.017 1.643-2.99 1.717-3.038-.935-1.368-2.387-1.555-2.907-1.573-1.24-.124-2.419.726-3.047.726-.628 0-1.6-.708-2.632-.69-1.354.02-2.601.785-3.296 1.995-1.404 2.43-.36 6.02 1.008 7.99.668.972 1.466 2.063 2.514 2.024 1.01-.04 1.393-.653 2.617-.653 1.222 0 1.568.653 2.638.634 1.083-.018 1.77-.989 2.43-1.964.773-1.12 1.087-2.215 1.103-2.27-.024-.011-2.115-.813-2.145-3.181zm-2.007-5.846c.549-.672.921-1.6.82-2.53-.79.032-1.757.527-2.327 1.19-.507.59-.956 1.542-.792 2.45.885.07 1.785-.453 2.299-1.11z"/>
                          </svg>
                          <span className="text-xs font-bold text-white/45">Apple</span>
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Footer nav ── */}
            <div className="relative z-10 flex gap-3 mt-6">
              {step > 1 && (
                <motion.button type="button" onClick={goBack} whileTap={{ scale: 0.96 }}
                  className="flex-shrink-0 px-5 py-3.5 rounded-2xl border border-white/[0.08] text-white/35 hover:text-white/70 hover:bg-white/[0.05] hover:border-white/15 transition-all text-sm font-bold">
                  ← رجوع
                </motion.button>
              )}

              {step < 3 ? (
                <motion.button type="button" onClick={goNext} whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, #EC4899 100%)`,
                    boxShadow: `0 8px 30px ${accentColor}33`,
                  }}>
                  <span>التالي</span>
                  <span>←</span>
                </motion.button>
              ) : (
                <motion.button type="button" onClick={handleRegister} disabled={loading} whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, #EC4899 100%)`,
                    boxShadow: `0 8px 30px ${accentColor}33`,
                    opacity: loading ? 0.75 : 1,
                  }}>
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>ابدأ رحلتك نحو المجد</span>
                      <span>🚀</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        .custom-scroll::-webkit-scrollbar       { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 20px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}