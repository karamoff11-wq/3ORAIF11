'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AdminStudioSessionsPage() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<any | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('studio_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      toast.error('Failed to load studio sessions')
    } else {
      setSessions(data || [])
    }
    setLoading(false)
  }

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this session?')) return

    const { error } = await supabase.from('studio_sessions').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete')
    } else {
      toast.success('Deleted successfully')
      setSessions(sessions.filter(s => s.id !== id))
      if (selectedSession?.id === id) setSelectedSession(null)
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text-primary">جلسات الاستوديو (الخاصة)</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>إدارة الجلسات التي قام اللاعبون بإنشائها عبر الاستوديو</p>
        </div>
        <Link href="/admin">
          <button className="px-6 py-2 rounded-xl bg-white/5 border font-bold hover:bg-white/10 transition-all" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            الرجوع للوحة القيادة
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List of Sessions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>الجلسات ({sessions.length})</h2>
             <button onClick={fetchSessions} className="text-sm opacity-50 hover:opacity-100">تحديث ↻</button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-dashed border-white/10 opacity-50">
              لا توجد جلسات استوديو حتى الآن.
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {sessions.map(session => (
                <motion.div
                  key={session.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedSession(session)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedSession?.id === session.id ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg truncate pr-4" style={{ color: 'var(--color-text-primary)' }}>{session.name}</h3>
                    <button onClick={(e) => deleteSession(session.id, e)} className="text-red-500 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all">✕</button>
                  </div>
                  <div className="flex justify-between items-center text-xs opacity-50" style={{ color: 'var(--color-text-primary)' }}>
                    <span>{session.content?.length || 0} فئات</span>
                    <span>{new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Session Details Viewer */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedSession ? (
              <motion.div
                key={selectedSession.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 rounded-[2.5rem] border bg-black/20 space-y-8"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div>
                  <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>{selectedSession.name}</h2>
                  <p className="text-sm opacity-50 font-mono">ID: {selectedSession.id}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedSession.content || []).map((cat: any, i: number) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                          {cat.image ? <img src={cat.image} className="w-full h-full object-cover" /> : cat.icon}
                        </div>
                        <h3 className="font-bold text-lg truncate" style={{ color: 'var(--color-text-primary)' }}>{cat.name}</h3>
                      </div>
                      <div className="space-y-2">
                        {cat.questions?.map((q: any, qIdx: number) => (
                          <div key={qIdx} className="p-3 rounded-xl bg-black/20 text-xs space-y-1">
                            <div className="flex gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${q.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' : q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                {q.difficulty}
                              </span>
                              <span className="font-medium opacity-80">{q.text}</span>
                            </div>
                            <div className="text-[#D4AF37] font-bold pr-8">← {q.answer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[50vh] flex items-center justify-center text-center p-8 rounded-[2.5rem] border border-dashed bg-white/5 opacity-50" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <div className="text-6xl mb-4">🎭</div>
                  <h3 className="text-xl font-bold mb-2">اختر جلسة لعرض محتواها</h3>
                  <p className="text-sm">هنا يتم عرض الجلسات الخاصة التي قام اللاعبون بإنشائها بشكل مستقل.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
