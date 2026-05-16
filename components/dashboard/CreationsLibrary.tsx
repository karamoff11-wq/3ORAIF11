'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'

interface Category {
  name: string
  image?: string | null
  questions: any[]
}

interface Creation {
  id: string
  name: string
  categories: Category[]
  createdAt: string
}

export default function CreationsLibrary({ isRtl, lang }: { isRtl: boolean, lang: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [creations, setCreations] = useState<Creation[]>([])
  const [launching, setLaunching] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { getAllCreations } = await import('@/lib/indexedDB')
      const data = await getAllCreations()
      // Sort by newest first
      setCreations((data as any[]).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    }
    load()
  }, [])

  const handlePlay = async (creation: Creation) => {
    setLaunching(creation.id)
    const tid = toast.loading(isRtl ? 'جاري بدء اللعبة...' : 'Launching game...')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      // 1. Create a session
      const session = await gameEngine.createSession(user.id, 'local')
      
      // 2. Set Name & Auto-create 2 default teams
      await Promise.all([
        (supabase.from('sessions') as any).update({ name: creation.name }).eq('id', session.id),
        (supabase.from('teams') as any).insert([
          { session_id: session.id, name: isRtl ? 'الفريق 1' : 'Team 1', color: '#8B5CF6', score: 0 },
          { session_id: session.id, name: isRtl ? 'الفريق 2' : 'Team 2', color: '#EC4899', score: 0 }
        ])
      ])

      // 3. Inject Studio Questions directly
      await gameEngine.generateQuestions(session.id, creation)
      
      // 4. Start Session
      await gameEngine.startGame(session.id)
      
      // 5. Direct Redirect to Game Board (Skip Setup)
      router.push(`/game/${session.id}`)
      
      toast.success(isRtl ? 'استمتع باللعب!' : 'Enjoy the game!', { id: tid })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message, { id: tid })
      setLaunching(null)
    }
  }

  if (creations.length === 0) return null

  return (
    <motion.section 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pt-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            {isRtl ? 'مكتبة إبداعاتك' : 'Your Creation Library'}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30" style={{ color: 'var(--text-secondary)' }}>
            {isRtl ? 'الجلسات التي قمت بتصميمها في الاستوديو' : 'Sessions designed in the Studio'}
          </p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/studio')}
          className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          {isRtl ? 'فتح الاستوديو' : 'Open Studio'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creations.map((creation) => (
          <div 
            key={creation.id}
            className="p-8 rounded-[3rem] border group hover:scale-[1.02] transition-all relative overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                 style={{ background: `radial-gradient(circle at center, var(--accent-primary), transparent 70%)` }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex -space-x-3">
                  {creation.categories.slice(0, 3).map((cat, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--bg-card)] bg-white/5 flex items-center justify-center text-sm shadow-xl overflow-hidden">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>📷</span>
                      )}
                    </div>
                  ))}
                  {creation.categories.length > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-[var(--bg-card)] bg-white/5 flex items-center justify-center text-[8px] font-black shadow-xl">
                      +{creation.categories.length - 3}
                    </div>
                  )}
                </div>
                <button 
                  onClick={async () => {
                    const { deleteCreation } = await import('@/lib/indexedDB')
                    await deleteCreation(creation.id)
                    setCreations(creations.filter(c => c.id !== creation.id))
                  }}
                  className="text-[10px] font-black opacity-20 hover:opacity-100 hover:text-red-500 transition-all uppercase tracking-widest"
                >
                  {isRtl ? 'حذف' : 'Delete'}
                </button>
              </div>

              <h3 className="text-xl font-black mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{creation.name}</h3>
              <p className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em] mb-8" style={{ color: 'var(--text-secondary)' }}>
                {creation.categories.length} {isRtl ? 'فئات' : 'Categories'} • {new Date(creation.createdAt).toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US')}
              </p>

              <button 
                disabled={launching === creation.id}
                onClick={() => handlePlay(creation)}
                className="w-full py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
              >
                {launching === creation.id ? (isRtl ? 'جاري التحميل...' : 'Launching...') : (isRtl ? 'ابدأ اللعب الآن' : 'Play Now')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
