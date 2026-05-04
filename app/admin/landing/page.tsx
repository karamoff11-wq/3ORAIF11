'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import {
  LANDING_DEFAULTS,
  type LandingSettings,
  getAppSettings,
  saveAppSettings,
} from '@/lib/appSettings'

type Tab = 'content' | 'sections' | 'social'

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 card-glass">
      <div>
        <p className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${checked ? 'bg-purple-600' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function BilingualInput({ labelAr, labelEn, valueAr, valueEn, onChangeAr, onChangeEn, multiline = false }: {
  labelAr: string; labelEn: string
  valueAr: string; valueEn: string
  onChangeAr: (v: string) => void; onChangeEn: (v: string) => void
  multiline?: boolean
}) {
  return (
    <div className="card-glass p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label flex items-center gap-2"><span>🇸🇦</span><span>{labelAr}</span></label>
          {multiline
            ? <textarea className="input w-full min-h-[72px] text-right" dir="rtl" value={valueAr} onChange={e => onChangeAr(e.target.value)} />
            : <input className="input w-full text-right" dir="rtl" value={valueAr} onChange={e => onChangeAr(e.target.value)} />
          }
        </div>
        <div>
          <label className="label flex items-center gap-2"><span>🇬🇧</span><span>{labelEn}</span></label>
          {multiline
            ? <textarea className="input w-full min-h-[72px]" dir="ltr" value={valueEn} onChange={e => onChangeEn(e.target.value)} />
            : <input className="input w-full" dir="ltr" value={valueEn} onChange={e => onChangeEn(e.target.value)} />
          }
        </div>
      </div>
    </div>
  )
}

export default function AdminLandingPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<LandingSettings>(LANDING_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>('content')

  useEffect(() => {
    getAppSettings('landing', LANDING_DEFAULTS, supabase).then(s => {
      setSettings(s)
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof LandingSettings>(key: K, value: LandingSettings[K]) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  async function save() {
    setSaving(true)
    const { error } = await saveAppSettings('landing', settings, supabase)
    if (error) toast.error('خطأ: ' + error.message)
    else toast.success('تم الحفظ ✓ — ستُطبق التغييرات عند إعادة تحميل الصفحة الرئيسية')
    setSaving(false)
  }

  if (loading) return (
    <div className="p-8 space-y-4">
      {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 card-glass animate-shimmer rounded-2xl" />)}
    </div>
  )

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'content',  label: 'المحتوى',          icon: '✏️' },
    { id: 'sections', label: 'الأقسام',           icon: '🧩' },
    { id: 'social',   label: 'التواصل الاجتماعي', icon: '🔗' },
  ]

  return (
    <div className="p-8 max-w-3xl space-y-8">

      <div>
        <h1 className="text-3xl font-black gradient-text-primary">إعدادات الصفحة الرئيسية</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>تحكم في نصوص وأقسام الصفحة الرئيسية (Landing Page).</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'transparent',
              color: tab === t.id ? '#c4b5fd' : 'var(--color-text-secondary)',
              border: tab === t.id ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
            }}
          >
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {tab === 'content' && (
        <div className="space-y-5">
          <h2 className="text-base font-black" style={{ color: 'var(--color-text-secondary)' }}>قسم الهيرو (Hero Section)</h2>
          <BilingualInput
            labelAr="العنوان الرئيسي" labelEn="Main Title"
            valueAr={settings.hero_title_ar} valueEn={settings.hero_title_en}
            onChangeAr={v => set('hero_title_ar', v)} onChangeEn={v => set('hero_title_en', v)}
          />
          <BilingualInput
            labelAr="العنوان الفرعي" labelEn="Subtitle"
            valueAr={settings.hero_subtitle_ar} valueEn={settings.hero_subtitle_en}
            onChangeAr={v => set('hero_subtitle_ar', v)} onChangeEn={v => set('hero_subtitle_en', v)}
            multiline
          />
          <BilingualInput
            labelAr="نص زر البدء" labelEn="CTA Button Text"
            valueAr={settings.cta_label_ar} valueEn={settings.cta_label_en}
            onChangeAr={v => set('cta_label_ar', v)} onChangeEn={v => set('cta_label_en', v)}
          />

          {/* Mini preview */}
          <div className="rounded-2xl p-6 text-center space-y-3" style={{ background: 'rgba(124,58,237,0.05)', border: '1px dashed rgba(124,58,237,0.2)' }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--color-text-muted)' }}>معاينة مبسطة</p>
            <h3 className="text-3xl font-black gradient-text-primary">{settings.hero_title_ar}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{settings.hero_subtitle_ar}</p>
            <button className="btn btn-primary">{settings.cta_label_ar}</button>
          </div>
        </div>
      )}

      {/* Sections Tab */}
      {tab === 'sections' && (
        <div className="space-y-3">
          <h2 className="text-base font-black mb-2" style={{ color: 'var(--color-text-secondary)' }}>أقسام الصفحة الرئيسية</h2>
          <Toggle
            label="عرض بطاقة الاختبار التجريبي"
            desc="البطاقة التفاعلية التي تعرض سؤالاً تجريبياً"
            checked={settings.show_quiz_demo}
            onChange={v => set('show_quiz_demo', v)}
          />
          <Toggle
            label="عرض الكرات المدارية (Feature Orbs)"
            desc="الكرات الأربع الدوارة: المعرفة، التحدي، الإنجاز، اللعب"
            checked={settings.show_orbs}
            onChange={v => set('show_orbs', v)}
          />
        </div>
      )}

      {/* Social Tab */}
      {tab === 'social' && (
        <div className="space-y-4">
          <h2 className="text-base font-black" style={{ color: 'var(--color-text-secondary)' }}>روابط التواصل الاجتماعي</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>ضع الرابط الكامل، أو اتركه # للإخفاء من الصفحة.</p>
          {([
            { key: 'social_facebook'  as const, icon: '🔵', label: 'Facebook' },
            { key: 'social_youtube'   as const, icon: '🔴', label: 'YouTube' },
            { key: 'social_instagram' as const, icon: '📸', label: 'Instagram' },
            { key: 'social_twitter'   as const, icon: '🐦', label: 'Twitter / X' },
          ]).map(({ key, icon, label }) => (
            <div key={key} className="card-glass flex items-center gap-4 p-4">
              <span className="text-2xl">{icon}</span>
              <div className="flex-1">
                <label className="label mb-1">{label}</label>
                <input
                  className="input w-full" dir="ltr"
                  placeholder={`https://${label.toLowerCase().replace(' / x', '')}.com/...`}
                  value={settings[key]}
                  onChange={e => set(key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={save} disabled={saving} className="btn btn-primary btn-lg w-full">
        {saving ? '⏳ جاري الحفظ...' : '💾 حفظ إعدادات الصفحة الرئيسية'}
      </button>
    </div>
  )
}
