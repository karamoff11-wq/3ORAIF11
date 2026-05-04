'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

import { useFeedbackStore } from '@/store/feedbackStore'

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url?.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function AdminFeedbackPage() {
  const { 
    comments, toggleVisibility, deleteComment, 
    videoUrl, setVideoUrl, 
    logoUrl, setLogoUrl,
    accentColor, setAccentColor, roadmapNodes, setRoadmapNodes 
  } = useFeedbackStore()
  const [urlInput, setUrlInput] = useState(videoUrl)
  const [logoInput, setLogoInput] = useState(logoUrl)

  // Sync inputs with store when it hydrates
  useEffect(() => {
    setUrlInput(videoUrl)
    setLogoInput(logoUrl)
  }, [videoUrl, logoUrl])

  return (
    <div className="min-h-screen bg-[#07071A] text-white p-8 font-sans" style={{ direction: 'rtl' }}>
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black mb-3 tracking-tight">إدارة الهوية البصرية</h1>
            <p className="text-white/40 text-sm">تحكم في الشعار، الفيديو، وآراء اللاعبين على المنصة</p>
          </div>
          <Link href="/admin" className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2">
            <span>العودة للوحة التحكم</span>
            <span>🏠</span>
          </Link>
        </header>

        {/* ── Logo Management ── */}
        <section className="mb-12 p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">✨</span>
            <h2 className="text-xl font-bold">شعار المنصة (Logo)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-xs text-white/40 leading-relaxed">أدخل رابط صورة الشعار (PNG, SVG, GIF). إذا تركت الحقل فارغاً، سيتم استخدام الشعار الافتراضي الذكي للمنصة.</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={logoInput}
                  onChange={(e) => setLogoInput(e.target.value)}
                  placeholder="https://example.com/logo.svg"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                />
                <button 
                  onClick={() => setLogoUrl(logoInput)}
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-xs font-black hover:bg-emerald-500 transition-all active:scale-95"
                >
                  تحديث الشعار
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-8 p-6 rounded-2xl bg-black/40 border border-white/5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 mb-2 flex items-center justify-center overflow-hidden">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" /> : <span className="text-white/20 text-xs italic">لا يوجد</span>}
                </div>
                <span className="text-[10px] text-white/40 uppercase font-black">الشعار الحالي</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] mb-2"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, #3B82F6)` }}>A</div>
                <span className="text-[10px] text-white/40 uppercase font-black">الاحتياطي</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Accent Color Management ── */}
        <section className="mb-12 p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🎨</span>
            <h2 className="text-xl font-bold">اللون الأساسي (Global Accent)</h2>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {[
              { name: 'بنفسجي', hex: '#8B5CF6' },
              { name: 'زمردي', hex: '#10B981' },
              { name: 'ذهبي', hex: '#F59E0B' },
              { name: 'وردي', hex: '#F43F5E' },
              { name: 'سماوي', hex: '#0EA5E9' }
            ].map((c) => (
              <button
                key={c.hex}
                onClick={() => setAccentColor(c.hex)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
                  accentColor === c.hex ? 'bg-white/10 border-white/40' : 'bg-white/2 border-white/5'
                }`}
              >
                <div 
                  className="w-5 h-5 rounded-full shadow-lg" 
                  style={{ background: c.hex, boxShadow: `0 0 15px ${c.hex}60` }}
                />
                <span className={`text-xs font-bold ${accentColor === c.hex ? 'text-white' : 'text-white/40'}`}>{c.name}</span>
                {accentColor === c.hex && <span className="text-[10px]">✅</span>}
              </button>
            ))}
          </div>
          <p className="mt-6 text-[10px] text-white/30 italic">سيتم تطبيق هذا اللون على جميع التدرجات، الإضاءات، والأزرار في المنصة بشكل تلقائي.</p>
        </section>

        {/* ── Video Management ── */}
        <section className="mb-16 p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🎬</span>
            <h2 className="text-xl font-bold">فيديو الشرح (How to Play)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-xs text-white/40 leading-relaxed">أدخل رابط فيديو الشرح. يمكنك استخدام روابط MP4 مباشرة أو روابط YouTube.</p>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 leading-tight">
                ℹ️ ملاحظة: ندعم الآن روابط YouTube! سيتم عرض الفيديو في الخلفية بشكل تلقائي وبدون صوت ليناسب تصميم "Pure Void".
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                />
                <button 
                  onClick={() => setVideoUrl(urlInput)}
                  className="px-6 py-3 rounded-xl bg-purple-600 text-xs font-black hover:bg-purple-500 transition-all active:scale-95"
                >
                  حفظ الرابط
                </button>
              </div>
              {urlInput !== videoUrl && (
                <p className="text-[10px] text-amber-400 font-bold animate-pulse">⚠️ يوجد تغييرات غير محفوظة</p>
              )}
            </div>
            
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
              {(() => {
                const ytId = getYouTubeId(videoUrl)
                if (ytId) {
                  return (
                    <iframe 
                      key={ytId}
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&rel=0`}
                      className="w-[200%] h-[200%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 grayscale pointer-events-none"
                    />
                  )
                }
                return (
                  <video key={videoUrl} autoPlay loop muted className="w-full h-full object-cover opacity-60">
                    <source src={videoUrl} type="video/mp4" />
                  </video>
                )
              })()}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase tracking-widest font-black bg-black/60 px-3 py-1 rounded-full border border-white/10 z-10">معاينة مباشرة</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── ROADMAP MANAGEMENT ── */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">🗺️ إدارة خارطة الطريق</h2>
              <p className="text-white/40 text-sm">حدد معالم المشروع ومستقبل المنصة</p>
            </div>
            <button 
              onClick={() => setRoadmapNodes([...roadmapNodes, { label: 'معلم جديد', desc: 'وصف المعلم', x: 50, y: 50, completed: false }])}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all"
            >
              + إضافة مرحلة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roadmapNodes.map((node, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 relative group">
                <button 
                  onClick={() => setRoadmapNodes(roadmapNodes.filter((_, idx) => idx !== i))}
                  className="absolute top-4 left-4 w-8 h-8 rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white"
                >
                  ✕
                </button>
                <div className="space-y-4">
                  <input 
                    value={node.label}
                    onChange={(e) => {
                      const newNodes = [...roadmapNodes]
                      newNodes[i].label = e.target.value
                      setRoadmapNodes(newNodes)
                    }}
                    className="w-full bg-transparent border-b border-white/10 pb-2 text-white font-bold focus:border-purple-500 transition-colors"
                    placeholder="اسم المرحلة"
                  />
                  <textarea 
                    value={node.desc}
                    onChange={(e) => {
                      const newNodes = [...roadmapNodes]
                      newNodes[i].desc = e.target.value
                      setRoadmapNodes(newNodes)
                    }}
                    className="w-full bg-transparent border border-white/5 rounded-xl p-3 text-white/60 text-xs focus:border-purple-500 transition-colors"
                    rows={2}
                    placeholder="وصف مختصر للمرحلة"
                  />
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 block mb-1">X Pos (%)</label>
                      <input type="number" value={node.x} onChange={(e) => {
                        const n = [...roadmapNodes]; n[i].x = Number(e.target.value); setRoadmapNodes(n)
                      }} className="w-full bg-white/5 border border-white/5 rounded-lg p-2 text-white text-xs" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 block mb-1">Y Pos (%)</label>
                      <input type="number" value={node.y} onChange={(e) => {
                        const n = [...roadmapNodes]; n[i].y = Number(e.target.value); setRoadmapNodes(n)
                      }} className="w-full bg-white/5 border border-white/5 rounded-lg p-2 text-white text-xs" />
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={() => {
                          const n = [...roadmapNodes]; n[i].completed = !n[i].completed; setRoadmapNodes(n)
                        }}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                          node.completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                      >
                        {node.completed ? 'تم الإنجاز ✓' : 'قيد العمل'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-3 mb-8">
          <span className="text-2xl">💬</span>
          <h2 className="text-xl font-bold">إدارة تعليقات اللاعبين ({comments.length})</h2>
        </div>

        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {comments.map((c) => (
              <motion.div 
                key={c.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:border-white/20"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-black text-lg text-purple-400">{c.name}</span>
                    <span className="text-[10px] text-white/20 uppercase tracking-widest">{c.date}</span>
                    <div className="flex gap-2 mr-auto md:mr-0">
                      {c.visible ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black">ظاهر للعامة</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black">انتظار المراجعة</span>
                      )}
                    </div>
                  </div>
                  <p className="text-white/60 leading-relaxed text-base font-medium">"{c.text}"</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => toggleVisibility(c.id)}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all border ${
                      c.visible 
                      ? 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20 hover:bg-zinc-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    {c.visible ? 'إخفاء التعليق' : 'تفعيل العرض'}
                  </button>
                  <button 
                    onClick={() => deleteComment(c.id)}
                    className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {comments.length === 0 && (
            <div className="py-20 text-center rounded-[2rem] border-2 border-dashed border-white/5">
              <p className="text-white/20 font-black">لا توجد تعليقات حالياً</p>
            </div>
          )}
        </div>

        <footer className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/10 uppercase tracking-[0.3em]">نظام إدارة المحتوى — العُريف 2026</p>
        </footer>
      </div>
    </div>
  )
}

