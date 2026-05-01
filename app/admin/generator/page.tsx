'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export default function AdminGeneratorPage() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const supabase = createClient()

  const loadData = async () => {
    setIsLoading(true)
    // Fetch categories with topic info and difficulty breakdown
    const { data: categories } = await (supabase.from('categories') as any).select(`
      id,
      name,
      topics (name, color),
      questions (id, difficulty)
    `)
    
    setData(categories || [])
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleGenerate = async (cat: any) => {
    setGeneratingId(cat.id)
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: 'pre-seed', // Used for admin pre-seeding
          teams: 2, // Default for generation batch
          categories: [cat.id, cat.id, cat.id, cat.id, cat.id, cat.id] // Batch for this category
        })
      })
      
      const result = await res.json()
      if (res.ok) {
        toast.success(result.message || `تم توليد ${result.count} سؤال للفئة: ${cat.name}`)
        loadData()
      } else {
        throw new Error(result.error || 'فشل التوليد')
      }
    } catch (error: any) {
      toast.error('خطأ: ' + error.message)
    } finally {
      setGeneratingId(null)
    }
  }

  if (isLoading) return <div className="p-12 text-center loud-label">جاري فحص النظام...</div>

  const getHealthStatus = (count: number) => {
    if (count === 0) return { label: 'فارغ 🔴', color: '#ff4444' }
    if (count < 20) return { label: 'حرج ⚠️', color: '#ffbb33' }
    if (count < 50) return { label: 'جيد 🟡', color: '#ffff00' }
    return { label: 'صحي 🟢', color: '#00C851' }
  }

  return (
    <div className="p-8 md:p-12 min-h-screen relative z-10 max-w-7xl mx-auto">
      <header className="mb-16 border-b border-white/5 pb-8">
        <p className="loud-label text-primary-light mb-2 tracking-[0.2em]">مختبر المحتوى الآلي</p>
        <h1 className="text-5xl font-black text-white">مولّد الأسئلة الذكي</h1>
        <p className="text-white/40 mt-4 max-w-2xl font-medium">
          قم بتوليد الأسئلة أوتوماتيكياً لكل فئة باستخدام الذكاء الاصطناعي. يقوم النظام بإنتاج وجبات من الأسئلة الموزعة حسب الصعوبة.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((cat) => {
          const questions = cat.questions || []
          const easy = questions.filter((q: any) => q.difficulty === 'easy').length
          const medium = questions.filter((q: any) => q.difficulty === 'medium').length
          const hard = questions.filter((q: any) => q.difficulty === 'hard').length
          const health = getHealthStatus(questions.length)

          return (
            <div key={cat.id} className="glass-strong p-6 rounded-2xl flex flex-col justify-between border-white/5 hover:border-white/20 transition-all group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="loud-label px-2 py-1 rounded border border-white/5 bg-white/5 text-[10px]" style={{ color: cat.topics?.color }}>
                    {cat.topics?.name}
                  </span>
                  <span className="font-bold text-[11px]" style={{ color: health.color }}>{health.label}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">{cat.name}</h3>
                
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-white/40 mb-1">سهل</p>
                    <p className="font-mono font-bold text-green-400">{easy}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-white/40 mb-1">متوسط</p>
                    <p className="font-mono font-bold text-yellow-400">{medium}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-white/40 mb-1">صعب</p>
                    <p className="font-mono font-bold text-red-400">{hard}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleGenerate(cat)}
                disabled={generatingId !== null}
                className={`w-full py-4 rounded-xl font-bold transition-all relative overflow-hidden flex items-center justify-center gap-3 ${
                  generatingId === cat.id 
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {generatingId === cat.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    {questions.length === 0 ? 'توليد أولي' : 'توليد المزيد'}
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

