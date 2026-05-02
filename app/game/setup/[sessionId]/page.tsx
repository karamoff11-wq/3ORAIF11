'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import { useSession } from '@/hooks/useSession'
import FightingParticles from '@/components/FightingParticles'
import Mascot from '@/components/Mascot'
import toast from 'react-hot-toast'
import Image from 'next/image'

const TEAM_COLORS = ['#FF3B3B', '#3B82F6', '#A855F7', '#22C55E']

const TOPIC_VIDEOS: Record<string, string> = {
  'topic-geography': 'https://cdn.pixabay.com/video/2016/11/20/6447-192534572_large.mp4',
  'topic-science': 'https://cdn.pixabay.com/video/2020/05/25/40149-425102559_large.mp4',
  'topic-economy': 'https://cdn.pixabay.com/video/2019/04/15/22754-330691535_large.mp4',
  'topic-football': 'https://cdn.pixabay.com/video/2019/08/13/25983-353455115_large.mp4',
  'topic-general': 'https://cdn.pixabay.com/video/2020/12/15/60699-498565551_large.mp4',
  'topic-movies': 'https://cdn.pixabay.com/video/2022/02/19/108154-679141018_large.mp4',
  'topic-tvshows': 'https://cdn.pixabay.com/video/2017/04/20/8883-213506141_large.mp4',
  'topic-anime': 'https://cdn.pixabay.com/video/2023/10/22/185850-876378514_large.mp4',
  'topic-videogames': 'https://cdn.pixabay.com/video/2021/09/11/88079-603126742_large.mp4',
  'topic-whoami': 'https://cdn.pixabay.com/video/2021/08/17/85375-589632490_large.mp4'
}

function TopicSkeleton() {
  return (
    <div className="w-full h-screen relative flex flex-col items-center justify-center bg-[#050505] animate-pulse">
      <div className="w-64 h-12 bg-white/10 rounded-full mb-12" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-8 w-full max-w-6xl">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

function CategoryCard({ cat, topic, isSelected, isMaxReached, toggleCategory, isAdjacent }: { 
  cat: any, 
  topic: any, 
  isSelected: boolean, 
  isMaxReached: boolean, 
  toggleCategory: (id: string) => void,
  isAdjacent: boolean
}) {
  const crop = cat.crop_config?.cat_setup
  const zoom = crop?.zoom ?? 1
  const x = crop?.x ?? 50
  const y = crop?.y ?? 50
  
  return (
    <button
      onClick={() => toggleCategory(cat.id)}
      disabled={isMaxReached}
      className={`w-full aspect-[3/4] rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 group ${
        isSelected
          ? 'border border-white/30'
          : isMaxReached
            ? 'bg-black/20 border border-white/5 opacity-40 cursor-not-allowed'
            : 'bg-black/30 border border-white/10 hover:bg-white/10 hover:border-white/30 hover:-translate-y-1'
      }`}
      style={isSelected ? { borderColor: topic.color || '#fff', boxShadow: `0 0 20px ${topic.color || '#fff'}25`, background: `${topic.color || '#fff'}10` } : {}}
    >
      {cat.image_url && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-35">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cat.image_url}
            alt={cat.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{
              objectPosition: `${x}% ${y}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${x}% ${y}%`
            }}
            loading="lazy"
          />
        </div>
      )}
      <div className="relative z-10">
        <h3 className="font-black text-xl leading-tight text-white drop-shadow-md">{cat.name}</h3>
      </div>
    </button>
  )
}

export default function GameSetupPage() {
  const { sessionId } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { selectCategories, generateQuestions } = useSession()
  
  const [sessionName, setSessionName] = useState('جلسة الأصدقاء')
  const [topics, setTopics] = useState<any[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [teams, setTeams] = useState<{name: string, color: string}[]>([
    { name: 'الفريق الأول', color: '#FF3B3B' },
    { name: 'الفريق الثاني', color: '#3B82F6' }
  ])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'alpha'|'popular'|'new'|'admin'>('admin')

  useEffect(() => {
    async function loadData() {
      const [topicsRes, catsRes, sessionRes] = await Promise.all([
        (supabase.from('topics') as any).select('*').order('order_index'),
        (supabase.from('categories') as any).select('*'),
        (supabase.from('sessions') as any).select('*').eq('id', sessionId).single()
      ])
      
      let rawTopics = topicsRes.data || []
      let rawCats = catsRes.data || []
      if (sessionRes.data?.name && sessionRes.data.name !== 'Game Session') {
        setSessionName(sessionRes.data.name)
      }

      if (rawTopics.length === 0) {
        rawTopics = [
          { id: 'topic-geography', name: 'جغرافيا', icon: '🌍', color: '#10b981', created_at: '2023-01-01' },
          { id: 'topic-science', name: 'علوم', icon: '🔬', color: '#3b82f6', created_at: '2023-01-02' }
        ]
        rawCats = [
          { id: 'cat-capitals', topic_id: 'topic-geography', name: 'عواصم', icon: '🏛️' },
          { id: 'cat-physics', topic_id: 'topic-science', name: 'فيزياء', icon: '⚡' }
        ]
      }

      const mergedTopics = rawTopics.map((topic: any) => {
        let cats = rawCats.filter((c: any) => c.topic_id === topic.id)
        return { ...topic, categories: cats, video_url: topic.video_url || TOPIC_VIDEOS[topic.id] }
      })

      setTopics(mergedTopics)
      setIsLoading(false)
    }
    loadData()
  }, [sessionId, supabase])

  const filteredTopics = useMemo(() => {
    let filtered = topics.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.categories?.some((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    if (sortBy === 'alpha') filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'))
    else if (sortBy === 'new') filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    else if (sortBy === 'popular') filtered.sort((a, b) => (b.categories?.length || 0) - (a.categories?.length || 0))
    else if (sortBy === 'admin') filtered.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    return filtered
  }, [topics, searchQuery, sortBy])

  const selectedCatObjects = useMemo(() => {
    const allCats = topics.flatMap(t => t.categories || [])
    return selectedCategories.map(id => allCats.find((c: any) => c.id === id)).filter(Boolean)
  }, [topics, selectedCategories])

  // Removed manual handleScroll to prevent layout thrashing

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(prev => prev.filter(c => c !== id))
    } else {
      if (selectedCategories.length >= 6) { toast.error('يمكنك اختيار 6 فئات بحد أقصى'); return }
      setSelectedCategories(prev => [...prev, id])
    }
  }

  const handleStartGame = async () => {
    if (selectedCategories.length === 0) { toast.error('يرجى اختيار فئة واحدة على الأقل'); return }
    if (!sessionName.trim()) { toast.error('يرجى إدخال اسم الجلسة'); return }
    setIsStarting(true)
    try {
      await (supabase.from('sessions') as any).update({ name: sessionName }).eq('id', sessionId)
      await (supabase.from('teams') as any).delete().eq('session_id', sessionId)
      for (const team of teams) {
        await (supabase.from('teams') as any).insert({ session_id: sessionId as string, name: team.name, color: team.color, score: 0 })
      }
      await selectCategories(sessionId as string, selectedCategories)
      await generateQuestions(sessionId as string)
      await gameEngine.startGame(sessionId as string)
      toast.success('تبدأ اللعبة الآن!')
      router.push(`/game/${sessionId}`)
    } catch (error: any) {
      toast.error('خطأ في إعداد اللعبة: ' + error.message)
    } finally {
      setIsStarting(false)
    }
  }

  const scrollToSection = (index: number) => {
    if (!containerRef.current) return
    const section = containerRef.current.querySelector(`[data-index="${index}"]`) as HTMLElement
    if (section) {
      containerRef.current.scrollTo({ top: section.offsetTop, behavior: 'smooth' })
    }
  }

  const totalSections = filteredTopics.length + 2
  const isOnTeamsSection = activeIndex === totalSections - 1

  // Use IntersectionObserver instead of onScroll for better performance
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const sections = Array.from(container.querySelectorAll('.scroll-section'))
    
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            setActiveIndex(index)
            setIsAtBottom(index === totalSections - 1)
          }
        })
      },
      {
        root: container,
        rootMargin: '-40% 0px -40% 0px', // Trigger when element takes up middle 20% of viewport
        threshold: 0
      }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [filteredTopics.length, totalSections])

  if (isLoading) return (
    <div className="min-h-screen bg-black overflow-hidden" dir="rtl">
      <TopicSkeleton />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden font-sans select-none" dir="rtl">

      {/* ── Selected Categories Sidebar ── */}
      <div
        className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2 bg-[#0a0a0a]/90 border border-white/10 rounded-2xl shadow-2xl transition-all duration-500 overflow-hidden"
        style={{
          width: '220px',
          padding: '16px',
          opacity: isOnTeamsSection ? 0 : 1,
          pointerEvents: isOnTeamsSection ? 'none' : 'auto',
          transform: `translateY(-50%) translateX(${isOnTeamsSection ? '-20px' : '0px'})`
        }}
      >
        <p className="font-bold text-xs text-white/50 pb-2 border-b border-white/5 shrink-0">
          الفئات المختارة ({selectedCategories.length}/6)
        </p>
        {selectedCatObjects.length === 0 ? (
          <p className="text-white/25 text-xs">لم يتم اختيار أي فئة بعد.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {selectedCatObjects.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                <button
                  onClick={() => {
                    const tIdx = topics.findIndex(t => t.id === c.topic_id)
                    if (tIdx !== -1) scrollToSection(tIdx + 1)
                  }}
                  className="flex items-center gap-1.5 min-w-0 flex-1 hover:text-white transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-white/60 truncate">{c.name}</span>
                </button>
                <button
                  onClick={() => toggleCategory(c.id)}
                  className="flex-shrink-0 w-4 h-4 rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center text-[10px] transition-colors"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Scroll FAB ── */}
      <button
        onClick={() => {
          if (!containerRef.current) return
          if (isOnTeamsSection || isAtBottom) {
            scrollToSection(0)
          } else {
            scrollToSection(activeIndex + 1)
          }
        }}
        className="fixed left-8 bottom-8 z-50 w-12 h-12 rounded-full bg-black/80 border border-white/20 text-white/80 flex items-center justify-center hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-xl"
      >
        <span
          className="text-xl pointer-events-none transition-transform duration-500"
          style={{ transform: (isOnTeamsSection || isAtBottom) ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >↓</span>
      </button>

      {/* ── Scroll Container ── */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto hide-scrollbar relative"
      >

        {/* ── Section 0: Hero & Search ── */}
        <section data-index={0} className="scroll-section w-full h-screen relative flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[#050505]" />
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/20 rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#000_100%)] opacity-80" />
          </div>
          <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center text-center">
            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}
              className="text-6xl md:text-8xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500"
            >إعداد اللعبة</motion.h1>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-white/60 mb-12 max-w-2xl leading-relaxed"
            >اختر المواضيع والفئات لبناء تجربة التحدي المثالية.</motion.p>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-3xl p-6"
            >
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن موضوع أو فئة..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-50">🔍</span>
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {[
                    { key: 'admin', label: '🎯 الترتيب الأصلي', active: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
                    { key: 'alpha', label: '🔤 أبجدي', active: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
                    { key: 'popular', label: '🔥 الأكثر شعبية', active: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
                    { key: 'new', label: '✨ الأحدث', active: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' },
                  ].map(btn => (
                    <button key={btn.key} onClick={() => setSortBy(btn.key as any)}
                      className={`px-4 py-2 rounded-xl text-sm transition-all ${sortBy === btn.key ? btn.active : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                    >{btn.label}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Topic Sections ── */}
        {filteredTopics.map((topic, i) => {
          const sectionIndex = i + 1
          const isActive = sectionIndex === activeIndex
          const isAdjacent = Math.abs(sectionIndex - activeIndex) <= 1

          return (
            <section
              key={topic.id}
              data-index={sectionIndex}
              className="scroll-section w-full relative border-b-2 border-white/30"
            >
              {/* Background */}
              <div className={`absolute inset-0 pointer-events-none overflow-hidden ${topic.bg_style || 'bg-gradient-to-br from-gray-900 to-black'}`}>
                {topic.video_url && isAdjacent && (() => {
                  const crop = topic.crop_config?.topic_bg
                  const zoom = crop?.zoom ?? 1
                  const x = crop?.x ?? 50
                  const y = crop?.y ?? 50
                  return (
                    <video
                      src={topic.video_url}
                      autoPlay loop muted playsInline
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: `${x}% ${y}%`,
                        transform: `scale(${zoom})`,
                        transformOrigin: `${x}% ${y}%`,
                        opacity: 0.55,
                      }}
                    />
                  )
                })()}
                <div className="absolute inset-0 bg-black/70" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-90" />
              </div>

              {/* Topic header — always at top, full width */}
              <div className="relative z-10 pt-[30vh] pb-[15vh] text-center lg:pl-64">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                  {topic.name}
                </h2>
              </div>

              {/* Categories — all visible, no inner scroll */}
              <div className="relative z-10 lg:pl-64 px-8 pb-[30vh]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" dir="rtl">
                  {topic.categories?.map((cat: any) => (
                    <CategoryCard 
                      key={cat.id}
                      cat={cat}
                      topic={topic}
                      isSelected={selectedCategories.includes(cat.id)}
                      isMaxReached={selectedCategories.length >= 6 && !selectedCategories.includes(cat.id)}
                      toggleCategory={toggleCategory}
                      isAdjacent={isAdjacent}
                    />
                  ))}
                  {(!topic.categories || topic.categories.length === 0) && (
                    <div className="col-span-full text-center text-white/20 text-sm py-12">لا توجد فئات هنا</div>
                  )}
                </div>
              </div>
            </section>
          )
        })}

        {/* ── Teams & Launch Section ── */}
        <section data-index={totalSections - 1} className="scroll-section w-full min-h-screen relative flex flex-col items-center justify-center py-20 overflow-hidden bg-[#050505]">
          <FightingParticles teams={teams} mode="setup" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)] pointer-events-none" />

          <div className="relative z-10 w-full flex flex-col items-center px-6" style={{ maxWidth: '900px' }}>

            {/* Session Name */}
            <div className="text-center mb-8 w-full">
              <p className="text-white/30 text-xs mb-2">الخطوة الأخيرة</p>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-2xl py-3 px-6 text-center text-3xl md:text-4xl font-black text-white placeholder-white/20 w-full max-w-lg focus:outline-none focus:bg-[#111] transition-colors"
                placeholder="اسم الجلسة"
              />
            </div>

            {/* Teams Grid */}
            <div className="w-full mb-8">
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${Math.min(teams.length + (teams.length < 4 ? 1 : 0), 4)}, minmax(0, 1fr))` }}
              >
                <AnimatePresence>
                  {teams.map((team, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-[#111] border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3 relative hover:bg-[#1a1a1a] transition-all"
                    >
                      {/* Delete button */}
                      {teams.length > 2 && (
                        <button
                          onClick={() => setTeams(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/30 text-white/30 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center text-[10px] transition-colors"
                        >✕</button>
                      )}

                      {/* Mascot */}
                      <Mascot state="idle" size={52} color={team.color} />

                      {/* Team name */}
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => {
                          const n = [...teams]; n[idx].name = e.target.value; setTeams(n)
                        }}
                        className="w-full bg-transparent border-b border-white/10 py-1 text-base font-bold text-center text-white outline-none focus:border-white/40 transition-colors placeholder-white/20"
                        placeholder={`الفريق ${idx + 1}`}
                      />

                      {/* Color dots */}
                      <div className="flex gap-2 justify-center">
                        {TEAM_COLORS.map(c => {
                          const active = team.color === c
                          return (
                            <button
                              key={c}
                              onClick={() => { const n = [...teams]; n[idx].color = c; setTeams(n) }}
                              className="w-5 h-5 rounded-full transition-all"
                              style={{
                                backgroundColor: c,
                                outline: active ? `2px solid white` : '2px solid transparent',
                                outlineOffset: '1px',
                                boxShadow: active ? `0 0 8px ${c}` : 'none',
                                transform: active ? 'scale(1.2)' : 'scale(1)',
                              }}
                            />
                          )
                        })}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {teams.length < 4 && (
                  <button
                    onClick={() => setTeams(prev => [...prev, { name: `الفريق ${prev.length + 1}`, color: TEAM_COLORS[prev.length % TEAM_COLORS.length] }])}
                    className="border border-dashed border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-white/25 hover:text-white/60 hover:border-white/30 hover:bg-white/[0.03] transition-all min-h-[160px]"
                  >
                    <span className="text-3xl font-light">+</span>
                    <span className="text-xs">إضافة فريق</span>
                  </button>
                )}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              disabled={isStarting || selectedCategories.length === 0}
              className="px-14 py-4 rounded-full bg-white text-black font-black text-xl tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.25)] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isStarting ? 'جاري التجهيز...' : 'ابدأ اللعبة 🚀'}
            </button>
          </div>
        </section>

      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
