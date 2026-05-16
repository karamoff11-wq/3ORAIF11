'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslator } from '@/lib/i18n'
import { ensureAuthenticated } from '@/lib/testMode'

// ─────────────────────────────────────────────
// DAILY QUESTIONS (Extremely Hard MCQs)
// ─────────────────────────────────────────────
import { DAILY_QUESTIONS } from '@/data/dailyChallenges'

export default function DailyChallengePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { accentColor, lang, mounted } = useFeedbackStore()
  
  const [loading, setLoading] = useState(true)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result'>('intro')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(DAILY_QUESTIONS[0])

  const isRtl = lang === 'AR'
  const dir = isRtl ? 'rtl' : 'ltr'

  // Define handleAnswer BEFORE it is used in the render or effects
  const handleAnswer = (idx: number) => {
    if (selectedIdx !== null) return
    setSelectedIdx(idx)
    const correct = idx === currentQuestion.correct
    setIsCorrect(correct)
    
    // Save attempt
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`daily_attempt_user_played`, today)

    setTimeout(() => {
      setGameState('result')
    }, 1500)
  }

  useEffect(() => {
    async function init() {
      const user = await ensureAuthenticated()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check local storage for today's attempt
      const today = new Date().toISOString().split('T')[0]
      if (localStorage.getItem(`daily_attempt_user_played`) === today) {
        setAlreadyPlayed(true)
      }

      // Pick a question based on the date
      const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
      setCurrentQuestion(DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length])
      
      setLoading(false)
    }
    init()
  }, [router])

  if (!mounted || loading) return null

  if (alreadyPlayed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#050515]" style={{ direction: dir }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-6">
          <div className="text-8xl">🔒</div>
          <h1 className="text-3xl font-black text-white">
            {isRtl ? 'عد غداً!' : 'Come Back Tomorrow!'}
          </h1>
          <p className="text-white/60 leading-relaxed font-medium">
            {isRtl 
              ? 'لقد خضت تحدي اليوم بالفعل. كل لاعب لديه فرصة واحدة فقط يومياً للحفاظ على المنافسة عادلة ومثيرة.' 
              : 'You have already taken today\'s challenge. Every player gets only one chance per day to keep the competition fair and exciting.'}
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
            style={{ background: accentColor, color: 'white' }}
          >
            {isRtl ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050515] text-white overflow-hidden relative" style={{ direction: dir }}>
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20" style={{ background: accentColor }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20" style={{ background: '#F59E0B' }} />
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-screen flex flex-col items-center justify-center p-6 relative z-10"
          >
            <div className="max-w-2xl w-full text-center space-y-8">
              <motion.div 
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-32 h-32 mx-auto rounded-[2.5rem] bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(245,158,11,0.3)]"
              >
                ⚡
              </motion.div>
              
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
                  {isRtl ? 'التحدي اليومي' : 'Daily Challenge'}
                </h1>
                <p className="text-lg text-white/50 font-medium max-w-lg mx-auto leading-relaxed">
                  {isRtl 
                    ? 'سؤال واحد فائق الصعوبة. إجابة واحدة صحيحة. مكافأة XP ضخمة تنتظرك.' 
                    : 'One extremely difficult question. One correct answer. A massive XP reward awaits you.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                 <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                       <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">{isRtl ? 'المكافأة' : 'Reward'}</p>
                       <p className="text-2xl font-black text-yellow-500">+{currentQuestion.xp} XP</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                       <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">{isRtl ? 'الصعوبة' : 'Difficulty'}</p>
                       <p className="text-2xl font-black text-red-500">{isRtl ? 'قصوى' : 'Extreme'}</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setGameState('playing')}
                className="group relative px-12 py-5 rounded-full font-black text-xl uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity" style={{ background: accentColor }} />
                <div className="relative z-10 bg-white text-black px-12 py-5 rounded-full">
                  {isRtl ? 'ابدأ التحدي' : 'Start Challenge'}
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col items-center justify-center p-6 relative z-10"
          >
            <div className="max-w-3xl w-full space-y-12">
               {/* Question Box */}
               <div className="space-y-6 text-center">
                  <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                     {isRtl ? 'سؤال اليوم' : 'Question of the Day'}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight">
                    {isRtl ? currentQuestion.questionAr : currentQuestion.questionEn}
                  </h2>
               </div>

               {/* Options Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(isRtl ? currentQuestion.optionsAr : currentQuestion.optionsEn).map((opt, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(i)}
                      disabled={selectedIdx !== null}
                      className={`p-6 rounded-3xl text-lg font-black text-left relative overflow-hidden border-2 transition-all duration-300 ${
                        selectedIdx === i 
                          ? (isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10')
                          : 'border-white/5 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-xs opacity-40">
                           {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    </motion.button>
                  ))}
               </div>
            </div>
          </motion.div>
        )}

        {gameState === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-screen flex flex-col items-center justify-center p-6 relative z-10"
          >
             <div className="max-w-xl w-full text-center space-y-8">
                <div className={`text-9xl mb-4 ${isCorrect ? 'animate-bounce' : 'animate-pulse'}`}>
                   {isCorrect ? '🏆' : '🕯️'}
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-5xl font-black">
                    {isCorrect 
                      ? (isRtl ? 'إنجاز رائع!' : 'Magnificent!') 
                      : (isRtl ? 'للأسف، ليست هذه' : 'Not Quite...')}
                  </h2>
                  <p className="text-xl text-white/60 font-medium">
                    {isCorrect 
                      ? (isRtl ? `لقد حصلت على ${currentQuestion.xp} XP بنجاح!` : `You've successfully earned ${currentQuestion.xp} XP!`)
                      : (isRtl ? 'لا تحزن، الفشل هو أول خطوة في طريق العلم. حاول غداً بسؤال جديد.' : 'Don\'t be discouraged. Failure is the first step towards knowledge. Try again tomorrow.')}
                  </p>
                </div>

                <div className="pt-8">
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95 border border-white/10 hover:bg-white/5"
                  >
                    {isRtl ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
                  </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
