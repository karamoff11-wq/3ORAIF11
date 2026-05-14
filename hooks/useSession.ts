'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { gameEngine } from '@/lib/gameEngine'
import { useGameStore } from '@/store/gameStore'
import { GameMode } from '@/types/game'
import toast from 'react-hot-toast'

export function useSession() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isCreating, setIsCreating] = useState(false)
  const setSession = useGameStore((state) => state.setSession)

  /**
   * Initialize a new game session.
   */
  const createSession = async (mode: GameMode) => {
    setIsCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return null
      }

      // One-shot atomic creation: handles profile, join_code, session, and free-use marking.
      const session = await gameEngine.createSession(user.id, mode)

      // Update store
      setSession(session.id, mode)

      toast.success('تم إنشاء الجلسة بنجاح')
      router.push(`/game/setup/${session.id}`)
      return session
    } catch (error: any) {
      console.error('[useSession] Create failed:', error)
      toast.error('فشل إنشاء الجلسة: ' + error.message)
      return null
    } finally {
      setIsCreating(false)
    }
  }

  const selectCategories = async (sessionId: string, categoryIds: string[]) => {
    try {
      await gameEngine.selectCategories(sessionId, categoryIds)
    } catch (error: any) {
      toast.error('خطأ في حفظ الفئات: ' + error.message)
      throw error
    }
  }

  const generateQuestions = async (sessionId: string, customData?: any) => {
    try {
      await gameEngine.generateQuestions(sessionId, customData)
    } catch (error: any) {
      toast.error('خطأ في توليد الأسئلة: ' + error.message)
      throw error
    }
  }

  return {
    isCreating,
    createSession,
    selectCategories,
    generateQuestions
  }
}
