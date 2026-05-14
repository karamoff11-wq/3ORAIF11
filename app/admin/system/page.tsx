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

  // 4.2 Gemini Cost Tracker State
  const [aiUsage, setAiUsage] = useState<{
    totalInput: number;
    totalOutput: number;
    totalCalls: number;
    fallbackCalls: number;
    avgLatency: number;
    costEstimateUSD: number;
  } | null>(null)

  useEffect(() => {
    async function load() {
      // 1. Load System Settings
      const s = await getAppSettings('system', SYSTEM_DEFAULTS, supabase)
      setSettings(s)

      // 2. Load AI Usage for current month (4.2)
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: usageData } = await (supabase
        .from('ai_usage_log') as any)
        .select('input_tokens, output_tokens, latency_ms, used_fallback')
        .gte('created_at', startOfMonth.toISOString())

      if (usageData) {
        const totalInput = usageData.reduce((sum: number, r: any) => sum + (r.input_tokens || 0), 0)
        const totalOutput = usageData.reduce((sum: number, r: any) => sum + (r.output_tokens || 0), 0)
        const totalCalls = usageData.length
        const fallbackCalls = usageData.filter((r: any) => r.used_fallback).length
        const avgLatency = totalCalls > 0 
          ? Math.round(usageData.reduce((sum: number, r: any) => sum + (r.latency_ms || 0), 0) / totalCalls) 
          : 0

        // Gemini Flash 1.5 pricing (approx): 
        // Input: $0.075 per 1M tokens
        // Output: $0.30 per 1M tokens
        const costEstimateUSD = (totalInput / 1_000_000 * 0.075) + (totalOutput / 1_000_000 * 0.30)

        setAiUsage({ totalInput, totalOutput, totalCalls, fallbackCalls, avgLatency, costEstimateUSD })
      }

      setLoading(false)
    }
    load()
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

        {/* 4.2 Gemini Cost Tracker */}
        <div className="card-glass p-6 space-y-6 border border-cyan-500/20 bg-gradient-to-br from-cyan-900/10 to-transparent">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-bold text-xl text-cyan-400">استهلاك الذكاء الاصطناعي (Gemini)</h3>
              <p className="text-xs text-white/50 mt-1">إحصائيات الاستهلاك والتكلفة التقديرية للشهر الحالي</p>
            </div>
            <div className="text-4xl">🤖</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-white/50 mb-1">التكلفة التقديرية</p>
              <p className="text-xl font-bold text-green-400">${aiUsage?.costEstimateUSD.toFixed(4) ?? '0.00'}</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-white/50 mb-1">الطلبات (Calls)</p>
              <p className="text-xl font-bold">{aiUsage?.totalCalls ?? 0}</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-white/50 mb-1">متوسط الاستجابة</p>
              <p className="text-xl font-bold text-yellow-400">{aiUsage?.avgLatency ?? 0} ms</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-white/50 mb-1">اللجوء للاحتياطي (Fallback)</p>
              <p className="text-xl font-bold text-red-400">{aiUsage?.fallbackCalls ?? 0}</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center bg-white/5 p-3 rounded-lg text-sm">
            <div className="flex-1">
              <span className="text-white/50 mr-2">Tokens إدخال:</span>
              <span className="font-mono text-cyan-300">{aiUsage?.totalInput.toLocaleString() ?? 0}</span>
            </div>
            <div className="flex-1">
              <span className="text-white/50 mr-2">Tokens إخراج:</span>
              <span className="font-mono text-purple-300">{aiUsage?.totalOutput.toLocaleString() ?? 0}</span>
            </div>
          </div>
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
