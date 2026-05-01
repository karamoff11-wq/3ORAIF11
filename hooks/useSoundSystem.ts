'use client'

import { useCallback } from 'react'
import { audioDirector } from '@/lib/audioDirector'

export function useSoundSystem() {
  const playTick = useCallback(() => {
    audioDirector.runSequence([{ kind: 'sfx', type: 'tick' }], { priority: 'low' })
  }, [])

  const playCorrect = useCallback(() => {
    audioDirector.runSequence([{ kind: 'sfx', type: 'correct' }], { priority: 'interrupt' })
  }, [])

  const playWrong = useCallback(() => {
    audioDirector.runSequence([{ kind: 'sfx', type: 'wrong' }], { priority: 'interrupt' })
  }, [])

  const playReveal = useCallback(() => {
    audioDirector.runSequence([{ kind: 'sfx', type: 'reveal' }], { priority: 'high' })
  }, [])

  return { playTick, playCorrect, playWrong, playReveal }
}
