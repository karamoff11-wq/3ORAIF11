'use client'

import Link from 'next/link'
import Mascot from '@/components/Mascot'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07071A] flex flex-col items-center justify-center gap-6 text-center p-6 text-white select-none" style={{ fontFamily: 'var(--font-tajawal), var(--font-cairo), sans-serif' }}>
      <Mascot state="thinking" size={120} color="#8B5CF6" />
      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-black text-white tracking-tight">404 - الصفحة غير موجودة</h1>
        <p className="text-white/50 text-sm">يبدو أن الصفحة التي تبحث عنها قد تم نقلها أو أنها غير موجودة في سجلات العُريف.</p>
      </div>
      <Link href="/dashboard" className="px-8 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-purple-500 to-indigo-500 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer inline-block">
        🏠 العودة إلى الرئيسية
      </Link>
    </div>
  )
}
