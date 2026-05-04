'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import {
  GAME_DEFAULTS,
  type GameSettings,
  getAppSettings,
  saveAppSettings,
} from '@/lib/appSettings'

type Tab = 'setup' | 'gameplay' | 'labels'

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
      <div>
        <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
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

function NumberField({ label, desc, value, min, max, unit, onChange }: {
  label: string; desc?: string; value: number; min: number; max?: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div className="card-glass flex items-center gap-4 p-4">
      <div className="flex-1">
        <label className="label mb-1">{label}</label>
        {desc && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>}
        <input
          type="number" min={min} max={max}
          className="input mt-2"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
      </div>
      <div className="text-2xl font-black shrink-0" style={{ color: 'var(--color-primary-light)' }}>
        {value}{unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
    </div>
  )
}

function BilingualLabel({ labelAr, labelEn, valueAr, valueEn, onChangeAr, onChangeEn }: {
  labelAr: string; labelEn: string
  valueAr: string; valueEn: string
  onChangeAr: (v: string) => void; onChangeEn: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label mb-1 text-xs flex gap-1 items-center"><span>🇸🇦</span>{labelAr}</label>
        <input className="input w-full text-sm text-right" dir="rtl" value={valueAr} onChange={e => onChangeAr(e.target.value)} />
      </div>
      <div>
        <label className="label mb-1 text-xs flex gap-1 items-center"><span>🇬🇧</span>{labelEn}</label>
        <input className="input w-full text-sm" dir="ltr" value={valueEn} onChange={e => onChangeEn(e.target.value)} />
      </div>
    </div>
  )
}

export default function AdminGameUIPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<GameSettings>(GAME_DEFAULTS)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [tab, setTab]           = useState<Tab>('setup')

  useEffect(() => {
    getAppSettings('game', GAME_DEFAULTS, supabase).then(s => {
      setSettings(s)
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  async function save() {
    setSaving(true)
    const { error } = await saveAppSettings('game', settings, supabase)
    if (error) toast.error('خطأ: ' + error.message)
    else toast.success('تم حفظ إعدادات اللعبة ✓ — ستُطبق عند إعادة تحميل الصفحة')
    setSaving(false)
  }

  if (loading) return (
    <div className="p-8 space-y-4">
      {Array(5).fill(0).map((_, i) => <div key={i} className="h-16 card-glass animate-shimmer rounded-2xl" />)}
    </div>
  )

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'setup',    label: 'صفحة الإعداد', icon: '⚙️' },
    { id: 'gameplay', label: 'أثناء اللعب',  icon: '🎮' },
    { id: 'labels',   label: 'النصوص',       icon: '🌐' },
  ]

  return (
    <div className="p-8 max-w-3xl space-y-8">

      <div>
        <h1 className="text-3xl font-black gradient-text-primary">إعدادات واجهة اللعبة</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          تحكم في صفحة الإعداد، أثناء اللعب، والنصوص الظاهرة للاعبين.
        </p>
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

      {/* Setup Tab */}
      {tab === 'setup' && (
        <div className="space-y-4">
          <h2 className="text-base font-black" style={{ color: 'var(--color-text-secondary)' }}>إعدادات صفحة الإعداد (Game Setup)</h2>

          <NumberField
            label="الحد الأقصى للفئات المختارة"
            desc="أقصى عدد فئات يمكن للمنظم اختيارها قبل بدء اللعبة"
            value={settings.max_categories}
            min={1} max={50} unit="فئة"
            onChange={v => set('max_categories', v)}
          />

          <NumberField
            label="تأخير كشف الإجابة (مللي ثانية)"
            desc="المدة بين الضغط على إجابة وظهور نتيجتها على الشاشة"
            value={settings.answer_reveal_delay}
            min={300} max={5000} unit="ms"
            onChange={v => set('answer_reveal_delay', v)}
          />
        </div>
      )}

      {/* Gameplay Tab */}
      {tab === 'gameplay' && (
        <div className="space-y-1">
          <h2 className="text-base font-black mb-3" style={{ color: 'var(--color-text-secondary)' }}>تأثيرات أثناء اللعب</h2>
          <div className="card-glass px-4">
            <Toggle
              label="الألعاب النارية (Fireworks)"
              desc="تأثير الألعاب النارية عند الإجابة الصحيحة"
              checked={settings.fireworks_enabled}
              onChange={v => set('fireworks_enabled', v)}
            />
            <Toggle
              label="جسيمات القتال (Fighting Particles)"
              desc="تأثير الجزيئات التفاعلية بين الفرق أثناء اللعب"
              checked={settings.particles_enabled}
              onChange={v => set('particles_enabled', v)}
            />
            <Toggle
              label="عرض العداد التنازلي (Timer)"
              desc="عرض مؤقت الإجابة في نافذة السؤال"
              checked={settings.timer_visible}
              onChange={v => set('timer_visible', v)}
            />
            <Toggle
              label="عرض لوحة النتائج (Scoreboard)"
              desc="عرض نقاط الفرق أثناء اللعب"
              checked={settings.scoreboard_visible}
              onChange={v => set('scoreboard_visible', v)}
            />
          </div>
        </div>
      )}

      {/* Labels Tab */}
      {tab === 'labels' && (
        <div className="space-y-5">
          <h2 className="text-base font-black" style={{ color: 'var(--color-text-secondary)' }}>نصوص أزرار اللعبة (AR / EN)</h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            هذه النصوص تظهر للاعبين ومنظمي الجلسة. تأكد من تعديل كلا اللغتين.
          </p>

          <div className="card-glass p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>إجراءات اللعبة</p>
            <BilingualLabel
              labelAr="زر بدء اللعبة" labelEn="Start Game Button"
              valueAr={settings.start_label_ar} valueEn={settings.start_label_en}
              onChangeAr={v => set('start_label_ar', v)} onChangeEn={v => set('start_label_en', v)}
            />
            <BilingualLabel
              labelAr="زر التالي" labelEn="Next Button"
              valueAr={settings.next_label_ar} valueEn={settings.next_label_en}
              onChangeAr={v => set('next_label_ar', v)} onChangeEn={v => set('next_label_en', v)}
            />
          </div>

          <div className="card-glass p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>ردود الأفعال</p>
            <BilingualLabel
              labelAr="رسالة الإجابة الصحيحة" labelEn="Correct Answer Message"
              valueAr={settings.correct_label_ar} valueEn={settings.correct_label_en}
              onChangeAr={v => set('correct_label_ar', v)} onChangeEn={v => set('correct_label_en', v)}
            />
            <BilingualLabel
              labelAr="رسالة الإجابة الخاطئة" labelEn="Wrong Answer Message"
              valueAr={settings.wrong_label_ar} valueEn={settings.wrong_label_en}
              onChangeAr={v => set('wrong_label_ar', v)} onChangeEn={v => set('wrong_label_en', v)}
            />
          </div>

          {/* Label Preview */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(124,58,237,0.05)', border: '1px dashed rgba(124,58,237,0.2)' }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--color-text-muted)' }}>معاينة النصوص</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}>{settings.start_label_ar}</span>
              <span className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>{settings.correct_label_ar}</span>
              <span className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{settings.wrong_label_ar}</span>
              <span className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}>{settings.next_label_ar}</span>
            </div>
          </div>
        </div>
      )}

      <button onClick={save} disabled={saving} className="btn btn-primary btn-lg w-full">
        {saving ? '⏳ جاري الحفظ...' : '💾 حفظ إعدادات اللعبة'}
      </button>
    </div>
  )
}
