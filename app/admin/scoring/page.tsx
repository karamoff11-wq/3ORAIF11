'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export default function AdminScoringPage() {
  const supabase = createClient()
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (supabase.from('scoring_config') as any).select('*').single().then(({ data }: any) => {
      setConfig(data)
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    const { error } = await (supabase
      .from('scoring_config') as any)
      .update({
        easy_points: Number(config.easy_points),
        medium_points: Number(config.medium_points),
        hard_points: Number(config.hard_points),
        default_timer_seconds: Number(config.default_timer_seconds),
        time_adjustment_seconds: Number(config.time_adjustment_seconds || 5),
        glow_enabled: Boolean(config.glow_enabled),
        glow_intensity: Number(config.glow_intensity || 40),
        flash_start_seconds: Number(config.flash_start_seconds || 15),
      })
      .eq('id', config.id)
    if (error) { toast.error(error.message) }
    else { toast.success('تم حفظ الإعدادات') }
    setSaving(false)
  }

  const fields = [
    { key: 'easy_points',           label: 'نقاط السؤال السهل',    icon: '🟢', color: '#10b981' },
    { key: 'medium_points',         label: 'نقاط السؤال المتوسط',  icon: '🟡', color: '#f59e0b' },
    { key: 'hard_points',           label: 'نقاط السؤال الصعب',    icon: '🔴', color: '#ef4444' },
    { key: 'default_timer_seconds', label: 'وقت الإجابة (ثانية)', icon: '⏱️', color: 'var(--color-primary-light)' },
    { key: 'time_adjustment_seconds', label: 'مقدار إضافة/خصم الوقت (ثواني)', icon: '⏳', color: '#3b82f6' },
  ]

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black gradient-text-primary">إعدادات النقاط</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>تحكم في نقاط كل مستوى ومدة الإجابة</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 card-glass animate-shimmer rounded-2xl" />)}
        </div>
      ) : config && (
        <div className="space-y-4">
          {fields.map(({ key, label, icon, color }) => (
            <div key={key} className="card-glass flex items-center gap-6">
              <div className="text-3xl w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-surface-3)' }}>
                {icon}
              </div>
              <div className="flex-1">
                <label className="label mb-1">{label}</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  style={{ borderColor: color + '44' }}
                  value={config[key] ?? ''}
                  onChange={e => setConfig((c: any) => ({ ...c, [key]: e.target.value }))}
                />
              </div>
              <div className="text-3xl font-black shrink-0" style={{ color }}>
                {config[key]}
              </div>
            </div>
          ))}

          {/* Glow Settings Section */}
          <div className="mt-12 mb-6">
            <h2 className="text-2xl font-black gradient-text-primary">إعدادات التوهج للجلسة (Game Glow Settings)</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>تحكم في شكل وسلوك التوهج لفريق اللاعب</p>
          </div>

          <div className="card-glass flex items-center gap-6">
            <div className="text-3xl w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-surface-3)' }}>
              ✨
            </div>
            <div className="flex-1">
              <label className="label mb-1">تفعيل التوهج</label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-primary"
                  checked={config.glow_enabled ?? true}
                  onChange={e => setConfig((c: any) => ({ ...c, glow_enabled: e.target.checked }))}
                />
                <span className="text-sm">{(config.glow_enabled ?? true) ? 'مفعل' : 'معطل'}</span>
              </div>
            </div>
          </div>

          <div className="card-glass flex items-center gap-6">
            <div className="text-3xl w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-surface-3)' }}>
              🌟
            </div>
            <div className="flex-1">
              <label className="label mb-1">قوة التوهج (بكسل)</label>
              <input
                type="number"
                min={0}
                max={200}
                className="input"
                style={{ borderColor: '#8b5cf644' }}
                value={config.glow_intensity ?? 40}
                onChange={e => setConfig((c: any) => ({ ...c, glow_intensity: e.target.value }))}
              />
            </div>
            <div className="text-3xl font-black shrink-0 text-purple-500">
              {config.glow_intensity}
            </div>
          </div>

          <div className="card-glass flex items-center gap-6">
            <div className="text-3xl w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-surface-3)' }}>
              ⚡
            </div>
            <div className="flex-1">
              <label className="label mb-1">بداية وميض التوتر عند (ثانية)</label>
              <input
                type="number"
                min={1}
                className="input"
                style={{ borderColor: '#ef444444' }}
                value={config.flash_start_seconds ?? 15}
                onChange={e => setConfig((c: any) => ({ ...c, flash_start_seconds: e.target.value }))}
              />
            </div>
            <div className="text-3xl font-black shrink-0 text-red-500">
              {config.flash_start_seconds}
            </div>
          </div>

          <div className="card-glass p-6 mt-12">
            <h3 className="font-bold mb-4" style={{ color: 'var(--color-text-secondary)' }}>معاينة</h3>
            <div className="flex justify-center gap-6">
              {[
                { label: 'سهل', points: config.easy_points, cls: 'badge-easy' },
                { label: 'متوسط', points: config.medium_points, cls: 'badge-medium' },
                { label: 'صعب', points: config.hard_points, cls: 'badge-hard' },
              ].map(({ label, points, cls }) => (
                <div key={label} className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl ${cls}`}>
                  <span className="text-sm font-bold">{label}</span>
                  <span className="text-3xl font-black">+{points}</span>
                  <span className="text-xs">نقطة</span>
                </div>
              ))}
            </div>
            <p className="text-center text-sm mt-4" style={{ color: 'var(--color-text-muted)' }}>
              ⏱️ وقت الإجابة: {config.default_timer_seconds} ثانية
            </p>
          </div>

          <button onClick={save} disabled={saving} className="btn btn-primary btn-lg w-full">
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      )}
    </div>
  )
}
