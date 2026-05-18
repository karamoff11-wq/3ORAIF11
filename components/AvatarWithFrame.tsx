'use client'

import React from 'react'
import Image from 'next/image'
import { useFeedbackStore } from '@/store/feedbackStore'

export function AvatarWithFrame({ avatarBg, avatarType, avatarUrl, name, sizeClass = 'w-24 h-24 md:w-32 md:h-32', level }: {
  avatarBg: string; avatarType: string; avatarUrl?: string; name: string; sizeClass?: string; level?: number;
}) {
  const { equippedFrame, lang } = useFeedbackStore()
  const isRtl = lang === 'AR'
  
  const frameStyles: Record<string, { container: string; halo: string }> = {
    none: { container: 'border border-white/10 shadow-xl', halo: '' },
    neon: { container: 'border-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.8)] animate-pulse', halo: 'absolute -inset-2 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full blur-md opacity-70 -z-10 animate-spin' },
    gold: { container: 'border-4 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.8)]', halo: 'absolute -inset-3 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 rounded-full blur-lg opacity-80 -z-10' },
    diamond: { container: 'border-4 border-purple-400 shadow-[0_0_50px_rgba(168,85,247,0.9)]', halo: 'absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-90 -z-10 animate-pulse' },
  }

  const current = frameStyles[equippedFrame] || frameStyles.none

  return (
    <div className={`relative ${sizeClass} rounded-full z-10 flex items-center justify-center shrink-0`}>
      {current.halo && <div className={current.halo} />}
      <div className={`w-full h-full rounded-full overflow-hidden relative ${current.container}`} style={{ backgroundColor: avatarBg }}>
        {avatarType === 'image' && avatarUrl ? (
          <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl font-black text-white">
            {name ? name.charAt(0).toUpperCase() : 'A'}
          </div>
        )}
      </div>
      {level !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl text-white text-[10px] font-black tracking-widest shadow-2xl border border-white/20 whitespace-nowrap z-20"
          style={{ backgroundColor: '#1E1B4B', boxShadow: `0 8px 20px rgba(0,0,0,0.5)` }}>
          {isRtl ? `المستوى ${level}` : `LVL ${level}`}
        </div>
      )}
    </div>
  )
}
