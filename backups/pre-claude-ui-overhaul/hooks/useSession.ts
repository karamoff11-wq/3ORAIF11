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
      let { data: { user } } = await supabase.auth.getUser()

      // If no user, sign in anonymously — creates a real UUID in auth.users
      if (!user) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) throw error
        user = data.user
      }

      const isGuest = user?.app_metadata?.provider === 'anonymous'
      const hostId = user!.id  // now a real UUID, always

      let profile: any = null
      if (!isGuest && user) {
        const { data: p } = await (supabase
          .from('profiles') as any)
          .select('free_sessions_used')
          .eq('id', user.id)
          .single()
        profile = p
      }


      // Create session via engine
      const session = await gameEngine.createSession(hostId, mode)
      
      // Update store
      setSession(session.id, mode)

      // Mark free session as used for authenticated users
      if (!isGuest && profile && !profile.free_sessions_used && user) {
        await (supabase
          .from('profiles') as any)
          .update({ free_sessions_used: true })
          .eq('id', user.id)
      }

      toast.success('تم إنشاء الجلسة بنجاح')
      router.push(`/game/setup/${session.id}`)
      return session
    } catch (error: any) {
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

  const generateQuestions = async (sessionId: string) => {
    try {
      await gameEngine.generateQuestions(sessionId)
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
