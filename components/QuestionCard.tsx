'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface Question {
  id: string
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  category_id?: string
}

interface Props {
  question: Question
  isRevealed: boolean
}

const DIFF_CONFIG = {
  easy:   { label: 'سهل',   bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.25)' },
  medium: { label: 'متوسط', bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  hard:   { label: 'صعب',   bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
}

export default function QuestionCard({ question, isRevealed }: Props) {
  const diff = DIFF_CONFIG[question.difficulty] ?? DIFF_CONFIG.easy

  return (
    <div className="w-full">
      {/* Question card */}
      <motion.div
        layout
        className="w-full rounded-3xl p-8 text-center relative overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-2)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)'
        }}
      >
        {/* Subtle top gradient line */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${diff.color}66,transparent)` }} />

        {/* Difficulty badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
          style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: diff.color }} />
          {diff.label}
        </div>

        {/* Question text */}
        <p className="text-xl md:text-2xl font-bold leading-relaxed mb-6"
          style={{ color: 'var(--color-text-primary)' }}>
          {question.question}
        </p>

        {/* Answer reveal */}
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
            >
              <div className="h-px mb-5" style={{ background: 'var(--color-border)' }} />
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: 'var(--color-text-muted)' }}>الإجابة الصحيحة</p>
              <motion.p
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className="text-2xl md:text-3xl font-black"
                style={{ color: '#10b981', textShadow: '0 0 24px rgba(16,185,129,0.4)' }}
              >
                {question.answer}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
