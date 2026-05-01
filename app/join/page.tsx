'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export default function JoinPage() {
  const router = useRouter()
  const supabase = createClient()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!char && value !== '') return

    const newCode = [...code]

    if (char.length > 1) {
      const pasted = char.slice(0, 6)
      const filled = pasted.split('')
      for (let i = 0; i < 6; i++) {
        newCode[i] = filled[i] || ''
      }
      setCode(newCode)
      const nextEmpty = Math.min(pasted.length, 5)
      inputRefs.current[nextEmpty]?.focus()
      return
    }

    newCode[index] = char
    setCode(newCode)
    setError('')

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        const newCode = [...code]
        newCode[index - 1] = ''
        setCode(newCode)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newCode = [...code]
        newCode[index] = ''
        setCode(newCode)
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    const newCode = Array(6).fill('')
    pasted.split('').forEach((char, i) => { newCode[i] = char })
    setCode(newCode)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleJoin = async () => {
    const joinCode = code.join('')
    if (joinCode.length < 6) {
      setError('يرجى إدخال الكود المكون من 6 أحرف كاملاً')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: session, error: err } = await (supabase
        .from('sessions') as any)
        .select('id, state, mode')
        .eq('join_code', joinCode)
        .single()

      if (err || !session) {
        setError('كود الانضمام غير صحيح أو منتهي الصلاحية')
        setLoading(false)
        return
      }

      if (session.state === 'finished') {
        setError('انتهت هذه الجلسة بالفعل')
        setLoading(false)
        return
      }

      toast.success('وجدنا الجلسة! جاري الانضمام...')
      if (session.mode === 'remote') {
        router.push(`/game/join/${session.id}`)
      } else {
        router.push(`/game/${session.id}`)
      }
    } catch {
      setError('حدث خطأ، يرجى المحاولة مرة أخرى')
      setLoading(false)
    }
  }

  const isComplete = code.every(c => c !== '')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background ambient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/2 -left-48 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle,#f59e0b,transparent 70%)' }} />
        <div className="absolute -top-48 -right-24 w-[500px] h-[500px] rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] mb-8 text-4xl animate-float-slow"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #ef4444 100%)',
              boxShadow: '0 12px 40px rgba(245,158,11,0.4), inset 0 2px 0 rgba(255,255,255,0.2)'
            }}
          >
            🎮
          </motion.div>
          <h1 className="text-4xl font-black mb-3 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            انضم للعبة
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            أدخل كود الجلسة المكون من 6 أحرف
          </p>
        </div>

        {/* Card */}
        <div className="card-glass p-9 md:p-12 relative overflow-hidden border-glow">
          <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.4),transparent)' }} />

          {/* Code Input */}
          <div className="flex gap-2.5 md:gap-4 justify-center mb-10" dir="ltr">
            {code.map((char, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <input
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-10 h-14 md:w-14 md:h-20 text-center text-3xl font-black rounded-2xl border transition-all outline-none"
                  style={{
                    background: char ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                    borderColor: char ? 'rgba(245,158,11,0.5)' : 'var(--color-border)',
                    color: char ? 'var(--color-accent-light)' : 'var(--color-text-primary)',
                    boxShadow: char ? '0 0 20px rgba(245,158,11,0.2)' : 'none',
                    fontFamily: 'var(--font-latin)',
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8 p-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Join Button */}
          <motion.button
            onClick={handleJoin}
            disabled={loading || !isComplete}
            whileHover={{ scale: isComplete ? 1.02 : 1 }}
            whileTap={{ scale: isComplete ? 0.98 : 1 }}
            className="btn btn-accent btn-lg w-full py-5 text-xl font-black relative group"
            style={{ opacity: isComplete ? 1 : 0.4 }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {loading ? (
              <span className="flex items-center gap-3 justify-center">
                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                جاري التحقق...
              </span>
            ) : (
              'انضم الآن 🚀'
            )}
          </motion.button>

          {/* Footer Navigation */}
          <div className="mt-10 pt-8 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
            <Link href="/dashboard" className="text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-text-primary)' }}>
              ← العودة للوحة التحكم
            </Link>
          </div>
        </div>

        {/* Support hint */}
        <div className="mt-8 text-center animate-slide-up" style={{ animationDelay: '400ms' }}>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-muted)' }}>
            تحتاج مساعدة؟ تواصل مع مضيف الجلسة
          </p>
        </div>
      </motion.div>
    </div>
  )
}
