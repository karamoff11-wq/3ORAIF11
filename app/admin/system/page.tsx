'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  SYSTEM_DEFAULTS,
  type SystemSettings,
  getAppSettings,
  saveAppSettings,
} from '@/lib/appSettings'

export default function AdminSystemPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<SystemSettings>(SYSTEM_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAppSettings('system', SYSTEM_DEFAULTS, supabase).then(s => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    const { error } = await saveAppSettings('system', settings, supabase)
    if (error) toast.error('خطأ: ' + error.message)
    else toast.success('تم حفظ الإعدادات التقنية بنجاح')
    setSaving(false)
  }

  if (loading) return <div className="p-8 animate-pulse space-y-4">
    <div className="h-8 w-48 bg-white/10 rounded" />
    <div className="h-32 bg-white/5 rounded-2xl" />
  </div>

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-black gradient-text-primary">الإعدادات التقنية</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>التحكم في حالة النظام، وضع الصيانة، وإعدادات الدخول.</p>
      </div>

      <div className="space-y-6">
        {/* Maintenance Mode */}
        <div className={`card-glass p-6 border-2 transition-all ${settings.is_maintenance ? 'border-red-500/30 bg-red-500/5' : 'border-transparent'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg" style={{ color: settings.is_maintenance ? '#ef4444' : 'var(--color-text-primary)' }}>
                وضع الصيانة (Maintenance Mode)
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                عند التفعيل، سيتم تحويل جميع المستخدمين (غير المسؤولين) إلى صفحة الصيانة.
              </p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, is_maintenance: !s.is_maintenance }))}
              className={`relative w-14 h-7 rounded-full transition-all ${settings.is_maintenance ? 'bg-red-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-all ${settings.is_maintenance ? 'translate-x-7' : ''}`} />
            </button>
          </div>

          {settings.is_maintenance && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-red-500/20">
              <div>
                <label className="label">رسالة الصيانة (عربي)</label>
                <textarea
                  className="input w-full min-h-[80px]"
                  value={settings.maintenance_msg_ar}
                  onChange={e => setSettings(s => ({ ...s, maintenance_msg_ar: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Maintenance Message (EN)</label>
                <textarea
                  className="input w-full min-h-[80px]"
                  value={settings.maintenance_msg_en}
                  onChange={e => setSettings(s => ({ ...s, maintenance_msg_en: e.target.value }))}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Security Settings */}
        <div className="card-glass p-6 space-y-4">
          <h3 className="font-bold text-lg border-b border-white/10 pb-3">إعدادات الأمان والدخول</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">السماح بتسجيل مستخدمين جدد</p>
              <p className="text-xs text-white/40">تعطيل هذا الخيار سيمنع إنشاء حسابات جديدة حالياً.</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, allow_new_logins: !s.allow_new_logins }))}
              className={`relative w-12 h-6 rounded-full transition-all ${settings.allow_new_logins ? 'bg-green-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all ${settings.allow_new_logins ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card-glass p-6 border border-red-500/20 space-y-4">
          <h3 className="font-bold text-lg text-red-400">منطقة الخطر</h3>
          <p className="text-xs text-white/40">هذه الإجراءات قد تؤدي إلى مسح بيانات أو تعطيل النظام.</p>
          <button
            onClick={() => toast.error('هذا الخيار يتطلب صلاحيات Super Admin')}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/30 text-xs font-bold hover:bg-red-500/20 transition-all"
          >
            تهيئة قاعدة البيانات (Reset DB)
          </button>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="btn btn-primary btn-lg w-full"
      >
        {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات التقنية'}
      </button>
    </div>
  )
}
