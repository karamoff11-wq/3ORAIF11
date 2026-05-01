'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'

export interface Category {
  id: string
  name: string
  icon?: string
  topic_id?: string
  questionCount?: number
  video_url?: string
}

export interface Topic {
  id: string
  name: string
  icon?: string
  color?: string
  video_url?: string
  categories?: Category[]
}

interface TopicSelectorProps {
  topics: Topic[]
  setTopics: (topics: Topic[]) => void
  selectedCategories: string[]
  onToggleCategory: (id: string) => void
  maxSelections?: number
  searchQuery?: string
}

export default function TopicSelector({ topics, setTopics, selectedCategories, onToggleCategory, maxSelections = 6, searchQuery = '' }: TopicSelectorProps) {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {}
    topics.forEach(t => { initialExpanded[t.id] = true })
    setExpandedTopics(initialExpanded)
  }, [topics])

  const toggleTopic = (id: string) => {
    setExpandedTopics(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter topics based on search query
  const filteredTopics = topics.filter(t => {
    if (!searchQuery) return true
    const matchTopic = t.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = t.categories?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchTopic || matchCategory
  })

  // We only reorder the displayed topics. To make it simple and safe, we can just let framer-motion reorder the filtered list.
  // But wait, reordering filtered lists can be tricky. Let's assume reorder is mainly used when search is empty.
  const handleReorder = (newOrder: Topic[]) => {
    if (searchQuery) return // Disable reorder while searching
    setTopics(newOrder)
  }

  return (
    <div className="space-y-6 w-full">
      <Reorder.Group axis="y" values={searchQuery ? filteredTopics : topics} onReorder={handleReorder} className="space-y-6">
        {filteredTopics.map((topic) => {
          const isExpanded = expandedTopics[topic.id]
          const categories = topic.categories || []
          const selectedInTopic = categories.filter(c => selectedCategories.includes(c.id)).length

          return (
            <Reorder.Item 
              key={topic.id} 
              value={topic}
              className="relative rounded-[2rem] overflow-hidden group cursor-grab active:cursor-grabbing"
              style={{
                background: 'rgba(255,255,255,0.02)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              {/* Background Video */}
              {topic.video_url && (
                <div className="absolute inset-0 z-0">
                  <video 
                    src={topic.video_url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-black/50" />
                </div>
              )}

              {/* Content Container */}
              <div className="relative z-10">
                <div className="flex items-center justify-between p-6 bg-black/20 hover:bg-black/40 transition-colors">
                  <div className="flex items-center gap-6">
                    <div 
                      className="w-16 h-16 flex items-center justify-center text-3xl rounded-2xl shadow-2xl"
                      style={{ background: `${topic.color || '#5d24d6'}30`, border: `1px solid ${topic.color}50` }}
                    >
                      {topic.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-2xl tracking-tight text-white">{topic.name}</h3>
                      <p className="font-mono text-xs uppercase tracking-widest mt-2 opacity-50">{categories.length} CATEGORIES</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {selectedInTopic > 0 && (
                      <span className="font-mono text-xs tracking-widest px-4 py-2 rounded-full border border-white/10" style={{ color: topic.color || '#fff', backgroundColor: `${topic.color || '#5d24d6'}20` }}>
                        SELECTED: {selectedInTopic}
                      </span>
                    )}
                    
                    <button 
                      onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when clicking the toggle
                      onClick={() => toggleTopic(topic.id)}
                      className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        ▼
                      </motion.div>
                    </button>
                    
                    {/* Drag Handle Icon */}
                    <div className="w-8 h-8 flex flex-col items-center justify-center gap-1 opacity-20 hover:opacity-100 transition-opacity">
                      <div className="w-4 h-0.5 bg-white rounded-full" />
                      <div className="w-4 h-0.5 bg-white rounded-full" />
                      <div className="w-4 h-0.5 bg-white rounded-full" />
                    </div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" onPointerDown={(e) => e.stopPropagation()}>
                        {categories.map(cat => {
                          const isSelected = selectedCategories.includes(cat.id)
                          const isMaxReached = selectedCategories.length >= maxSelections && !isSelected

                          return (
                            <motion.button
                              key={cat.id}
                              whileHover={!isMaxReached ? { scale: 1.03, y: -2 } : {}}
                              whileTap={!isMaxReached ? { scale: 0.97 } : {}}
                              onClick={() => onToggleCategory(cat.id)}
                              disabled={isMaxReached}
                              className={`relative p-5 rounded-2xl transition-all duration-300 flex flex-col justify-between min-h-[120px] overflow-hidden ${
                                isSelected 
                                  ? 'bg-white/10 border-2' 
                                  : isMaxReached
                                    ? 'bg-black/20 border border-white/5 opacity-40 cursor-not-allowed'
                                    : 'bg-black/30 border border-white/10 hover:bg-white/5'
                              }`}
                              style={isSelected ? { borderColor: topic.color || '#5d24d6', boxShadow: `0 0 30px ${topic.color || '#5d24d6'}40` } : {}}
                            >
                              {/* Subcategory Video */}
                              {cat.video_url && !isSelected && (
                                <video 
                                  src={cat.video_url} 
                                  autoPlay 
                                  loop 
                                  muted 
                                  playsInline 
                                  className="absolute inset-0 w-full h-full object-cover z-0 opacity-20"
                                />
                              )}

                              <div className="relative z-10 flex justify-between items-start w-full">
                                <span className="text-3xl drop-shadow-lg">{cat.icon || '📝'}</span>
                                {isSelected && (
                                  <motion.div 
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: topic.color || '#fff', boxShadow: `0 0 10px ${topic.color || '#fff'}` }}
                                  />
                                )}
                              </div>
                              
                              <div className="relative z-10 w-full mt-4 text-right">
                                <span className="font-bold text-lg leading-tight text-white drop-shadow-md">{cat.name}</span>
                              </div>
                            </motion.button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reorder.Item>
          )
        })}
        {filteredTopics.length === 0 && (
          <div className="py-20 text-center text-white/40 font-mono text-sm tracking-widest">
            NO TOPICS FOUND
          </div>
        )}
      </Reorder.Group>
    </div>
  )
}
