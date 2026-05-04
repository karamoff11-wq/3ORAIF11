'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import {
  APPEARANCE_DEFAULTS,
  type AppearanceSettings,
  getAppSettings,
  saveAppSettings,
} from '@/lib/appSettings'

const FONTS = ['Cairo', 'Tajawal', 'Inter'] as const

const PRESET_PALETTES = [
  { label: 'Void Purple (Default)', primary: '#7c3aed', accent: '#f59e0b', bg: '#04040f' },
  { label: 'Ocean Blue',            primary: '#2563eb', accent: '#06b6d4', bg: '#040f1a' },
  { label: 'Rose Gold',             primary: '#e11d48', accent: '#f97316', bg: '#0f0406' },
  { label: 'Emerald Night',         primary: '#059669', accent: '#8b5cf6', bg: '#02100a' },
  { label: 'Cyber Yellow',          primary: '#ca8a04', accent: '#3b82f6', bg: '#0a0900' },
]

function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="card-glass flex items-center gap-4 p-4">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-12 h-12 rounded-xl border border-white/10 cursor-pointer bg-transparent p-0.5"
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{value}</p>
      </div>
      <div className="w-8 h-8 rounded-full border border-white/10" style={{ backgroundColor: value }} />
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
      <div>
        <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${checked ? 'bg-purple-600' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function ThemeSelector({ value, onChange }: { value: 'light' | 'dark' | 'system'; onChange: (v: 'light' | 'dark' | 'system') => void }) {
  const options = [
    { value: 'light',  label: 'نهاري (Light)',  icon: '☀️' },
    { value: 'dark',   label: 'ليلي (Dark)',   icon: '🌙' },
    { value: 'system', label: 'تلقائي (System)', icon: '🖥️' },
  ] as const

  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
            value === opt.value
              ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
          }`}
        >
          <span className="text-xl">{opt.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-wider">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function AdminAppearancePage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<AppearanceSettings>(APPEARANCE_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAppSettings('appearance', APPEARANCE_DEFAULTS, supabase).then(s => {
      setSettings(s)
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  async function save() {
    setSaving(true)
    const { error } = await saveAppSettings('appearance', settings, supabase)
    if (error) toast.error('خطأ في الحفظ: ' + error.message)
    else toast.success('تم حفظ إعدادات المظهر ✓ — ستُطبق عند إعادة تحميل الصفحة')
    setSaving(false)
  }

  function applyPreset(p: typeof PRESET_PALETTES[0]) {
    setSettings(s => ({ ...s, primary_color: p.primary, accent_color: p.accent, bg_color: p.bg }))
  }

  if (loading) return (
    <div className="p-8 space-y-4">
      {Array(5).fill(0).map((_, i) => <div key={i} className="h-16 card-glass animate-shimmer rounded-2xl" />)}
    </div>
  )

  return (
    <div className="p-8 max-w-3xl space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black gradient-text-primary">المظهر والألوان</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          تحكم في ألوان المنصة، الخطوط، والتأثيرات البصرية. التغييرات تُطبق عند إعادة تحميل أي صفحة.
        </p>
      </div>

      {/* Palette Presets */}
      <section className="space-y-4">
        <h2 className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>
          ألوان جاهزة (Presets)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_PALETTES.map(p => {
            const active = p.primary === settings.primary_color && p.accent === settings.accent_color
            return (
              <motion.button
                key={p.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => applyPreset(p)}
                className="card-glass p-4 text-right transition-all"
                style={{
                  border: active ? `2px solid ${p.primary}` : '2px solid transparent',
                  boxShadow: active ? `0 0 20px ${p.primary}33` : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ background: p.bg, border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: p.primary }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: p.accent }} />
                  {active && <span className="mr-auto text-xs font-bold" style={{ color: p.primary }}>✓ نشط</span>}
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>{p.label}</p>
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* Custom Colors */}
      <section className="space-y-3">
        <h2 className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>الألوان المخصصة</h2>
        <ColorSwatch label="اللون الرئيسي (Primary)"  value={settings.primary_color} onChange={v => set('primary_color', v)} />
        <ColorSwatch label="اللون الثانوي (Accent)"   value={settings.accent_color}  onChange={v => set('accent_color', v)} />
        <ColorSwatch label="لون الخلفية (Background)" value={settings.bg_color}       onChange={v => set('bg_color', v)} />
      </section>

      {/* Live Color Preview */}
      <section>
        <h2 className="text-lg font-black mb-3" style={{ color: 'var(--color-text-primary)' }}>معاينة الألوان</h2>
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)', backgroundColor: settings.bg_color }}>
          <div className="p-6 space-y-4">
            <div className="h-10 rounded-xl w-2/3" style={{ background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.accent_color})` }} />
            <div className="flex gap-3">
              <div className="h-8 rounded-lg flex-1" style={{ background: `${settings.primary_color}22`, border: `1px solid ${settings.primary_color}44` }} />
              <div className="h-8 w-24 rounded-lg" style={{ background: settings.primary_color }} />
            </div>
            <div className="h-2 rounded-full w-full" style={{ background: `${settings.accent_color}33` }}>
              <div className="h-2 rounded-full w-1/2" style={{ background: settings.accent_color }} />
            </div>
            <p className="text-xs font-mono" style={{ color: settings.primary_color }}>Primary: {settings.primary_color} · Accent: {settings.accent_color}</p>
          </div>
        </div>
      </section>

      {/* Theme Mode */}
      <section className="space-y-3">
        <h2 className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>نمط المظهر (Theme)</h2>
        <ThemeSelector value={settings.theme_mode} onChange={v => set('theme_mode', v)} />
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-30 mt-1">
          * الوضع التلقائي يتبع إعدادات جهاز المستخدم
        </p>
      </section>

      {/* Font */}
      <section className="space-y-3">
        <h2 className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>الخط (Font)</h2>
        <div className="card-glass p-4 flex items-center gap-4">
          <span className="text-2xl">🔤</span>
          <div className="flex-1">
            <label className="label mb-1">خط الجسم الرئيسي</label>
            <select
              className="input"
              value={settings.font_body}
              onChange={e => set('font_body', e.target.value as any)}
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <p className="text-lg font-bold shrink-0" style={{ fontFamily: settings.font_body, color: 'var(--color-text-secondary)' }}>
            أبجد هوز
          </p>
        </div>
      </section>

      {/* Visual Effects */}
      <section>
        <h2 className="text-lg font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>التأثيرات البصرية</h2>
        <div className="card-glass px-4">
          <Toggle
            label="جسيمات الخلفية (Particles)"
            desc="تأثير الجزيئات المتطايرة في خلفية الصفحة"
            checked={settings.particles_enabled}
            onChange={v => set('particles_enabled', v)}
          />
          <Toggle
            label="شبكة الخلفية (Grid)"
            desc="خطوط الشبكة الخفيفة في الخلفية"
            checked={settings.grid_enabled}
            onChange={v => set('grid_enabled', v)}
          />
          <Toggle
            label="طبقة الضوضاء (Noise Overlay)"
            desc="طبقة حبيبية خفية تضيف عمقاً بصرياً"
            checked={settings.noise_enabled}
            onChange={v => set('noise_enabled', v)}
          />
        </div>
      </section>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="btn btn-primary btn-lg w-full"
      >
        {saving ? '⏳ جاري الحفظ...' : '💾 حفظ إعدادات المظهر'}
      </button>
    </div>
  )
}
