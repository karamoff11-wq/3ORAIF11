'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import MediaCropEditor, { type CropConfig } from '@/components/MediaCropEditor'

const ICONS = ['📚','🌍','🔬','📜','⚽','🎬','🧠','🎵','🍔','🏛️','💻','✈️','🐾','🧩','🎯']

export default function AdminCategoriesPage() {
  const supabase = createClient()
  const [cats, setCats] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ id: '', name: '', icon: '📚', topic_id: '', image_url: '', hide_icon: false })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [cropEditorUrl, setCropEditorUrl] = useState<string | null>(null)
  const [cropConfig, setCropConfig] = useState<CropConfig | null>(null)

  async function load() {
    const [catsRes, topicsRes] = await Promise.all([
      (supabase.from('categories') as any).select('*, topics(name, color), questions(count)').order('name'),
      (supabase.from('topics') as any).select('id, name').order('order_index')
    ])
    
    setCats(catsRes.data ?? [])
    setTopics(topicsRes.data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openAdd() { 
    setForm({ id: `cat-${Date.now()}`, name: '', icon: '📚', topic_id: topics[0]?.id || '', image_url: '', hide_icon: false })
    setEditing(null)
    setModal(true) 
  }
  function openEdit(c: any) { 
    setForm({ id: c.id, name: c.name, icon: c.icon ?? '📚', topic_id: c.topic_id || '', image_url: c.image_url || '', hide_icon: c.hide_icon || false })
    setCropConfig(c.crop_config || null)
    setEditing(c)
    setModal(true) 
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `category_backgrounds/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setForm(f => ({ ...f, image_url: data.publicUrl }))
      setCropEditorUrl(data.publicUrl)  // Auto-open crop editor after upload
      toast.success('تم رفع الصورة بنجاح! اضبط القص الآن.')
    } catch (error: any) {
      toast.error('خطأ في الرفع: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!form.name.trim()) { toast.error('اسم الفئة مطلوب'); return }
    setSaving(true)
    const payload = { 
      id: form.id,
      name: form.name.trim(), 
      icon: form.icon, 
      topic_id: form.topic_id || null, 
      image_url: form.image_url, 
      hide_icon: form.hide_icon,
      crop_config: cropConfig || null
    }
    const { error } = editing
      ? await (supabase.from('categories') as any).update(payload).eq('id', editing.id)
      : await (supabase.from('categories') as any).insert(payload)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success(editing ? 'تم التحديث' : 'تمت الإضافة')
    setModal(false); setSaving(false); load()
  }

  async function del(id: string) {
    const { error } = await (supabase.from('categories') as any).delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('تم الحذف'); setDeleteId(null); load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text-primary">الفئات</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{cats.length} فئة</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">+ إضافة فئة</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-28 card-glass animate-shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {cats.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-glass flex items-center gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 bottom-0 right-0 w-1 z-10" style={{ backgroundColor: c.topics?.color || '#3b82f6' }} />
              {c.image_url && (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-30 z-0 pointer-events-none" 
                  style={{ backgroundImage: `url(${c.image_url})` }} 
                />
              )}
              <div className="text-4xl w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 mr-2 z-10 relative"
                style={{ background: 'var(--color-surface-3)' }}>
                {c.icon}
              </div>
              <div className="flex-1 min-w-0 z-10 relative">
                <p className="font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{c.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {c.topics && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: `${c.topics.color}20`, color: c.topics.color }}>
                      {c.topics.name}
                    </span>
                  )}
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {c.questions?.[0]?.count ?? 0} سؤال
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => openEdit(c)} className="btn btn-sm btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }}>تعديل</button>
                <button onClick={() => setDeleteId(c.id)} className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>حذف</button>
              </div>
            </motion.div>
          ))}
          {cats.length === 0 && (
            <div className="col-span-3 py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>
              لا توجد فئات بعد — أضف فئة جديدة
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="card-glass w-full max-w-sm p-8 space-y-5"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {editing ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
              </h2>
              
              <div>
                <label className="label">اسم الفئة *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: جغرافيا" />
              </div>

              {!editing && (
                <div>
                  <label className="label">المعرف (ID)</label>
                  <input className="input" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} placeholder="مثال: cat-geography" />
                  <p className="text-[10px] text-white/50 mt-1">يتم توليده تلقائياً، يمكنك تعديله إذا أردت.</p>
                </div>
              )}

              <div>
                <label className="label">الموضوع التابع له</label>
                <select className="input" value={form.topic_id} onChange={e => setForm(f => ({ ...f, topic_id: e.target.value }))}>
                  <option value="">بدون موضوع</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Image Upload + Crop Button */}
              <div>
                <label className="label">صورة الخلفية (اختياري)</label>
                <div className="flex flex-col gap-3">
                  <input className="input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="رابط مباشر للصورة (JPG/PNG)" />
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={uploading} 
                      className="block w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30 transition-all cursor-pointer disabled:opacity-50"
                    />
                    {uploading && <div className="absolute right-4 top-2 text-xs text-cyan-400 animate-pulse font-bold">جاري الرفع...</div>}
                  </div>
                  {form.image_url && (
                    <button
                      type="button"
                      onClick={() => setCropEditorUrl(form.image_url)}
                      className="w-full py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-bold hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      ✂️ ضبط القص والتكبير
                      {cropConfig && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">تم الضبط ✓</span>}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="label">الأيقونة (Emoji)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{ background: form.icon === icon ? 'var(--color-primary)' : 'var(--color-surface-3)', transform: form.icon === icon ? 'scale(1.15)' : 'scale(1)' }}>
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                  <input 
                    type="checkbox" 
                    id="hideIcon"
                    checked={form.hide_icon} 
                    onChange={e => setForm(f => ({ ...f, hide_icon: e.target.checked }))} 
                    className="w-5 h-5 accent-purple-500 rounded bg-black/50 border-white/20"
                  />
                  <label htmlFor="hideIcon" className="text-sm font-bold text-white/80 cursor-pointer select-none">
                    إخفاء الأيقونة في صفحة إعداد اللعبة
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="btn btn-primary flex-1">
                  {saving ? 'جاري الحفظ...' : editing ? 'حفظ' : 'إضافة'}
                </button>
                <button onClick={() => setModal(false)} className="btn btn-ghost">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="card-glass p-8 max-w-sm w-full text-center space-y-5">
              <div className="text-5xl">🗑️</div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>تأكيد الحذف</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>سيتم حذف الفئة وجميع أسئلتها المرتبطة.</p>
              <div className="flex gap-3">
                <button onClick={() => del(deleteId)} className="btn flex-1" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>نعم، احذف</button>
                <button onClick={() => setDeleteId(null)} className="btn btn-ghost flex-1">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Editor Modal */}
      <AnimatePresence>
        {cropEditorUrl && (
          <MediaCropEditor
            mediaUrl={cropEditorUrl}
            mediaType="image"
            initialConfig={cropConfig ?? undefined}
            availableSlots={['cat_setup', 'cat_game']}
            onSave={(cfg) => {
              setCropConfig(cfg)
              setCropEditorUrl(null)
              toast.success('تم حفظ إعدادات القص')
            }}
            onClose={() => setCropEditorUrl(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
