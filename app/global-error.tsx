'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Error:', error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#07071A] text-white antialiased" style={{ fontFamily: 'sans-serif' }}>
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center p-6">
          <div className="text-7xl">⚠️</div>
          <h1 className="text-3xl font-black">خطأ في النظام</h1>
          <p className="text-white/50 text-sm max-w-md">حدث خطأ حرج في التطبيق. يرجى إعادة تحميل الصفحة.</p>
          <button onClick={() => reset()} className="px-8 py-4 rounded-2xl font-black text-white bg-red-600 shadow-xl hover:bg-red-500 transition-all cursor-pointer">
            إعادة تحميل التطبيق
          </button>
        </div>
      </body>
    </html>
  )
}
