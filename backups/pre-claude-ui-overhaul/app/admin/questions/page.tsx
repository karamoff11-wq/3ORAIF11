'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
const DIFF_LABELS: Record<string, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }

export default function AdminQuestionsPage() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ category_id: '', difficulty: 'easy' as 'easy'|'medium'|'hard', question: '', answer: '', media_url: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function load() {
    const [q, c] = await Promise.all([
      (supabase.from('questions') as any).select('*, categories(name)').order('created_at', { ascending: false }),
      (supabase.from('categories') as any).select('*').order('name'),
    ])
    setQuestions(q.data ?? [])
    setCategories(c.data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openAdd() {
    setForm({ category_id: '', difficulty: 'easy', question: '', answer: '', media_url: '' })
    setEditing(null); setModal(true)
  }
  function openEdit(q: any) {
    setForm({ category_id: q.category_id ?? '', difficulty: q.difficulty, question: q.question, answer: q.answer, media_url: q.media_url ?? '' })
    setEditing(q); setModal(true)
  }

  async function save() {
    if (!form.question.trim() || !form.answer.trim()) { toast.error('السؤال والإجابة مطلوبان'); return }
    setSaving(true)
    const payload = { category_id: form.category_id || null, difficulty: form.difficulty, question: form.question.trim(), answer: form.answer.trim(), media_url: form.media_url.trim() || null }
    const { error } = editing
      ? await (supabase.from('questions') as any).update(payload).eq('id', editing.id)
      : await (supabase.from('questions') as any).insert(payload)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success(editing ? 'تم التحديث' : 'تمت الإضافة')
    setModal(false); setSaving(false); load()
  }

  async function del(id: string) {
    const { error } = await (supabase.from('questions') as any).delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('تم الحذف'); setDeleteId(null); load()
  }

  const filtered = questions.filter(q =>
    (!search || q.question.includes(search) || q.answer.includes(search)) &&
    (!filterDiff || q.difficulty === filterDiff)
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text-primary">الأسئلة</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{questions.length} سؤال في قاعدة البيانات</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">+ إضافة سؤال</button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input className="input max-w-xs" placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2">
          {['', ...DIFFICULTIES].map(d => (
            <button key={d} onClick={() => setFilterDiff(d)} className="btn btn-sm"
              style={{ background: filterDiff === d ? 'var(--color-primary)' : 'var(--color-surface-2)', color: filterDiff === d ? 'white' : 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              {d ? DIFF_LABELS[d] : 'الكل'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(6).fill(0).map((_, i) => <div key={i} className="h-16 card-glass animate-shimmer rounded-xl" />)}</div>
      ) : (
        <div className="card rounded-2xl overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                {['السؤال', 'الإجابة', 'الفئة', 'الصعوبة', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-right font-bold" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: 'var(--color-text-primary)' }}>{q.question}</td>
                  <td className="px-4 py-3 max-w-[160px] truncate" style={{ color: 'var(--color-text-secondary)' }}>{q.answer}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{q.categories?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold badge-${q.difficulty}`}>{DIFF_LABELS[q.difficulty]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(q)} className="btn btn-sm btn-ghost" style={{ padding: '4px 12px' }}>تعديل</button>
                      <button onClick={() => setDeleteId(q.id)} className="btn btn-sm" style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: 'var(--color-text-muted)' }}>لا توجد نتائج</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="card-glass w-full max-w-lg p-8 space-y-5"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{editing ? 'تعديل السؤال' : 'إضافة سؤال'}</h2>
              <div>
                <label className="label">الفئة</label>
                <select className="input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">بدون فئة</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">الصعوبة</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                      className={`btn btn-sm flex-1 badge-${d}`} style={{ opacity: form.difficulty === d ? 1 : 0.4 }}>
                      {DIFF_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">السؤال *</label>
                <textarea className="input" rows={3} value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="اكتب السؤال..." />
              </div>
              <div>
                <label className="label">الإجابة *</label>
                <input className="input" value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="الإجابة الصحيحة" />
              </div>
              <div>
                <label className="label">رابط صورة (اختياري)</label>
                <input className="input" value={form.media_url} onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))} placeholder="https://..." dir="ltr" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="btn btn-primary flex-1">{saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة'}</button>
                <button onClick={() => setModal(false)} className="btn btn-ghost">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="card-glass p-8 max-w-sm w-full text-center space-y-5">
              <div className="text-5xl">🗑️</div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>تأكيد الحذف</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>لا يمكن التراجع عن هذه العملية.</p>
              <div className="flex gap-3">
                <button onClick={() => del(deleteId)} className="btn flex-1" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>احذف</button>
                <button onClick={() => setDeleteId(null)} className="btn btn-ghost flex-1">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
