'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useTranslator } from '@/lib/i18n'
import { useFeedbackStore } from '@/store/feedbackStore'
import toast from 'react-hot-toast'
import CreationsLibrary from '@/components/dashboard/CreationsLibrary'

// SVG ICONS — consistent with dashboard
const Icon = {
  Sparkles: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  ),
  Plus: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Image: ({ size = 24, style, className }: { size?: number, style?: any, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
}

type Question = {
  text: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  image: string | null
}

type Category = {
  name: string
  icon: string
  image?: string | null
  questions: Question[]
}

// ── Smart Suggestions Dictionary (Personal/Custom) ──
const SMART_CAT_NAMES = [
  'فضائح المراهقة', 'أسرار العمل', 'ذكريات السفر', 'مواقف محرجة', 
  'أسرار العائلة', 'قصة حبنا', 'صاحب عيد الميلاد', 'أيام الجامعة', 'أقوال مأثورة للشلة'
]
const SMART_QUESTIONS = [
  'متى كانت أول مرة التقينا فيها؟',
  'ما هي أكثر أكلة مستحيل أن يأكلها؟',
  'ما هو الموقف الذي جعلنا نضحك حتى بكينا؟',
  'من كان أول حب له في أيام المدرسة؟',
  'لو كان شخصية في فيلم، من سيكون؟',
  'ما هي أسوأ هدية أعطاها لأحد؟',
  'أكثر كلمة أو جملة يكررها دائمًا هي...',
  'أين كانت أسوأ رحلة سافرناها معًا ولماذا؟',
  'ما هو السر الذي يخفيه عن عائلته حتى اليوم؟',
  'لو أعطيناه مليون دولار، ما هو أول شيء غبي سيشتريه؟'
]

export default function StudioPage() {
  const router = useRouter()
  const supabase = createClient()
  const { lang } = useFeedbackStore()
  const t = useTranslator()
  const isRtl = lang === 'AR'
  const [step, setStep] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [categories, setCategories] = useState<Category[]>([
    { name: '', image: null, questions: [
        { text: '', answer: '', difficulty: 'easy', image: null },
        { text: '', answer: '', difficulty: 'easy', image: null },
        { text: '', answer: '', difficulty: 'medium', image: null },
        { text: '', answer: '', difficulty: 'medium', image: null },
        { text: '', answer: '', difficulty: 'hard', image: null },
        { text: '', answer: '', difficulty: 'hard', image: null },
    ]}
  ])
  const [activeCatIndex, setActiveCatIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedCreations, setSavedCreations] = useState<any[]>([])
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('al-arif-studio-creations')
    if (stored) setSavedCreations(JSON.parse(stored))
  }, [])

  if (!mounted) return null

  const addCategory = () => {
    if (categories.length >= 6) {
      toast.error(isRtl ? 'الحد الأقصى هو 6 فئات' : 'Max 6 categories allowed')
      return
    }
    setCategories([...categories, { 
      name: '', 
      image: null,
      questions: [
        { text: '', answer: '', difficulty: 'easy', image: null },
        { text: '', answer: '', difficulty: 'easy', image: null },
        { text: '', answer: '', difficulty: 'medium', image: null },
        { text: '', answer: '', difficulty: 'medium', image: null },
        { text: '', answer: '', difficulty: 'hard', image: null },
        { text: '', answer: '', difficulty: 'hard', image: null },
      ]
    }])
    setActiveCatIndex(categories.length)
  }

  const updateQuestion = (catIdx: number, qIdx: number, field: keyof Question, value: any) => {
    const newCats = [...categories]
    newCats[catIdx].questions[qIdx] = { ...newCats[catIdx].questions[qIdx], [field]: value }
    setCategories(newCats)
  }

  const suggestCategoryName = (catIdx: number) => {
    const random = SMART_CAT_NAMES[Math.floor(Math.random() * SMART_CAT_NAMES.length)]
    const n = [...categories]; n[catIdx].name = random; setCategories(n)
  }

  const suggestQuestion = (catIdx: number, qIdx: number) => {
    const randomQ = SMART_QUESTIONS[Math.floor(Math.random() * SMART_QUESTIONS.length)]
    const newCats = [...categories]
    newCats[catIdx].questions[qIdx].text = randomQ
    newCats[catIdx].questions[qIdx].answer = ''
    setCategories(newCats)
  }

  const accentColor = '#D4AF37'
  const glass = 'var(--bg-card)'

  return (
    <div className={`min-h-screen p-6 md:p-12 space-y-12 max-w-6xl mx-auto pb-32 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Header with Progress */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
            {isRtl ? 'استوديو ' : 'Session '} <span style={{ color: accentColor }}>{isRtl ? 'الجلسات' : 'Studio'}</span>
          </h1>
          <p className="text-sm opacity-40" style={{ color: 'var(--text-secondary)' }}>
            {isRtl ? 'أنت المخرج الآن. صمم تجربة التريفيا الخاصة بك.' : 'You are the director now. Design your own trivia experience.'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-12' : 'w-4'}`}
              style={{ background: step >= s ? accentColor : 'var(--border-subtle)' }}
            />
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        
        {step === 1 && (
          <motion.div 
            key="step1" initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
            className="p-12 rounded-[3rem] border border-white/5 text-center space-y-10"
            style={{ background: glass, borderColor: 'var(--border-subtle)' }}
          >
            <div className="w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl" style={{ background: `${accentColor}15`, color: accentColor }}>
              <Icon.Sparkles size={48} />
            </div>
            <div className="space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                {isRtl ? 'جلسة مخصصة للأبد' : 'Custom Session Forever'}
              </h2>
              <p className="leading-relaxed opacity-50" style={{ color: 'var(--text-secondary)' }}>
                {isRtl ? 'هذه الميزة تتيح لك إنشاء جلسة كاملة (6 فئات، 36 سؤالاً) مع صورك الخاصة. بمجرد الشراء، يمكنك تشغيلها وقتما تشاء مع أصدقائك محلياً.' : 'This feature allows you to create a full session (6 categories, 36 questions) with your own photos. Once purchased, you can play it anytime with your friends locally.'}
              </p>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest bg-white text-black hover:scale-105 active:scale-95 transition-all"
            >
              {isRtl ? 'ابدأ التصميم الآن' : 'Start Designing Now'}
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2" initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
            className="max-w-2xl mx-auto space-y-10 text-center"
          >
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: 'var(--text-primary)' }}>
                {isRtl ? 'اسم الجلسة' : 'Session Name'}
              </label>
              <input 
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder={isRtl ? 'مثلاً: تحدي أصدقاء العمر...' : 'e.g., Lifelong Friends Challenge...'}
                className="w-full bg-transparent border-b-2 border-white/10 py-6 text-4xl font-black text-center focus:outline-none transition-all"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
            <button 
              disabled={!sessionName}
              onClick={() => setStep(3)}
              className="px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest bg-white text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
            >
              {isRtl ? 'تأكيد الاسم وبدء الفئات' : 'Confirm Name & Start Categories'}
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            <div className="lg:col-span-1 space-y-4">
               {categories.map((cat, idx) => (
                 <button 
                   key={idx}
                   onClick={() => setActiveCatIndex(idx)}
                   className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between ${activeCatIndex === idx ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 border-white/5 text-white/40'}`}
                   style={{ 
                     borderColor: activeCatIndex === idx ? 'transparent' : 'var(--border-subtle)',
                     backgroundColor: activeCatIndex === idx ? 'white' : 'var(--bg-input)'
                   }}
                 >
                   <span className="font-black">{cat.name || (isRtl ? `فئة ${idx + 1}` : `Category ${idx + 1}`)}</span>
                   {cat.image ? (
                     <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 shrink-0">
                       <img src={cat.image} className="w-full h-full object-cover" alt="" />
                     </div>
                   ) : (
                     <span className="text-xl">📷</span>
                   )}
                 </button>
               ))}
               {categories.length < 6 && (
                 <button 
                   onClick={addCategory}
                   className="w-full p-6 rounded-3xl border border-dashed text-white/20 hover:text-white/40 transition-all flex items-center justify-center gap-3"
                   style={{ borderColor: 'var(--border-subtle)' }}
                 >
                   <Icon.Plus size={18} />
                   <span className="text-xs font-black uppercase tracking-widest">{isRtl ? 'إضافة فئة' : 'Add Category'}</span>
                 </button>
               )}
            </div>

            <div className="lg:col-span-3 space-y-8">
               <div className="p-8 rounded-[2.5rem] border space-y-8" style={{ background: glass, borderColor: 'var(--border-subtle)' }}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                       <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--text-primary)' }}>
                          {isRtl ? 'اسم الفئة' : 'Category Name'}
                         </label>
                         <button onClick={() => suggestCategoryName(activeCatIndex)} className="text-[10px] font-bold text-[#D4AF37] hover:scale-105 flex items-center gap-1 transition-transform">
                           <Icon.Sparkles size={12} /> {isRtl ? 'اقتراح ذكي' : 'Smart Suggest'}
                         </button>
                       </div>
                       <input 
                        value={categories[activeCatIndex].name}
                        onChange={(e) => {
                          const n = [...categories]; n[activeCatIndex].name = e.target.value; setCategories(n)
                        }}
                        className="w-full bg-white/5 border rounded-2xl px-6 py-4 font-bold focus:outline-none"
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                        placeholder={isRtl ? 'مثلاً: ذكريات قديمة...' : 'e.g., Old Memories...'}
                       />
                    </div>


                    {/* Category Photo Upload */}
                    <div className="w-full md:w-32 space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--text-primary)' }}>
                        {isRtl ? 'صورة الفئة' : 'Photo'}
                       </label>
                       <div 
                         className="relative w-full h-[62px] rounded-2xl bg-white/5 border flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all overflow-hidden" 
                         style={{ borderColor: 'var(--border-subtle)' }}
                         onClick={() => {
                           const el = document.getElementById(`cat-upload-${activeCatIndex}`) as HTMLInputElement
                           if (el) el.click()
                         }}
                       >
                         <input 
                           id={`cat-upload-${activeCatIndex}`}
                           type="file" 
                           className="hidden" 
                           accept="image/*"
                           onChange={(e) => {
                             const file = e.target.files?.[0]
                             if (file) {
                               const reader = new FileReader()
                               reader.onloadend = () => {
                                 const n = [...categories]; n[activeCatIndex].image = reader.result as string; setCategories(n)
                               }
                               reader.readAsDataURL(file)
                             }
                           }}
                         />
                         {categories[activeCatIndex].image ? (
                           <img src={categories[activeCatIndex].image!} className="w-full h-full object-cover" />
                         ) : (
                           <Icon.Image size={20} className="opacity-40" style={{ color: 'var(--text-primary)' }} />
                         )}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--text-primary)' }}>
                      {isRtl ? 'الأسئلة (6 أسئلة مطلوبة)' : 'Questions (6 required)'}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categories[activeCatIndex].questions.map((q, qIdx) => (
                        <div key={qIdx} className="p-6 rounded-3xl bg-black/10 border border-white/5 space-y-4" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${q.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' : q.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                              {q.difficulty}
                            </span>
                            <button onClick={() => suggestQuestion(activeCatIndex, qIdx)} className="text-[10px] font-bold text-[#D4AF37] hover:scale-105 flex items-center gap-1 transition-transform">
                              <Icon.Sparkles size={12} /> {isRtl ? 'إكمال ذكي' : 'Auto-Fill'}
                            </button>
                          </div>
                          <textarea 
                            value={q.text}
                            onChange={(e) => updateQuestion(activeCatIndex, qIdx, 'text', e.target.value)}
                            placeholder={isRtl ? 'اكتب السؤال هنا...' : 'Write the question here...'}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium leading-relaxed resize-none h-16"
                            style={{ color: 'var(--text-primary)' }}
                          />
                          <input 
                            value={q.answer}
                            onChange={(e) => updateQuestion(activeCatIndex, qIdx, 'answer', e.target.value)}
                            placeholder={isRtl ? 'الإجابة الصحيحة...' : 'Correct answer...'}
                            className="w-full bg-white/5 border-none rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-[#D4AF37]/30"
                            style={{ color: 'var(--text-primary)' }}
                          />
                          <div 
                            className="flex items-center gap-3 pt-2 cursor-pointer group"
                            onClick={() => fileInputRefs.current[qIdx]?.click()}
                          >
                             <input 
                               type="file" 
                               className="hidden" 
                               accept="image/*"
                               ref={el => { fileInputRefs.current[qIdx] = el }}
                               onChange={(e) => {
                                 const file = e.target.files?.[0]
                                 if (file) {
                                   const reader = new FileReader()
                                   reader.onloadend = () => updateQuestion(activeCatIndex, qIdx, 'image', reader.result as string)
                                   reader.readAsDataURL(file)
                                 }
                               }}
                             />
                             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                                {q.image ? (
                                  <img src={q.image} className="w-full h-full object-cover" />
                                ) : (
                                  <Icon.Image size={16} className="opacity-30" style={{ color: 'var(--text-primary)' }} />
                                )}
                             </div>
                             <span className="text-[9px] font-bold opacity-20 uppercase tracking-widest group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                              {q.image ? (isRtl ? 'تغيير الصورة' : 'Change Image') : (isRtl ? 'إضافة صورة' : 'Add Image')}
                             </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
               
               <div className="flex justify-between items-center">
                  <button onClick={() => setStep(2)} className="px-8 py-4 rounded-2xl font-black text-xs opacity-40 hover:opacity-100 transition-all" style={{ color: 'var(--text-primary)' }}>
                    {isRtl ? 'الرجوع' : 'Back'}
                  </button>
                  <button 
                    onClick={() => setStep(4)} 
                    className="px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-[#D4AF37] text-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#D4AF37]/20"
                  >
                    {isRtl ? 'مراجعة الجلسة' : 'Review Session'}
                  </button>
               </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Final Review */}
        {step === 4 && (
          <motion.div 
            key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto p-12 rounded-[3.5rem] border relative overflow-hidden shadow-2xl"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at ${isRtl ? '0%' : '100%'} 0%, ${accentColor}, transparent)` }} />
            
            <div className="relative z-10 text-center space-y-10">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{sessionName}</h2>
                  <p className="font-bold tracking-widest uppercase text-[10px]" style={{ color: accentColor }}>
                    {isRtl ? 'جاهزة للنشر والحفظ' : 'Ready to Publish & Save'}
                  </p>
               </div>

               <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                 {categories.map((cat, i) => (
                   <div key={i} className="space-y-2">
                      <div className="w-full aspect-square rounded-2xl bg-white/5 border flex items-center justify-center text-2xl" style={{ borderColor: 'var(--border-subtle)' }}>{cat.icon}</div>
                      <p className="text-[10px] font-bold opacity-40 truncate" style={{ color: 'var(--text-primary)' }}>{cat.name}</p>
                   </div>
                 ))}
               </div>

               <div className="p-8 rounded-[2rem] bg-white/5 border text-left space-y-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black opacity-40 uppercase" style={{ color: 'var(--text-primary)' }}>{isRtl ? 'الإجمالي' : 'Total'}</span>
                    <span className="text-xl font-black" style={{ color: accentColor }}>{isRtl ? '٣٦ سؤالاً' : '36 Questions'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-40" style={{ color: 'var(--text-primary)' }}>
                    <span>{isRtl ? 'الوصول' : 'Access'}</span>
                    <span>{isRtl ? 'مجاني للأبد (محلي)' : 'Free Forever (Local)'}</span>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row gap-4">
                  <button onClick={() => setStep(3)} className="flex-1 py-5 rounded-2xl font-black text-sm uppercase bg-white/5 border hover:bg-white/10 transition-all" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                    {isRtl ? 'تعديل المحتوى' : 'Edit Content'}
                  </button>
                  <button 
                    onClick={async () => { 
                      if (categories.length !== 6) {
                        toast.error(isRtl ? 'يجب إنشاء 6 فئات بالضبط!' : 'You must create exactly 6 categories!')
                        return
                      }
                      for (const cat of categories) {
                        if (!cat.name) {
                          toast.error(isRtl ? 'يرجى تسمية جميع الفئات' : 'Please name all categories')
                          return
                        }
                        for (const q of cat.questions) {
                          if (!q.text) {
                            toast.error(isRtl ? `يرجى تعبئة جميع الأسئلة في فئة ${cat.name}` : `Please fill all questions in ${cat.name}`)
                            return
                          }
                        }
                      }
                      
                      setSaving(true)
                      const newId = `studio_${Date.now()}`
                      const newCreation = {
                        id: newId,
                        name: sessionName,
                        categories,
                        createdAt: new Date().toISOString()
                      }
                      
                      // Save to local IndexedDB (for player offline/local access)
                      const { saveCreation } = await import('@/lib/indexedDB')
                      await saveCreation(newCreation)
                      
                      // Also sync to Supabase for Admin Studio Section
                      try {
                        const { data: { session } } = await supabase.auth.getSession()
                        await supabase.from('studio_sessions').insert({
                          id: newId,
                          name: sessionName,
                          content: categories,
                          creator_id: session?.user?.id || null
                        })
                      } catch (err) {
                        console.error('Failed to sync studio session to cloud:', err)
                      }
                      
                      setTimeout(() => {
                        setSaving(false)
                        setStep(1)
                        setSessionName('')
                        setCategories([])
                        toast.success(isRtl ? 'تم حفظ الجلسة بنجاح!' : 'Session saved successfully!')
                      }, 1500)
                    }}
                    className="flex-1 py-5 rounded-2xl font-black text-sm uppercase bg-[#D4AF37] text-black hover:scale-[1.02] transition-all shadow-2xl shadow-[#D4AF37]/40"
                  >
                    {saving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'شراء وحفظ الجلسة ($4.99)' : 'Purchase & Save ($4.99)')}
                  </button>
               </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Saved Creations Section */}
      <CreationsLibrary isRtl={isRtl} lang={lang} />

    </div>
  )
}
