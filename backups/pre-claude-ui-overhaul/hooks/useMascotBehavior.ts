'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useGameStore } from '@/store/gameStore'
import type { MascotState } from '@/types/game'
import { audioDirector, SequenceStep } from '@/lib/audioDirector'

interface MascotPhrase {
  id: string
  category: string
  text: string
  audio_url?: string
}

interface MascotSettings {
  enabled: boolean
  sarcasm_level: number
  energy_level: number
  voice_enabled: boolean
  voice_id?: string
  active_mascot_id?: string
}

export function useMascotBehavior() {
  const supabase = createClient()
  const [phrases, setPhrases] = useState<MascotPhrase[]>([])
  const [settings, setSettings] = useState<MascotSettings | null>(null)
  const store = useGameStore()

  useEffect(() => {
    async function loadMascotData() {
      const [settsRes, phrsRes] = await Promise.all([
        (supabase.from('mascot_settings') as any).select('*').single(),
        (supabase.from('mascot_phrases') as any).select('*').eq('is_active', true),
      ])
      if (settsRes.data) {
        setSettings(settsRes.data)
        // Sync configuration snapshot to Audio Director
        if (settsRes.data.timing_config) {
          audioDirector.updateConfig(settsRes.data.timing_config)
        }
      }
      if (phrsRes.data) setPhrases(phrsRes.data)
    }
    loadMascotData()
  }, [])

  const triggerReaction = useCallback((type: 'correct' | 'wrong' | 'hype' | 'punishment' | 'thinking' | 'intro', overrideText?: string) => {
    if (!settings?.enabled || type === 'punishment') return

    let state: MascotState = 'idle'
    if (type === 'correct') state = 'correct'
    if (type === 'wrong') state = 'wrong'
    if (type === 'hype') state = 'hype'
    if (type === 'thinking') state = 'thinking'

    // Determine the text/audio
    let selectedPhrase: MascotPhrase | null = null
    let textToSpeak = overrideText

    if (!textToSpeak) {
      const categoryPhrases = phrases.filter(p => p.category === type)
      if (categoryPhrases.length > 0) {
        selectedPhrase = categoryPhrases[Math.floor(Math.random() * categoryPhrases.length)]
        textToSpeak = selectedPhrase.text
      }
    }

    // Helper to clamp delays securely
    const clampDelay = (val: any, min: number, max: number, def: number) => {
      if (typeof val !== 'number') return def
      return Math.min(Math.max(val, min), Math.min(max, 1200)) // Max global pacing rule
    }

    const timing = (settings as any)?.timing_config || {}
    const delayCorrect = clampDelay(timing.correct, 150, 700, 350)
    const delayWrong = clampDelay(timing.wrong, 100, 600, 250)
    const delayReveal = clampDelay(timing.reveal, 200, 900, 400)

    // Build the Sequence
    const sequence: SequenceStep[] = []

    // 1. Prepend SFX and TV Show micro-delay (Safely Clamped)
    if (type === 'correct' || type === 'hype') {
      sequence.push({ kind: 'sfx', type: 'correct' })
      sequence.push({ kind: 'wait', durationMs: delayCorrect })
    } else if (type === 'wrong') {
      sequence.push({ kind: 'sfx', type: 'wrong' })
      sequence.push({ kind: 'wait', durationMs: delayWrong })
    } else if (type === 'thinking') {
      sequence.push({ kind: 'sfx', type: 'reveal' })
      sequence.push({ kind: 'wait', durationMs: delayReveal })
    } else if (type === 'intro') {
      sequence.push({ kind: 'sfx', type: 'intro' })
      sequence.push({ kind: 'wait', durationMs: 200 })
    }

    // 2. Set State immediately
    if (state !== 'idle') {
      sequence.push({ kind: 'hook', fn: () => store.setMascotState(state) })
    }

    // 3. Play Audio/TTS if available
    if (selectedPhrase?.audio_url) {
      sequence.push({ kind: 'hook', fn: () => store.setIsTalking(true) })
      sequence.push({ kind: 'mp3', url: selectedPhrase.audio_url })
      sequence.push({ kind: 'hook', fn: () => store.setIsTalking(false) })
    } else if (textToSpeak && settings.voice_enabled) {
      const pitch = 1.0 + (settings.energy_level - 50) * 0.01
      const rate = 1.0 + (settings.energy_level - 50) * 0.005
      sequence.push({ kind: 'tts', text: textToSpeak, pitch, rate })
    }

    // 4. Revert to Idle state after sequence
    sequence.push({ kind: 'wait', durationMs: 1500 })
    sequence.push({ kind: 'hook', fn: () => store.setMascotState('idle') })

    // Determine priority
    const priorityMap: Record<string, 'interrupt'|'high'|'normal'|'low'> = {
      correct: 'interrupt',
      wrong: 'interrupt',
      hype: 'high',
      punishment: 'high',
      thinking: 'normal',
      intro: 'normal'
    }

    // Push to engine
    audioDirector.runSequence(sequence, { 
      priority: priorityMap[type] || 'normal',
      atomicMode: 'cancel' // If interrupted, stop talking
    })

    return textToSpeak || ""
  }, [settings, phrases, store])

  return {
    triggerReaction,
    settings,
    phrases,
  }
}
