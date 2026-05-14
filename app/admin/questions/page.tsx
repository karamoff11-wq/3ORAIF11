'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { QuestionWithCategory, AdminCategory } from '@/types/admin'

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
const DIFF_LABELS: Record<string, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }
const DIFF_COLOR: Record<string, string> = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }

export default function AdminQuestionsPage() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<QuestionWithCategory[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<QuestionWithCategory | null>(null)
  const [form, setForm] = useState({ category_id: '', difficulty: 'easy' as 'easy' | 'medium' | 'hard', question: '', answer: '', media_url: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // ── 2.4 Bulk Selection State ─────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const [q, c] = await Promise.all([
      (supabase.from('questions') as any).select('*, categories(name)').order('created_at', { ascending: false }),
      (supabase.from('categories') as any).select('*').order('name'),
    ])
    setQuestions(q.data ?? [])
    setCategories(c.data ?? [])
    setLoading(false)
    setSelected(new Set())
  }, [supabase])

  useEffect(() => { load() }, [load])

  const filtered = questions.filter(q =>
    (!search || q.question.includes(search) || q.answer.includes(search)) &&
    (!filterDiff || q.difficulty === filterDiff) &&
    (!filterCat || q.category_id === filterCat)
  )

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(q => q.id)))
  }
  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const someSelected = selected.size > 0

  // ── Bulk Delete ──────────────────────────────────────────────────────────
  const bulkDelete = async () => {
    setBulkDeleting(true)
    const ids = Array.from(selected)
    const { error } = await (supabase.from('questions') as any).delete().in('id', ids)
    if (error) { toast.error(error.message); setBulkDeleting(false); return }
    toast.success(`تم حذف ${ids.length} سؤال`)
    setShowBulkConfirm(false)
    setBulkDeleting(false)
    load()
  }

  // ── Single Delete ────────────────────────────────────────────────────────
  const del = async (id: string) => {
    const { error } = await (supabase.from('questions') as any).delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('تم الحذف'); setDeleteId(null); load()
  }

  // ── Save (Add/Edit) ──────────────────────────────────────────────────────
  const save = async () => {
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

  // ── CSV Export ───────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = (selected.size > 0 ? filtered.filter(q => selected.has(q.id)) : filtered)
    const header = 'سؤال,إجابة,صعوبة,فئة'
    const lines = rows.map(q =>
      `"${q.question.replace(/"/g, '""')}","${q.answer.replace(/"/g, '""')}","${q.difficulty}","${q.categories?.name ?? ''}"`
    )
    const csv = [header, ...lines].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'questions.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success(`تم تصدير ${rows.length} سؤال`)
  }

  // ── CSV Import ───────────────────────────────────────────────────────────
  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    const text = await file.text()
    const lines = text.split('\n').slice(1).filter(Boolean) // skip header
    const inserts: any[] = []
    let skipped = 0

    for (const line of lines) {
      // Parse CSV line respecting quoted fields
      const cols = line.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^,]+)/g)
        ?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) ?? []
      const [question, answer, difficulty, catName] = cols
      if (!question || !answer) { skipped++; continue }
      const validDiff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium'
      const cat = categories.find(c => c.name === catName)
      inserts.push({ question, answer, difficulty: validDiff, category_id: cat?.id ?? null })
    }

    if (inserts.length === 0) {
      toast.error('لم يتم العثور على أسئلة صالحة في الملف')
      setImportLoading(false)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    const { error } = await (supabase.from('questions') as any).insert(inserts)
    if (error) { toast.error('فشل الاستيراد: ' + error.message) }
    else { toast.success(`تم استيراد ${inserts.length} سؤال${skipped > 0 ? ` (تم تخطي ${skipped})` : ''}`) }
    setImportLoading(false)
    if (fileRef.current) fileRef.current.value = ''
    load()
  }

  const openAdd = () => { setForm({ category_id: '', difficulty: 'easy', question: '', answer: '', media_url: '' }); setEditing(null); setModal(true) }
  const openEdit = (q: QuestionWithCategory) => { setForm({ category_id: q.category_id ?? '', difficulty: q.difficulty, question: q.question, answer: q.answer, media_url: q.media_url ?? '' }); setEditing(q); setModal(true) }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black gradient-text-primary">الأسئلة</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{questions.length} سؤال في قاعدة البيانات</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* CSV Import */}
          <button onClick={() => fileRef.current?.click()} disabled={importLoading}
            className="btn btn-sm font-bold"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
            {importLoading ? 'جاري الاستيراد...' : '📥 استيراد CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />

          {/* CSV Export */}
          <button onClick={exportCSV}
            className="btn btn-sm font-bold"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
            📤 تصدير CSV
          </button>

          <button onClick={openAdd} className="btn btn-primary">+ إضافة سؤال</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input className="input max-w-xs" placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input max-w-[160px]" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">كل الفئات</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-2">
          {['', ...DIFFICULTIES].map(d => (
            <button key={d} onClick={() => setFilterDiff(d)} className="btn btn-sm"
              style={{ background: filterDiff === d ? 'var(--color-primary)' : 'var(--color-surface-2)', color: filterDiff === d ? 'white' : 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              {d ? DIFF_LABELS[d] : 'الكل'}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {someSelected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="font-bold text-sm" style={{ color: '#ef4444' }}>
              ✓ {selected.size} سؤال محدد
            </span>
            <button onClick={() => setShowBulkConfirm(true)}
              className="px-4 py-1.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              🗑️ حذف المحدد
            </button>
            <button onClick={() => setSelected(new Set())}
              className="text-xs font-semibold"
              style={{ color: 'var(--color-text-muted)' }}>
              إلغاء التحديد
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">{Array(6).fill(0).map((_, i) => <div key={i} className="h-16 card-glass animate-shimmer rounded-xl" />)}</div>
      ) : (
        <div className="card rounded-2xl overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                {/* Select-all checkbox */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                    title="تحديد الكل"
                  />
                </th>
                {['السؤال', 'الإجابة', 'الفئة', 'الصعوبة', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-right font-bold" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => {
                const isSelected = selected.has(q.id)
                return (
                  <motion.tr key={q.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      background: isSelected ? 'rgba(239,68,68,0.05)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(q.id)}
                        className="w-4 h-4 rounded accent-purple-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: 'var(--color-text-primary)' }}>{q.question}</td>
                    <td className="px-4 py-3 max-w-[160px] truncate" style={{ color: 'var(--color-text-secondary)' }}>{q.answer}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{(q.categories as any)?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold"
                        style={{ background: DIFF_COLOR[q.difficulty] + '15', color: DIFF_COLOR[q.difficulty] }}>
                        {DIFF_LABELS[q.difficulty]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(q)} className="btn btn-sm btn-ghost" style={{ padding: '4px 12px' }}>تعديل</button>
                        <button onClick={() => setDeleteId(q.id)} className="btn btn-sm"
                          style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>حذف</button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center" style={{ color: 'var(--color-text-muted)' }}>لا توجد نتائج</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Delete Confirm */}
      <AnimatePresence>
        {showBulkConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="card-glass p-8 max-w-sm w-full text-center space-y-5">
              <div className="text-5xl">🗑️</div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>حذف {selected.size} سؤال؟</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>لا يمكن التراجع عن هذه العملية.</p>
              <div className="flex gap-3">
                <button onClick={bulkDelete} disabled={bulkDeleting}
                  className="btn flex-1"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {bulkDeleting ? 'جاري الحذف...' : 'احذف'}
                </button>
                <button onClick={() => setShowBulkConfirm(false)} className="btn btn-ghost flex-1">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {categories.map(c => <option key={c.id} value={c.id}>{(c as any).icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">الصعوبة</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                      className="btn btn-sm flex-1"
                      style={{ background: DIFF_COLOR[d] + '20', color: DIFF_COLOR[d], border: `1px solid ${DIFF_COLOR[d]}${form.difficulty === d ? '60' : '20'}`, opacity: form.difficulty === d ? 1 : 0.5 }}>
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

      {/* Single Delete Confirm */}
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
                <button onClick={() => del(deleteId)} className="btn flex-1"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>احذف</button>
                <button onClick={() => setDeleteId(null)} className="btn btn-ghost flex-1">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV Format Hint */}
      <div className="mt-6 p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p className="text-xs font-bold mb-1" style={{ color: '#3b82f6' }}>📋 تنسيق ملف CSV للاستيراد:</p>
        <code className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          سؤال,إجابة,صعوبة(easy/medium/hard),اسم الفئة
        </code>
      </div>
    </div>
  )
}
