'use client'

import { useEffect } from 'react'
import Mascot from '@/components/Mascot'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#07071A] flex flex-col items-center justify-center gap-6 text-center p-6 text-white select-none" style={{ fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif' }}>
      <Mascot state="sad" size={120} color="#EF4444" />
      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-black text-white">عذراً، حدث خطأ غير متوقع!</h1>
        <p className="text-white/50 text-sm">واجه النظام مشكلة أثناء معالجة طلبك. نعتذر عن هذا الخلل.</p>
        {error?.message && (
          <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 mt-2 font-mono truncate">{error.message}</p>
        )}
      </div>
      <button onClick={() => reset()} className="px-8 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-red-500 to-amber-500 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
        🔄 المحاولة مرة أخرى
      </button>
    </div>
  )
}
