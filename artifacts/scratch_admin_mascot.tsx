'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Mascot from '@/components/Mascot'

const CATEGORIES = [
  { id: 'intro', label: 'الترحيب (Intro)' },
  { id: 'idle', label: 'الانتظار (Idle)' },
  { id: 'correct', label: 'إجابة صحيحة (Correct)' },
  { id: 'wrong', label: 'إجابة خاطئة (Wrong)' },
  { id: 'punishment', label: 'عقاب (Punishment)' },
  { id: 'thinking', label: 'تفكير (Thinking)' },
  { id: 'hype', label: 'حماس / سلسلة (Hype)' }
]

export default function AdminMascotPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<any>(null)
  const [phrases, setPhrases] = useState<any[]>([])
  const [mascots, setMascots] = useState<any[]>([])
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPhrase, setNewPhrase] = useState({ category: 'correct', text: '' })
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [phraseAudioFile, setPhraseAudioFile] = useState<File | null>(null)
  
  const [showMascotModal, setShowMascotModal] = useState(false)
  const [newMascotName, setNewMascotName] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  const [previewState, setPreviewState] = useState<any>('idle')
  const [isTalking, setIsTalking] = useState(false)

  // Active custom mascot for preview
  const activeCustomMascot = mascots.find(m => m.id === settings?.active_mascot_id)

  useEffect(() => {
    async function loadData() {
      const [settsRes, phrsRes, mascotsRes] = await Promise.all([
        (supabase.from('mascot_settings') as any).select('*').single(),
        (supabase.from('mascot_phrases') as any).select('*').order('created_at', { ascending: false }),
        (supabase.from('mascots') as any).select('*').order('created_at', { ascending: false })
      ])
      
      if (settsRes.data) setSettings(settsRes.data)
      if (phrsRes.data) setPhrases(phrsRes.data)
      if (mascotsRes.data) setMascots(mascotsRes.data)
      setLoading(false)
    }
    loadData()

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices()
      setVoices(v.filter(voice => voice.lang.startsWith('ar') || voice.lang.startsWith('en')))
    }
    
    loadVoices()
    if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const saveSettings = async (updates: any) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    await (supabase.from('mascot_settings') as any).update(updates).eq('id', settings.id)
    toast.success('تم حفظ الإعدادات')
  }

  const addPhrase = async () => {
    if (!newPhrase.text.trim()) return
    setUploadingAudio(true)

    let audioUrl = null
    if (phraseAudioFile) {
      const ext = phraseAudioFile.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('audio').upload(fileName, phraseAudioFile)
      if (uploadError) {
        toast.error('فشل رفع الصوت')
        setUploadingAudio(false)
        return
      }
      const { data: pubData } = supabase.storage.from('audio').getPublicUrl(fileName)
      audioUrl = pubData.publicUrl
    }

    const { data, error } = await (supabase.from('mascot_phrases') as any).insert([{
      category: newPhrase.category,
      text: newPhrase.text,
      audio_url: audioUrl,
      is_active: true
    }]).select()
    
    setUploadingAudio(false)

    if (error) {
      toast.error('حدث خطأ')
    } else if (data) {
      setPhrases([data[0], ...phrases])
      setNewPhrase({ category: 'correct', text: '' })
      setPhraseAudioFile(null)
      setShowAddModal(false)
      toast.success('تمت إضافة الجملة')
    }
  }

  const deletePhrase = async (id: string) => {
    await (supabase.from('mascot_phrases') as any).delete().eq('id', id)
    setPhrases(phrases.filter(p => p.id !== id))
    toast.success('تم الحذف')
  }

  const testPhrase = (phrase: any) => {
    setPreviewState(phrase.category === 'intro' ? 'idle' : phrase.category)
    setIsTalking(true)
    
    if (phrase.audio_url) {
      const audio = new Audio(phrase.audio_url)
      audio.onended = () => {
        setIsTalking(false)
        setTimeout(() => setPreviewState('idle'), 1000)
      }
      audio.play().catch(e => console.error('Audio playback failed', e))
      return
    }

    const u = new SpeechSynthesisUtterance(phrase.text)
    if (settings?.voice_id) {
      const voice = voices.find(v => v.voiceURI === settings.voice_id)
      if (voice) u.voice = voice
    } else {
      const ar = voices.find(v => v.lang.startsWith('ar'))
      if (ar) u.voice = ar
    }
    u.pitch = 1.0 + ((settings?.energy_level || 50) - 50) * 0.01
    u.rate = 1.0 + ((settings?.energy_level || 50) - 50) * 0.005
    
    u.onend = () => {
      setIsTalking(false)
      setTimeout(() => setPreviewState('idle'), 1000)
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  const createMascot = async () => {
    if (!newMascotName.trim()) return
    const { data, error } = await (supabase.from('mascots') as any).insert([{ name: newMascotName }]).select()
    if (!error && data) {
      setMascots([data[0], ...mascots])
      setNewMascotName('')
      setShowMascotModal(false)
      toast.success('تم إنشاء الشخصية')
    }
  }

  const uploadMascotStateImage = async (mascotId: string, stateField: string, file: File) => {
    setUploadingImage(true)
    const ext = file.name.split('.').pop()
    const fileName = `${mascotId}_${stateField}_${Date.now()}.${ext}`
    
    const { error: uploadError } = await supabase.storage.from('mascots').upload(fileName, file)
    if (uploadError) {
      toast.error('فشل رفع الصورة')
      setUploadingImage(false)
      return
    }

    const { data: pubData } = supabase.storage.from('mascots').getPublicUrl(fileName)
    const imageUrl = pubData.publicUrl

    const { error } = await (supabase.from('mascots') as any).update({ [stateField]: imageUrl }).eq('id', mascotId)
    
    if (!error) {
      setMascots(mascots.map(m => m.id === mascotId ? { ...m, [stateField]: imageUrl } : m))
      toast.success('تم حفظ الصورة')
    }
    setUploadingImage(false)
  }

  if (loading) return <div className="p-8 text-center text-white/50">جاري التحميل...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black gradient-text-primary">إدارة الشخصيات والأصوات</h1>
          <p className="text-white/50 mt-2">تحكم في ردود الأفعال، الصوت، والعبارات الخاصة باللعبة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Preview & Global Settings */}
        <div className="lg:col-span-1 space-y-8">
          <div className="card-glass p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10" />
            <Mascot state={previewState} size={200} isTalking={isTalking} customMascot={activeCustomMascot} className="z-10" />
            
            <div className="mt-8 flex gap-2 flex-wrap justify-center relative z-10">
              <button onClick={() => setPreviewState('idle')} className="btn btn-sm btn-ghost">Idle</button>
              <button onClick={() => setPreviewState('correct')} className="btn btn-sm" style={{ background: '#10b98120', color: '#10b981' }}>Correct</button>
              <button onClick={() => setPreviewState('wrong')} className="btn btn-sm" style={{ background: '#ef444420', color: '#ef4444' }}>Wrong</button>
              <button onClick={() => setPreviewState('hype')} className="btn btn-sm" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>Hype</button>
              <button onClick={() => setPreviewState('thinking')} className="btn btn-sm btn-ghost">Think</button>
              <button onClick={() => setPreviewState('angry')} className="btn btn-sm" style={{ background: '#f59e0b20', color: '#f59e0b' }}>Angry</button>
            </div>
          </div>

          {settings && (
            <div className="card-glass p-6 space-y-6">
              <h3 className="font-bold text-xl border-b border-white/10 pb-4">الإعدادات العامة</h3>
              
              <div>
                <label className="text-sm font-bold text-white/70 mb-2 block">الشخصية النشطة</label>
                <select 
                  className="input text-sm w-full"
                  value={settings.active_mascot_id || ''}
                  onChange={e => saveSettings({ active_mascot_id: e.target.value || null })}
                >
                  <option value="">أبو العُريف (الافتراضي - SVG)</option>
                  {mascots.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (صور مخصصة)</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold">تفعيل الشخصية باللعبة</span>
                <input type="checkbox" checked={settings.enabled} onChange={e => saveSettings({ enabled: e.target.checked })} className="toggle" />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold">تفعيل الصوت (TTS Fallback)</span>
                <input type="checkbox" checked={settings.voice_enabled} onChange={e => saveSettings({ voice_enabled: e.target.checked })} className="toggle" />
              </label>

              <div>
                <label className="text-sm font-bold text-white/70 mb-2 block">مستوى الطاقة للـ TTS ({settings.energy_level}%)</label>
                <input type="range" min="0" max="100" value={settings.energy_level} onChange={e => saveSettings({ energy_level: parseInt(e.target.value) })} className="w-full accent-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Phrases and Mascots Lists */}
        <div className="lg:col-span-2 space-y-8">

          {/* Custom Mascots Management */}
          <div className="card-glass p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">الشخصيات المخصصة</h2>
              <button onClick={() => setShowMascotModal(true)} className="btn btn-sm btn-primary">+ شخصية جديدة</button>
            </div>
            
            {mascots.length === 0 ? (
              <p className="text-white/40 text-sm">لا توجد شخصيات مخصصة. سيتم استخدام أبو العُريف الافتراضي.</p>
            ) : (
              <div className="grid gap-4">
                {mascots.map(mascot => (
                  <div key={mascot.id} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-4">
                    <h3 className="font-bold text-lg">{mascot.name}</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {['idle', 'correct', 'wrong', 'thinking', 'hype', 'punishment'].map(state => {
                        const field = state + '_url'
                        const url = mascot[field]
                        return (
                          <div key={state} className="bg-black/40 p-2 rounded-lg text-center flex flex-col gap-2">
                            <span className="text-[10px] uppercase font-mono text-white/50">{state}</span>
                            {url ? (
                              <img src={url} alt={state} className="w-12 h-12 object-contain mx-auto rounded" />
                            ) : (
                              <div className="w-12 h-12 border-2 border-dashed border-white/20 rounded mx-auto flex items-center justify-center text-white/20 text-xs">فارغ</div>
                            )}
                            <label className="text-[10px] bg-white/10 hover:bg-white/20 py-1 rounded cursor-pointer transition-colors">
                              {uploadingImage ? '...' : 'تغيير'}
                              <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && uploadMascotStateImage(mascot.id, field, e.target.files[0])} />
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phrases List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
              <h2 className="text-2xl font-black">العبارات والأصوات ({phrases.length})</h2>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary">+ إضافة عبارة</button>
            </div>

            <div className="grid gap-4">
              {CATEGORIES.map(cat => {
                const catPhrases = phrases.filter(p => p.category === cat.id)
                if (catPhrases.length === 0) return null
                
                return (
                  <div key={cat.id} className="card-glass p-0 overflow-hidden">
                    <div className="bg-white/5 px-6 py-3 border-b border-white/10 font-bold text-sm tracking-widest uppercase flex justify-between">
                      {cat.label}
                    </div>
                    <div className="divide-y divide-white/5">
                      {catPhrases.map(p => (
                        <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                          <div>
                            <p className="font-medium text-lg">{p.text}</p>
                            {p.audio_url && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded mt-1 inline-block">🎤 صوت مخصص متاح</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => testPhrase(p)} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors">
                              ▶
                            </button>
                            <button onClick={() => deletePhrase(p.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                              🗑
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Add Mascot Modal */}
      <AnimatePresence>
        {showMascotModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="card-glass w-full max-w-sm p-8 space-y-6">
              <h2 className="text-2xl font-black">شخصية جديدة</h2>
              <div>
                <label className="label">اسم الشخصية</label>
                <input className="input" value={newMascotName} onChange={e => setNewMascotName(e.target.value)} placeholder="مثال: القطة الذكية" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={createMascot} className="btn btn-primary flex-1">إنشاء</button>
                <button onClick={() => setShowMascotModal(false)} className="btn btn-ghost">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Phrase Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="card-glass w-full max-w-lg p-8 space-y-6">
              <h2 className="text-2xl font-black">إضافة عبارة جديدة</h2>
              
              <div>
                <label className="label">حالة اللعبة (المناسبة)</label>
                <select className="input" value={newPhrase.category} onChange={e => setNewPhrase({ ...newPhrase, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="label">النص (يقرأه الـ TTS إذا لم يوجد صوت)</label>
                <textarea 
                  className="input min-h-[80px]" 
                  placeholder="مثال: يا عيني عليك! جواب صح." 
                  value={newPhrase.text}
                  onChange={e => setNewPhrase({ ...newPhrase, text: e.target.value })}
                />
              </div>

              <div>
                <label className="label flex items-center justify-between">
                  <span>ملف صوتي (اختياري)</span>
                  {phraseAudioFile && <span className="text-xs text-green-400">تم اختيار الملف ✓</span>}
                </label>
                <input 
                  type="file" 
                  accept="audio/*" 
                  className="input text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                  onChange={e => setPhraseAudioFile(e.target.files?.[0] || null)}
                />
                <p className="text-[10px] text-white/40 mt-2">ارفع تسجيلك الصوتي الحقيقي. سيتجاهل النظام الـ TTS إذا توفر هذا الملف.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={addPhrase} disabled={uploadingAudio} className="btn btn-primary flex-1">
                  {uploadingAudio ? 'جاري الرفع...' : 'إضافة'}
                </button>
                <button onClick={() => { setShowAddModal(false); setPhraseAudioFile(null) }} className="btn btn-ghost">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
