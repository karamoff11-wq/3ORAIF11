'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import MediaCropEditor, { type CropConfig } from '@/components/MediaCropEditor'

const ICONS = ['📚','🌍','🔬','📜','⚽','🎬','🧠','🎵','🍔','🏛️','💻','✈️','🐾','🧩','🎯','🎌','🎮','📺','📈','👤']
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#eab308', '#22c55e', '#f97316', '#ef4444', '#ec4899', '#f43f5e', '#84cc16']

const BG_STYLES = [
  { value: 'bg-gradient-to-br from-gray-900 to-black', label: 'أسود متدرج (افتراضي)' },
  { value: 'bg-[#050505]', label: 'أسود صلب' },
  { value: 'bg-gradient-to-br from-blue-900/60 to-black', label: 'أزرق داكن متدرج' },
  { value: 'bg-gradient-to-br from-purple-900/60 to-black', label: 'بنفسجي داكن متدرج' },
  { value: 'bg-gradient-to-br from-emerald-900/60 to-black', label: 'أخضر داكن متدرج' },
  { value: 'bg-gradient-to-br from-red-900/60 to-black', label: 'أحمر داكن متدرج' },
]

export default function AdminTopicsPage() {
  const supabase = createClient()
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  
  // Topic has: id (string), name, icon, color, order_index, video_url
  const [form, setForm] = useState({ id: '', name: '', icon: '📂', color: '#8b5cf6', order_index: 0, video_url: '', bg_style: 'bg-gradient-to-br from-gray-900 to-black' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [cropEditorUrl, setCropEditorUrl] = useState<string | null>(null)
  const [cropConfig, setCropConfig] = useState<CropConfig | null>(null)

  async function load() {
    const [topicsRes, catsRes] = await Promise.all([
      (supabase.from('topics') as any).select('*').order('order_index'),
      (supabase.from('categories') as any).select('*')
    ])
    
    let rawTopics = topicsRes.data || []
    let rawCats = catsRes.data || []

    // FALLBACK
    if (rawTopics.length === 0) {
      rawTopics = [
        { id: 'topic-geography', name: 'جغرافيا', icon: '🌍', color: '#10b981' },
        { id: 'topic-science', name: 'علوم', icon: '🔬', color: '#3b82f6' },
        { id: 'topic-whoami', name: 'من أنا', icon: '👤', color: '#8b5cf6' },
        { id: 'topic-economy', name: 'اقتصاد', icon: '📈', color: '#eab308' },
        { id: 'topic-football', name: 'كرة قدم', icon: '⚽', color: '#22c55e' },
        { id: 'topic-general', name: 'عامة', icon: '💡', color: '#f97316' },
        { id: 'topic-movies', name: 'أفلام', icon: '🎬', color: '#ef4444' },
        { id: 'topic-tvshows', name: 'مسلسلات', icon: '📺', color: '#ec4899' },
        { id: 'topic-anime', name: 'أنمي', icon: '🎌', color: '#f43f5e' },
        { id: 'topic-videogames', name: 'ألعاب فيديو', icon: '🎮', color: '#84cc16' }
      ]
      rawCats = [
        { id: 'cat-capitals', topic_id: 'topic-geography', name: 'عواصم', icon: '🏛️' },
        { id: 'cat-borders', topic_id: 'topic-geography', name: 'حدود الدول', icon: '🗺️' },
        { id: 'cat-countries', topic_id: 'topic-geography', name: 'دول', icon: '🌍' },
        { id: 'cat-flags', topic_id: 'topic-geography', name: 'أعلام', icon: '🎌' },
        { id: 'cat-chemistry', topic_id: 'topic-science', name: 'كيمياء', icon: '🧪' },
        { id: 'cat-physics', topic_id: 'topic-science', name: 'فيزياء', icon: '⚡' },
        { id: 'cat-math', topic_id: 'topic-science', name: 'رياضيات', icon: '➗' },
        { id: 'cat-biology', topic_id: 'topic-science', name: 'أحياء', icon: '🧬' },
        { id: 'cat-who-current', topic_id: 'topic-whoami', name: 'من أنا (معاصرون)', icon: '👤' },
        { id: 'cat-who-country', topic_id: 'topic-whoami', name: 'من أنا (دول)', icon: '🌍' },
        { id: 'cat-who-actor', topic_id: 'topic-whoami', name: 'من أنا (ممثلون)', icon: '🎭' },
        { id: 'cat-who-singer', topic_id: 'topic-whoami', name: 'من أنا (مغنون)', icon: '🎤' },
        { id: 'cat-currencies', topic_id: 'topic-economy', name: 'عملات', icon: '💰' },
        { id: 'cat-gdp', topic_id: 'topic-economy', name: 'الناتج المحلي', icon: '📊' },
        { id: 'cat-companies', topic_id: 'topic-economy', name: 'شركات', icon: '🏢' },
        { id: 'cat-trade', topic_id: 'topic-economy', name: 'صادرات وتجارة', icon: '🚢' },
        { id: 'cat-stadiums', topic_id: 'topic-football', name: 'ملاعب', icon: '🏟️' },
        { id: 'cat-careers', topic_id: 'topic-football', name: 'مسيرات اللاعبين', icon: '🏃' },
        { id: 'cat-guess-team', topic_id: 'topic-football', name: 'خمن الفريق', icon: '👕' },
        { id: 'cat-logos', topic_id: 'topic-football', name: 'شعارات قديمة', icon: '🛡️' },
        { id: 'cat-general-know', topic_id: 'topic-general', name: 'معلومات عامة', icon: '🧠' },
        { id: 'cat-food', topic_id: 'topic-general', name: 'طعام', icon: '🍕' },
        { id: 'cat-art', topic_id: 'topic-general', name: 'فنون', icon: '🎨' },
        { id: 'cat-history', topic_id: 'topic-general', name: 'تاريخ', icon: '📜' },
        { id: 'cat-movie-titanic', topic_id: 'topic-movies', name: 'Titanic', icon: '🚢' },
        { id: 'cat-movie-inception', topic_id: 'topic-movies', name: 'Inception', icon: '🌀' },
        { id: 'cat-movie-dark-knight', topic_id: 'topic-movies', name: 'The Dark Knight', icon: '🦇' },
        { id: 'cat-movie-avatar', topic_id: 'topic-movies', name: 'Avatar', icon: '🌲' },
        { id: 'cat-movie-matrix', topic_id: 'topic-movies', name: 'The Matrix', icon: '💊' },
        { id: 'cat-movie-avengers', topic_id: 'topic-movies', name: 'Avengers', icon: '🦸' },
        { id: 'cat-movie-godfather', topic_id: 'topic-movies', name: 'The Godfather', icon: '🔫' },
        { id: 'cat-movie-harry-potter', topic_id: 'topic-movies', name: 'Harry Potter', icon: '⚡' },
        { id: 'cat-movie-interstellar', topic_id: 'topic-movies', name: 'Interstellar', icon: '🌌' },
        { id: 'cat-movie-lotr', topic_id: 'topic-movies', name: 'Lord of the Rings', icon: '💍' },
        { id: 'cat-tv-breaking-bad', topic_id: 'topic-tvshows', name: 'Breaking Bad', icon: '⚗️' },
        { id: 'cat-tv-got', topic_id: 'topic-tvshows', name: 'Game of Thrones', icon: '⚔️' },
        { id: 'cat-tv-office', topic_id: 'topic-tvshows', name: 'The Office', icon: '🏢' },
        { id: 'cat-tv-friends', topic_id: 'topic-tvshows', name: 'Friends', icon: '☕' },
        { id: 'cat-tv-stranger-things', topic_id: 'topic-tvshows', name: 'Stranger Things', icon: '🚲' },
        { id: 'cat-tv-peaky-blinders', topic_id: 'topic-tvshows', name: 'Peaky Blinders', icon: '🧢' },
        { id: 'cat-tv-prison-break', topic_id: 'topic-tvshows', name: 'Prison Break', icon: '⛓️' },
        { id: 'cat-tv-money-heist', topic_id: 'topic-tvshows', name: 'Money Heist', icon: '🎭' },
        { id: 'cat-tv-dark', topic_id: 'topic-tvshows', name: 'Dark', icon: '⏳' },
        { id: 'cat-tv-sherlock', topic_id: 'topic-tvshows', name: 'Sherlock', icon: '🔎' },
        { id: 'cat-anime-aot', topic_id: 'topic-anime', name: 'Attack on Titan', icon: '⚔️' },
        { id: 'cat-anime-naruto', topic_id: 'topic-anime', name: 'Naruto', icon: '🦊' },
        { id: 'cat-anime-one-piece', topic_id: 'topic-anime', name: 'One Piece', icon: '🏴‍☠️' },
        { id: 'cat-anime-death-note', topic_id: 'topic-anime', name: 'Death Note', icon: '📓' },
        { id: 'cat-anime-hunter', topic_id: 'topic-anime', name: 'Hunter x Hunter', icon: '🎣' },
        { id: 'cat-anime-dbz', topic_id: 'topic-anime', name: 'Dragon Ball Z', icon: '🐉' },
        { id: 'cat-anime-demon-slayer', topic_id: 'topic-anime', name: 'Demon Slayer', icon: '🗡️' },
        { id: 'cat-anime-jujutsu', topic_id: 'topic-anime', name: 'Jujutsu Kaisen', icon: '🤞' },
        { id: 'cat-anime-fmab', topic_id: 'topic-anime', name: 'Fullmetal Alchemist', icon: '🦾' },
        { id: 'cat-anime-bleach', topic_id: 'topic-anime', name: 'Bleach', icon: '👻' },
        { id: 'cat-game-gta', topic_id: 'topic-videogames', name: 'GTA V', icon: '🚗' },
        { id: 'cat-game-fifa', topic_id: 'topic-videogames', name: 'FIFA', icon: '⚽' },
        { id: 'cat-game-minecraft', topic_id: 'topic-videogames', name: 'Minecraft', icon: '🧱' },
        { id: 'cat-game-witcher', topic_id: 'topic-videogames', name: 'The Witcher 3', icon: '🐺' },
        { id: 'cat-game-rdr2', topic_id: 'topic-videogames', name: 'Red Dead Redemption 2', icon: '🤠' },
        { id: 'cat-game-cod', topic_id: 'topic-videogames', name: 'Call of Duty', icon: '🔫' },
        { id: 'cat-game-csgo', topic_id: 'topic-videogames', name: 'CS:GO', icon: '💣' },
        { id: 'cat-game-league', topic_id: 'topic-videogames', name: 'League of Legends', icon: '🏆' },
        { id: 'cat-game-zelda', topic_id: 'topic-videogames', name: 'Zelda: BOTW', icon: '🧝' },
        { id: 'cat-game-godofwar', topic_id: 'topic-videogames', name: 'God of War', icon: '🪓' }
      ]
    }

    const mergedTopics = rawTopics.map((topic: any) => {
      let cats = rawCats.filter((c: any) => c.topic_id === topic.id)
      
      if (cats.length === 0) {
         const fallbackCats = [
          { id: 'cat-capitals', topic_id: 'topic-geography', name: 'عواصم', icon: '🏛️' },
          { id: 'cat-borders', topic_id: 'topic-geography', name: 'حدود الدول', icon: '🗺️' },
          { id: 'cat-countries', topic_id: 'topic-geography', name: 'دول', icon: '🌍' },
          { id: 'cat-flags', topic_id: 'topic-geography', name: 'أعلام', icon: '🎌' },
          { id: 'cat-chemistry', topic_id: 'topic-science', name: 'كيمياء', icon: '🧪' },
          { id: 'cat-physics', topic_id: 'topic-science', name: 'فيزياء', icon: '⚡' },
          { id: 'cat-math', topic_id: 'topic-science', name: 'رياضيات', icon: '➗' },
          { id: 'cat-biology', topic_id: 'topic-science', name: 'أحياء', icon: '🧬' },
          { id: 'cat-who-current', topic_id: 'topic-whoami', name: 'من أنا (معاصرون)', icon: '👤' },
          { id: 'cat-who-country', topic_id: 'topic-whoami', name: 'من أنا (دول)', icon: '🌍' },
          { id: 'cat-who-actor', topic_id: 'topic-whoami', name: 'من أنا (ممثلون)', icon: '🎭' },
          { id: 'cat-who-singer', topic_id: 'topic-whoami', name: 'من أنا (مغنون)', icon: '🎤' },
          { id: 'cat-currencies', topic_id: 'topic-economy', name: 'عملات', icon: '💰' },
          { id: 'cat-gdp', topic_id: 'topic-economy', name: 'الناتج المحلي', icon: '📊' },
          { id: 'cat-companies', topic_id: 'topic-economy', name: 'شركات', icon: '🏢' },
          { id: 'cat-trade', topic_id: 'topic-economy', name: 'صادرات وتجارة', icon: '🚢' },
          { id: 'cat-stadiums', topic_id: 'topic-football', name: 'ملاعب', icon: '🏟️' },
          { id: 'cat-careers', topic_id: 'topic-football', name: 'مسيرات اللاعبين', icon: '🏃' },
          { id: 'cat-guess-team', topic_id: 'topic-football', name: 'خمن الفريق', icon: '👕' },
          { id: 'cat-logos', topic_id: 'topic-football', name: 'شعارات قديمة', icon: '🛡️' },
          { id: 'cat-general-know', topic_id: 'topic-general', name: 'معلومات عامة', icon: '🧠' },
          { id: 'cat-food', topic_id: 'topic-general', name: 'طعام', icon: '🍕' },
          { id: 'cat-art', topic_id: 'topic-general', name: 'فنون', icon: '🎨' },
          { id: 'cat-history', topic_id: 'topic-general', name: 'تاريخ', icon: '📜' },
          { id: 'cat-movie-titanic', topic_id: 'topic-movies', name: 'Titanic', icon: '🚢' },
          { id: 'cat-movie-inception', topic_id: 'topic-movies', name: 'Inception', icon: '🌀' },
          { id: 'cat-movie-dark-knight', topic_id: 'topic-movies', name: 'The Dark Knight', icon: '🦇' },
          { id: 'cat-movie-avatar', topic_id: 'topic-movies', name: 'Avatar', icon: '🌲' },
          { id: 'cat-movie-matrix', topic_id: 'topic-movies', name: 'The Matrix', icon: '💊' },
          { id: 'cat-movie-avengers', topic_id: 'topic-movies', name: 'Avengers', icon: '🦸' },
          { id: 'cat-movie-godfather', topic_id: 'topic-movies', name: 'The Godfather', icon: '🔫' },
          { id: 'cat-movie-harry-potter', topic_id: 'topic-movies', name: 'Harry Potter', icon: '⚡' },
          { id: 'cat-movie-interstellar', topic_id: 'topic-movies', name: 'Interstellar', icon: '🌌' },
          { id: 'cat-movie-lotr', topic_id: 'topic-movies', name: 'Lord of the Rings', icon: '💍' },
          { id: 'cat-tv-breaking-bad', topic_id: 'topic-tvshows', name: 'Breaking Bad', icon: '⚗️' },
          { id: 'cat-tv-got', topic_id: 'topic-tvshows', name: 'Game of Thrones', icon: '⚔️' },
          { id: 'cat-tv-office', topic_id: 'topic-tvshows', name: 'The Office', icon: '🏢' },
          { id: 'cat-tv-friends', topic_id: 'topic-tvshows', name: 'Friends', icon: '☕' },
          { id: 'cat-tv-stranger-things', topic_id: 'topic-tvshows', name: 'Stranger Things', icon: '🚲' },
          { id: 'cat-tv-peaky-blinders', topic_id: 'topic-tvshows', name: 'Peaky Blinders', icon: '🧢' },
          { id: 'cat-tv-prison-break', topic_id: 'topic-tvshows', name: 'Prison Break', icon: '⛓️' },
          { id: 'cat-tv-money-heist', topic_id: 'topic-tvshows', name: 'Money Heist', icon: '🎭' },
          { id: 'cat-tv-dark', topic_id: 'topic-tvshows', name: 'Dark', icon: '⏳' },
          { id: 'cat-tv-sherlock', topic_id: 'topic-tvshows', name: 'Sherlock', icon: '🔎' },
          { id: 'cat-anime-aot', topic_id: 'topic-anime', name: 'Attack on Titan', icon: '⚔️' },
          { id: 'cat-anime-naruto', topic_id: 'topic-anime', name: 'Naruto', icon: '🦊' },
          { id: 'cat-anime-one-piece', topic_id: 'topic-anime', name: 'One Piece', icon: '🏴‍☠️' },
          { id: 'cat-anime-death-note', topic_id: 'topic-anime', name: 'Death Note', icon: '📓' },
          { id: 'cat-anime-hunter', topic_id: 'topic-anime', name: 'Hunter x Hunter', icon: '🎣' },
          { id: 'cat-anime-dbz', topic_id: 'topic-anime', name: 'Dragon Ball Z', icon: '🐉' },
          { id: 'cat-anime-demon-slayer', topic_id: 'topic-anime', name: 'Demon Slayer', icon: '🗡️' },
          { id: 'cat-anime-jujutsu', topic_id: 'topic-anime', name: 'Jujutsu Kaisen', icon: '🤞' },
          { id: 'cat-anime-fmab', topic_id: 'topic-anime', name: 'Fullmetal Alchemist', icon: '🦾' },
          { id: 'cat-anime-bleach', topic_id: 'topic-anime', name: 'Bleach', icon: '👻' },
          { id: 'cat-game-gta', topic_id: 'topic-videogames', name: 'GTA V', icon: '🚗' },
          { id: 'cat-game-fifa', topic_id: 'topic-videogames', name: 'FIFA', icon: '⚽' },
          { id: 'cat-game-minecraft', topic_id: 'topic-videogames', name: 'Minecraft', icon: '🧱' },
          { id: 'cat-game-witcher', topic_id: 'topic-videogames', name: 'The Witcher 3', icon: '🐺' },
          { id: 'cat-game-rdr2', topic_id: 'topic-videogames', name: 'Red Dead Redemption 2', icon: '🤠' },
          { id: 'cat-game-cod', topic_id: 'topic-videogames', name: 'Call of Duty', icon: '🔫' },
          { id: 'cat-game-csgo', topic_id: 'topic-videogames', name: 'CS:GO', icon: '💣' },
          { id: 'cat-game-league', topic_id: 'topic-videogames', name: 'League of Legends', icon: '🏆' },
          { id: 'cat-game-zelda', topic_id: 'topic-videogames', name: 'Zelda: BOTW', icon: '🧝' },
          { id: 'cat-game-godofwar', topic_id: 'topic-videogames', name: 'God of War', icon: '🪓' }
        ]
        cats = fallbackCats.filter(c => c.topic_id === topic.id)
      }

      return {
        ...topic,
        categories: cats
      }
    })

    setTopics(mergedTopics)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openAdd() { 
    setForm({ id: `topic-${Date.now()}`, name: '', icon: '📂', color: '#8b5cf6', order_index: topics.length + 1, video_url: '', bg_style: 'bg-gradient-to-br from-gray-900 to-black' })
    setEditing(null)
    setModal(true) 
  }

  function openEdit(t: any) { 
    setForm({ id: t.id, name: t.name, icon: t.icon ?? '📂', color: t.color ?? '#8b5cf6', order_index: t.order_index ?? 0, video_url: t.video_url ?? '', bg_style: t.bg_style ?? 'bg-gradient-to-br from-gray-900 to-black' })
    setCropConfig(t.crop_config || null)
    setEditing(t)
    setModal(true) 
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `backgrounds/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)

      setForm(f => ({ ...f, video_url: data.publicUrl }))
      setCropEditorUrl(data.publicUrl)
      toast.success('تم رفع الفيديو بنجاح! اضبط القص الآن.')
    } catch (error: any) {
      toast.error('خطأ في الرفع: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!form.name.trim()) { toast.error('اسم الموضوع مطلوب'); return }
    setSaving(true)
    const payload = { 
      id: form.id, 
      name: form.name.trim(), 
      icon: form.icon, 
      color: form.color, 
      order_index: form.order_index,
      video_url: form.video_url,
      bg_style: form.bg_style,
      crop_config: cropConfig || null
    }

    const { error } = editing
      ? await (supabase.from('topics') as any).update(payload).eq('id', editing.id)
      : await (supabase.from('topics') as any).insert(payload)
      
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success(editing ? 'تم التحديث' : 'تمت الإضافة')
    setModal(false); setSaving(false); load()
  }

  async function del(id: string) {
    const { error } = await (supabase.from('topics') as any).delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('تم الحذف'); setDeleteId(null); load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text-primary">المواضيع الرئيسية</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{topics.length} موضوع</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">+ إضافة موضوع</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-28 card-glass animate-shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {topics.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-glass flex items-center gap-4 relative overflow-hidden"
            >
              {t.video_url && (
                <video 
                  src={t.video_url} 
                  autoPlay loop muted playsInline 
                  className="absolute inset-0 w-full h-full object-cover opacity-20 z-0 pointer-events-none"
                />
              )}
              <div className="absolute top-0 bottom-0 right-0 w-1 z-10" style={{ backgroundColor: t.color || '#8b5cf6' }} />
              
              <div className="text-4xl w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 mr-2 z-10 relative"
                style={{ background: `${t.color || '#8b5cf6'}20` }}>
                {t.icon}
              </div>
              <div className="flex-1 min-w-0 z-10 relative">
                <div className="font-bold truncate text-lg" style={{ color: 'var(--color-text-primary)' }}>{t.name}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.categories && t.categories.length > 0 ? (
                    t.categories.map((cat: any) => (
                      <span key={cat.id} className="text-[10px] px-2 py-1 rounded-md flex items-center gap-1" style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)' }}>
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] px-2 py-1 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      لا توجد فئات
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 z-10 relative">
                <button onClick={() => openEdit(t)} className="btn btn-sm btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }}>تعديل</button>
                <button onClick={() => setDeleteId(t.id)} className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>حذف</button>
              </div>
            </motion.div>
          ))}
          {topics.length === 0 && (
            <div className="col-span-3 py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>
              لا توجد مواضيع بعد — أضف موضوع جديد
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
              className="card-glass w-full max-w-sm p-8 space-y-5 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {editing ? 'تعديل الموضوع' : 'إضافة موضوع جديد'}
              </h2>
              
              <div>
                <label className="label">اسم الموضوع *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: جغرافيا" />
              </div>

              {!editing && (
                <div>
                  <label className="label">المعرف (ID)</label>
                  <input className="input" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} placeholder="مثال: topic-geography" />
                  <p className="text-[10px] text-white/50 mt-1">يفضل أن يكون باللغة الإنجليزية وبدون مسافات.</p>
                </div>
              )}

              <div>
                <label className="label">الترتيب</label>
                <input type="number" className="input" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} />
              </div>

              <div>
                <label className="label">لون/تدرج الخلفية (في شاشة الإعداد)</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {BG_STYLES.map(bg => (
                    <button
                      key={bg.value}
                      onClick={() => setForm(f => ({ ...f, bg_style: bg.value }))}
                      className={`text-xs p-3 rounded-xl border-2 transition-all flex items-center justify-center text-white/80 ${form.bg_style === bg.value ? 'border-white font-bold' : 'border-white/10 hover:border-white/30'}`}
                      style={{ background: bg.value.startsWith('bg-[') ? bg.value.slice(4, -1) : undefined }}
                    >
                      <div className={`absolute inset-0 rounded-xl opacity-40 ${bg.value}`} style={{ zIndex: -1 }} />
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">فيديو الخلفية (اختياري)</label>
                <div className="flex flex-col gap-3">
                  <input className="input" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="رابط مباشر للفيديو (MP4)" />
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="video/mp4,video/webm" 
                      onChange={handleVideoUpload} 
                      disabled={uploading} 
                      className="block w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
                    />
                    {uploading && <div className="absolute right-4 top-2 text-xs text-cyan-400 animate-pulse font-bold">جاري الرفع...</div>}
                  </div>
                  {form.video_url && (
                    <button
                      type="button"
                      onClick={() => setCropEditorUrl(form.video_url)}
                      className="w-full py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-bold hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      ✂️ ضبط القص والتكبير
                      {cropConfig && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">تم الضبط ✓</span>}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="label">اللون</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORS.map(color => (
                    <button key={color} onClick={() => setForm(f => ({ ...f, color }))}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{ 
                        backgroundColor: color, 
                        borderColor: form.color === color ? 'white' : 'transparent',
                        transform: form.color === color ? 'scale(1.15)' : 'scale(1)' 
                      }} />
                  ))}
                </div>
              </div>

              <div>
                <label className="label">الأيقونة</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{ background: form.icon === icon ? `${form.color}40` : 'var(--color-surface-3)', transform: form.icon === icon ? 'scale(1.15)' : 'scale(1)' }}>
                      {icon}
                    </button>
                  ))}
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
              <p style={{ color: 'var(--color-text-secondary)' }}>سيتم حذف الموضوع وجميع فئاته وأسئلته المرتبطة به. هل أنت متأكد؟</p>
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
            mediaType={cropEditorUrl.includes('.mp4') || cropEditorUrl.includes('.webm') ? 'video' : 'image'}
            initialConfig={cropConfig ?? undefined}
            availableSlots={['topic_bg']}
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
