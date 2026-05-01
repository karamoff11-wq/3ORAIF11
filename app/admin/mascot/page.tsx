'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Mascot from '@/components/Mascot'

const CATEGORIES = [
  { id: 'intro',      label: 'الترحيب (Intro)',           state: 'idle' },
  { id: 'idle',       label: 'الانتظار (Idle)',            state: 'idle' },
  { id: 'correct',    label: 'إجابة صحيحة (Correct)',     state: 'correct' },
  { id: 'wrong',      label: 'إجابة خاطئة (Wrong)',       state: 'wrong' },
  { id: 'punishment', label: 'عقاب (Punishment)',          state: 'punishment' },
  { id: 'thinking',   label: 'تفكير (Thinking)',           state: 'thinking' },
  { id: 'hype',       label: 'حماس / سلسلة (Hype)',       state: 'hype' },
]

// Standardized 4-color palette — same as game
const DEMO_COLORS = ['#FF3B3B', '#3B82F6', '#A855F7', '#22C55E']

export default function AdminMascotPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<any>(null)
  const [phrases, setPhrases] = useState<any[]>([])
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [newPhrase, setNewPhrase] = useState({ category: 'correct', text: '' })
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [phraseAudioFile, setPhraseAudioFile] = useState<File | null>(null)

  // Answer Phrases (shown in QuestionModal after reveal)
  const [answerPhrases, setAnswerPhrases] = useState<any[]>([])
  const [newAnswerPhrase, setNewAnswerPhrase] = useState<{text: string, category: 'correct'|'wrong'|'punishment'}>({ text: '', category: 'correct' })
  const [addingAnswerCategory, setAddingAnswerCategory] = useState<'correct'|'wrong'|'punishment'|null>(null)

  const [previewState, setPreviewState] = useState<any>('idle')
  const [isTalking, setIsTalking] = useState(false)
  const [previewColor, setPreviewColor] = useState('#6B9FD4')

  useEffect(() => {
    async function loadData() {
      const [settsRes, phrsRes] = await Promise.all([
        (supabase.from('mascot_settings') as any).select('*').single(),
        (supabase.from('mascot_phrases') as any).select('*').order('created_at', { ascending: false }),
      ])
      if (settsRes.data) {
        setSettings(settsRes.data)
        if (settsRes.data.pebble_preview_color) setPreviewColor(settsRes.data.pebble_preview_color)
      }
      if (phrsRes.data) setPhrases(phrsRes.data)

      // Load answer phrases
      const apRes = await (supabase.from('answer_phrases') as any).select('*').order('created_at', { ascending: false })
      if (apRes.data) setAnswerPhrases(apRes.data)
      
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
    if (!newPhrase.text.trim() && !phraseAudioFile) {
      toast.error('يجب إدخال نص أو رفع ملف صوتي')
      return
    }
    setUploadingAudio(true)
    let audioUrl = null
    if (phraseAudioFile) {
      const ext = phraseAudioFile.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('audio').upload(fileName, phraseAudioFile)
      if (uploadError) { toast.error('فشل رفع الصوت'); setUploadingAudio(false); return }
      const { data: pubData } = supabase.storage.from('audio').getPublicUrl(fileName)
      audioUrl = pubData.publicUrl
    }
    const { data, error } = await (supabase.from('mascot_phrases') as any).insert([{
      category: newPhrase.category, text: newPhrase.text, audio_url: audioUrl, is_active: true
    }]).select()
    setUploadingAudio(false)
    if (error) { toast.error('حدث خطأ') }
    else if (data) {
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

  const addAnswerPhrase = async (category: 'correct'|'wrong'|'punishment') => {
    if (!newAnswerPhrase.text.trim()) return
    const { data, error } = await (supabase.from('answer_phrases') as any).insert([{
      category, text: newAnswerPhrase.text.trim(), is_active: true
    }]).select()
    if (error) { toast.error('حدث خطأ'); return }
    if (data) {
      setAnswerPhrases(prev => [data[0], ...prev])
      setNewAnswerPhrase({ text: '', category: 'correct' })
      setAddingAnswerCategory(null)
      toast.success('تمت إضافة الجملة')
    }
  }

  const deleteAnswerPhrase = async (id: string) => {
    await (supabase.from('answer_phrases') as any).delete().eq('id', id)
    setAnswerPhrases(prev => prev.filter(p => p.id !== id))
    toast.success('تم الحذف')
  }

  const testPhrase = (phrase: any) => {
    setPreviewState(phrase.category === 'intro' ? 'idle' : phrase.category)
    
    const sequence: any[] = []
    
    const config = settings?.timing_config || {}
    const delayCorrect = Math.min(Math.max(config.correct ?? 350, 150), 700)
    const delayWrong = Math.min(Math.max(config.wrong ?? 250, 100), 600)
    const delayReveal = Math.min(Math.max(config.reveal ?? 400, 200), 900)

    // Add AAA Game Show Pacing (SFX -> Delay)
    if (phrase.category === 'correct' || phrase.category === 'hype') {
      sequence.push({ kind: 'sfx', type: 'correct' })
      sequence.push({ kind: 'wait', durationMs: delayCorrect })
    } else if (phrase.category === 'wrong' || phrase.category === 'punishment') {
      sequence.push({ kind: 'sfx', type: 'wrong' })
      sequence.push({ kind: 'wait', durationMs: delayWrong })
    } else if (phrase.category === 'thinking') {
      sequence.push({ kind: 'sfx', type: 'reveal' })
      sequence.push({ kind: 'wait', durationMs: delayReveal })
    }

    sequence.push({ kind: 'hook', fn: () => setIsTalking(true) })

    if (phrase.audio_url) {
      sequence.push({ kind: 'mp3', url: phrase.audio_url })
    } else {
      const pitch = settings ? 1.0 + (settings.energy_level - 50) * 0.01 : 1.1
      const rate = settings ? 1.0 + (settings.energy_level - 50) * 0.005 : 1.1
      sequence.push({ kind: 'tts', text: phrase.text, pitch, rate })
    }

    sequence.push({ kind: 'hook', fn: () => setIsTalking(false) })
    sequence.push({ kind: 'wait', durationMs: 1000 })
    sequence.push({ kind: 'hook', fn: () => setPreviewState('idle') })

    // Play via Director to test the queue/interrupt rules
    import('@/lib/audioDirector').then(({ audioDirector }) => {
      audioDirector.runSequence(sequence, { priority: 'interrupt', atomicMode: 'cancel' })
    })
  }

  if (loading) return <div className="p-8 text-center text-white/50">جاري التحميل...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-black gradient-text-primary">إدارة الشخصية (بيبل) والأصوات</h1>
        <p className="text-white/50 mt-2">تحكم في شخصية البيبل، ردود الأفعال، والعبارات الصوتية.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT: Pebble Preview + Style ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Live Pebble Preview */}
          <div className="card-glass p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[320px]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10" />
            <Mascot state={previewState} size={170} isTalking={isTalking} color={previewColor} className="z-10" />
            <div className="mt-6 flex gap-2 flex-wrap justify-center relative z-10">
              {(['idle','correct','wrong','hype','thinking','angry','punishment'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setPreviewState(s)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${previewState === s ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div className="card-glass p-6 space-y-4">
            <h3 className="font-bold text-lg border-b border-white/10 pb-3">لون البيبل للمعاينة</h3>
            <p className="text-xs text-white/40">في اللعبة، يأخذ كل بيبل لون فريقه تلقائياً.</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {DEMO_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setPreviewColor(c)}
                  className={`w-9 h-9 rounded-full transition-all border-2 ${previewColor === c ? 'border-white scale-110' : 'border-transparent scale-100'}`}
                  style={{ background: c, boxShadow: previewColor === c ? `0 0 16px ${c}` : 'none' }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <label className="text-sm text-white/60">لون مخصص:</label>
              <input
                type="color"
                value={previewColor}
                onChange={e => setPreviewColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer"
              />
              <span className="font-mono text-sm text-white/50">{previewColor}</span>
            </div>
          </div>

          {/* Global Settings */}
          {settings && (
            <div className="card-glass p-6 space-y-5">
              <h3 className="font-bold text-xl border-b border-white/10 pb-4">الإعدادات العامة</h3>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold">تفعيل الشخصية في اللعبة</span>
                <input type="checkbox" checked={settings.enabled} onChange={e => saveSettings({ enabled: e.target.checked })} className="toggle" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold">تفعيل الصوت (TTS)</span>
                <input type="checkbox" checked={settings.voice_enabled} onChange={e => saveSettings({ voice_enabled: e.target.checked })} className="toggle" />
              </label>
              <div>
                <label className="text-sm font-bold text-white/70 mb-2 block">مستوى الطاقة ({settings.energy_level}%)</label>
                <input type="range" min="0" max="100" value={settings.energy_level} onChange={e => saveSettings({ energy_level: parseInt(e.target.value) })} className="w-full accent-primary" />
              </div>
            </div>
          )}

          {/* Audio Engine Pacing Settings */}
          {settings && (
            <div className="card-glass p-6 space-y-5">
              <h3 className="font-bold text-xl border-b border-white/10 pb-4">توقيت وإيقاع الصوت (TV Show Pacing)</h3>
              
              <div>
                <label className="text-sm font-bold text-white/70 mb-2 flex justify-between">
                  <span>تأخير الإجابة الصحيحة (ms)</span>
                  <span>{settings.timing_config?.correct ?? 350}ms</span>
                </label>
                <input type="range" min="150" max="700" value={settings.timing_config?.correct ?? 350} onChange={e => saveSettings({ timing_config: { ...settings.timing_config, correct: parseInt(e.target.value) } })} className="w-full accent-primary" />
              </div>
              
              <div>
                <label className="text-sm font-bold text-white/70 mb-2 flex justify-between">
                  <span>تأخير الإجابة الخاطئة (ms)</span>
                  <span>{settings.timing_config?.wrong ?? 250}ms</span>
                </label>
                <input type="range" min="100" max="600" value={settings.timing_config?.wrong ?? 250} onChange={e => saveSettings({ timing_config: { ...settings.timing_config, wrong: parseInt(e.target.value) } })} className="w-full accent-primary" />
              </div>

              <div>
                <label className="text-sm font-bold text-white/70 mb-2 flex justify-between">
                  <span>تأخير التفكير / كشف الإجابة (ms)</span>
                  <span>{settings.timing_config?.reveal ?? 400}ms</span>
                </label>
                <input type="range" min="200" max="900" value={settings.timing_config?.reveal ?? 400} onChange={e => saveSettings({ timing_config: { ...settings.timing_config, reveal: parseInt(e.target.value) } })} className="w-full accent-primary" />
              </div>

              <div>
                <label className="text-sm font-bold text-white/70 mb-2 block">لهجة الصوت المفضلة (Fallback)</label>
                <select 
                  className="input w-full"
                  value={settings.timing_config?.voice_lang ?? 'ar-SA'}
                  onChange={e => saveSettings({ timing_config: { ...settings.timing_config, voice_lang: e.target.value } })}
                >
                  <option value="ar-SA">السعودية (ar-SA)</option>
                  <option value="ar-EG">مصر (ar-EG)</option>
                  <option value="ar-AE">الإمارات (ar-AE)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Phrases List ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between bg-white/5 p-5 rounded-2xl border border-white/10">
            <div>
              <h2 className="text-2xl font-black">العبارات والأصوات</h2>
              <p className="text-white/40 text-sm mt-1">{phrases.length} عبارة مسجلة</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">+ إضافة عبارة</button>
          </div>

          <div className="grid gap-4">
            {CATEGORIES.map(cat => {
              const catPhrases = phrases.filter(p => p.category === cat.id)
              if (catPhrases.length === 0) return null
              return (
                <div key={cat.id} className="card-glass p-0 overflow-hidden">
                  <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center gap-3">
                    <Mascot state={cat.state as any} size={32} color={previewColor} className="flex-shrink-0" />
                    <span className="font-bold text-sm tracking-widest uppercase">{cat.label}</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {catPhrases.map(p => (
                      <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div>
                          <p className="font-medium text-lg">{p.text || <span className="text-white/30 italic">صوت فقط (بدون نص)</span>}</p>
                          {p.audio_url && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded mt-1 inline-block">🎤 صوت مخصص متاح</span>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => testPhrase(p)} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors">▶</button>
                          <button onClick={() => deletePhrase(p.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors">🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {phrases.length === 0 && (
              <div className="card-glass p-12 text-center text-white/30">
                <Mascot state="idle" size={80} color={previewColor} className="mx-auto mb-4" />
                <p>لا توجد عبارات بعد. اضغط "+ إضافة عبارة" للبدء.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Phrase Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="card-glass w-full max-w-lg p-8 space-y-6">
              <div className="flex items-center gap-4">
                <Mascot state={newPhrase.category as any} size={60} color={previewColor} />
                <h2 className="text-2xl font-black">إضافة عبارة جديدة</h2>
              </div>
              <div>
                <label className="label">الحالة المناسبة</label>
                <select className="input" value={newPhrase.category} onChange={e => setNewPhrase({ ...newPhrase, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">النص (اختياري إذا تم رفع صوت)</label>
                <textarea className="input min-h-[80px]" placeholder='النص الذي سيقرأه الـ TTS في حال عدم وجود ملف صوتي...' value={newPhrase.text} onChange={e => setNewPhrase({ ...newPhrase, text: e.target.value })} />
              </div>
              <div>
                <label className="label flex items-center justify-between">
                  <span>ملف صوتي (اختياري)</span>
                  {phraseAudioFile && <span className="text-xs text-green-400">تم اختيار الملف ✓</span>}
                </label>
                <input type="file" accept="audio/*" className="input text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" onChange={e => setPhraseAudioFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex gap-4 pt-2">
                <button onClick={addPhrase} disabled={uploadingAudio} className="btn btn-primary flex-1">{uploadingAudio ? 'جاري الرفع...' : 'إضافة'}</button>
                <button onClick={() => { setShowAddModal(false); setPhraseAudioFile(null) }} className="btn btn-ghost">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────── */}
      {/* Answer Phrases Section */}
      {/* ─────────────────────────────────────────────── */}
      <div className="mt-16 space-y-6">
        <div>
          <h2 className="text-3xl font-black gradient-text-primary">جمل الإجابة</h2>
          <p className="text-white/40 mt-1 text-sm">تظهر هذه الجمل عشوائياً في نافذة السؤال بعد كشف الإجابة.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ✅ Correct Phrases */}
          {(['correct', 'wrong', 'punishment'] as const).map(cat => {
            const isComingSoon = cat === 'punishment'
            const catPhrases = answerPhrases.filter(p => p.category === cat)
            const labels = { correct: { icon: '✅', title: 'إجابة صحيحة', color: '#10b981', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
              wrong: { icon: '❌', title: 'إجابة خاطئة', color: '#ef4444', border: 'border-red-500/30', bg: 'bg-red-500/10' },
              punishment: { icon: '⚡', title: 'عقاب', color: '#a855f7', border: 'border-purple-500/30', bg: 'bg-purple-500/10' }
            }
            const l = labels[cat]
            return (
              <div key={cat} className={`relative card-glass p-5 space-y-4 border ${l.border} ${isComingSoon ? 'opacity-50 pointer-events-none' : ''}`}>
                {isComingSoon && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-black/40 backdrop-blur-sm">
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-full text-sm font-bold">قريباً ✨</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg" style={{ color: l.color }}>{l.icon} {l.title}</h3>
                  <span className="text-xs text-white/30">{catPhrases.length} جملة</span>
                </div>

                {/* Phrase list */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {catPhrases.length === 0 && <p className="text-white/20 text-xs text-center py-4">لا توجد جمل بعد</p>}
                  {catPhrases.map(p => (
                    <div key={p.id} className={`flex items-center gap-2 p-3 rounded-xl ${l.bg} group`}>
                      <p className="flex-1 text-sm text-white/80 leading-snug">{p.text}</p>
                      <button
                        onClick={() => deleteAnswerPhrase(p.id)}
                        className="flex-shrink-0 w-6 h-6 rounded-full text-white/20 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center text-xs transition-colors opacity-0 group-hover:opacity-100"
                      >✕</button>
                    </div>
                  ))}
                </div>

                {/* Add phrase inline */}
                {addingAnswerCategory === cat ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={newAnswerPhrase.text}
                      onChange={e => setNewAnswerPhrase({ text: e.target.value, category: cat })}
                      placeholder="اكتب الجملة..."
                      className="input w-full min-h-[60px] text-sm"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => addAnswerPhrase(cat)} className="btn btn-primary flex-1 text-sm py-2">إضافة</button>
                      <button onClick={() => setAddingAnswerCategory(null)} className="btn btn-ghost text-sm py-2">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingAnswerCategory(cat); setNewAnswerPhrase({ text: '', category: cat }) }}
                    className={`w-full py-2 rounded-xl border border-dashed text-sm font-bold transition-colors ${l.border} text-white/40 hover:text-white/70`}
                  >+ إضافة جملة</button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
