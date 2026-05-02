'use client'

import { useGameStore } from '@/store/gameStore'

export type TaskPriority = 'interrupt' | 'high' | 'normal' | 'low'
export type AtomicMode = 'cancel' | 'finish'

export type SequenceStep = 
  | { kind: 'tts'; text: string; pitch?: number; rate?: number }
  | { kind: 'sfx'; type: 'correct' | 'wrong' | 'tick' | 'reveal' | 'intro' }
  | { kind: 'mp3'; url: string }
  | { kind: 'wait'; durationMs: number }
  | { kind: 'hook'; fn: () => void | Promise<void> }

export interface AudioSequence {
  id: string
  steps: SequenceStep[]
  priority: TaskPriority
  atomicMode?: AtomicMode
}

class MascotAudioDirector {
  private queue: AudioSequence[] = []
  private isPlaying = false
  public isLocked = false // Modifier flag, not a state
  private currentSequenceId: string | null = null
  private stopCurrentExecution: (() => void) | null = null
  
  private audioCtx: AudioContext | null = null
  private cachedVoice: SpeechSynthesisVoice | null = null
  private voicesLoaded = false
  
  // Settings snapshot (updated between rounds)
  public config = {
    voice_lang: 'ar-SA',
    correct: 350,
    wrong: 250,
    reveal: 400
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVoices()
    }
  }

  // --- 0. Config Management ---
  public updateConfig(newConfig: Partial<typeof this.config>) {
    this.config = { ...this.config, ...newConfig }
    // Re-evaluate voice cache if language preference changes
    if (newConfig.voice_lang && this.voicesLoaded) {
      this.initVoices()
    }
  }

  // --- 1. Audio Context Singleton ---
  private getContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }
    return this.audioCtx
  }

  // --- 2. Voice Rehydration & Locking ---
  private initVoices() {
    if (!window.speechSynthesis) return

    const load = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        this.voicesLoaded = true
        const pref = this.config.voice_lang || 'ar-SA'
        // 3-layer fallback: Preferred -> Any Arabic -> First available
        this.cachedVoice = 
          voices.find(v => v.lang === pref) ||
          voices.find(v => v.lang.startsWith('ar')) ||
          voices[0]
      }
    }

    load()
    if (!this.voicesLoaded) {
      window.speechSynthesis.onvoiceschanged = () => {
        load()
      }
    }
  }

  private async ensureVoices(): Promise<void> {
    if (this.voicesLoaded && this.cachedVoice) return
    if (!window.speechSynthesis) return

    // Rehydrate if missing (Browser tab restore)
    if (!window.speechSynthesis.getVoices().length) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          window.speechSynthesis.removeEventListener('voiceschanged', handler)
          this.initVoices()
          resolve()
        }
        window.speechSynthesis.addEventListener('voiceschanged', handler)
        setTimeout(() => {
          window.speechSynthesis.removeEventListener('voiceschanged', handler)
          resolve() // timeout fallback
        }, 2000)
      })
    } else {
      this.initVoices()
    }
  }

  // --- 3. Queue & Priority Management ---
  public runSequence(steps: SequenceStep[], options: { priority?: TaskPriority; atomicMode?: AtomicMode } = {}) {
    const seq: AudioSequence = {
      id: Math.random().toString(36).substring(7),
      steps,
      priority: options.priority || 'normal',
      atomicMode: options.atomicMode
    }

    // Lock check
    if (this.isLocked && seq.priority !== 'interrupt') {
      console.warn('AudioDirector is LOCKED. Dropping task:', seq)
      return
    }

    // Pruning rules
    if (seq.priority === 'interrupt') {
      this.cancelCurrent()
      this.queue = [] // Clear queue
    } else {
      // Don't accumulate low priority tasks (like ticks)
      if (seq.priority === 'low') {
        this.queue = this.queue.filter(q => q.priority !== 'low')
      }
      // If busy and incoming is lower priority than current, drop it
      if (this.isPlaying && this.currentSequenceId) {
        // Simple priority map for comparison
        const pMap = { interrupt: 4, high: 3, normal: 2, low: 1 }
        const currentSeq = this.queue[0] // or the actively playing one
        if (currentSeq && pMap[seq.priority] < pMap[currentSeq.priority]) {
          return // Drop
        }
      }
    }

    this.queue.push(seq)
    this.processQueue()
  }

  public cancelCurrent() {
    if (this.stopCurrentExecution) {
      this.stopCurrentExecution()
      this.stopCurrentExecution = null
    }
    window.speechSynthesis?.cancel()
  }

  private async processQueue() {
    if (this.isPlaying) return
    
    const seq = this.queue.shift()
    if (!seq) return

    this.isPlaying = true
    this.currentSequenceId = seq.id

    let cancelled = false
    this.stopCurrentExecution = () => {
      cancelled = true
    }

    for (const step of seq.steps) {
      if (cancelled) break

      try {
        await this.executeStep(step, () => cancelled)
      } catch (e) {
        console.warn('Sequence step failed:', e)
      }
    }

    // --- Cleanup after sequence (Interrupted or Finished) ---
    useGameStore.getState().setIsTalking(false)
    this.isPlaying = false
    this.currentSequenceId = null
    this.stopCurrentExecution = null

    // Frame alignment for next queue item to ensure UI paints
    await new Promise(res => requestAnimationFrame(() => setTimeout(res, 16)))
    
    this.processQueue()
  }

  // --- 4. Execution Logic ---
  private async executeStep(step: SequenceStep, isCancelled: () => boolean): Promise<void> {
    if (isCancelled()) return

    switch (step.kind) {
      case 'wait':
        await new Promise(res => setTimeout(res, step.durationMs))
        break

      case 'hook':
        await step.fn()
        break

      case 'sfx':
        this.playProceduralSfx(step.type)
        break

      case 'mp3':
        await new Promise<void>((resolve) => {
          const audio = new Audio(step.url)
          let resolved = false
          
          const cleanup = () => {
            if (resolved) return
            resolved = true
            audio.pause()
            audio.currentTime = 0
            audio.onended = null
            audio.onerror = null
            resolve()
          }

          audio.onended = cleanup
          audio.onerror = cleanup
          
          if (isCancelled()) return cleanup()
          
          // Poll for cancellation during playback
          const interval = setInterval(() => {
            if (isCancelled()) {
              clearInterval(interval)
              cleanup()
            }
          }, 100)

          audio.play().catch(() => {
            clearInterval(interval)
            cleanup()
          })
        })
        break

      case 'tts':
        await this.ensureVoices()
        if (isCancelled()) return

        await new Promise<void>((resolve) => {
          if (!window.speechSynthesis) return resolve()

          window.speechSynthesis.cancel() // Prevent overlap
          const utterance = new SpeechSynthesisUtterance(step.text)
          if (this.cachedVoice) utterance.voice = this.cachedVoice
          
          if (step.pitch) utterance.pitch = step.pitch
          if (step.rate) utterance.rate = step.rate

          // Dual Animation Sync (Layer 1: Visual)
          useGameStore.getState().setIsTalking(true)

          // Layer 2: Audio Cleanup Fallback
          // Estimate duration: ~100ms per character as a rough safe upper bound
          const estDurationMs = (step.text.length * 100) + 1000 
          const fallbackTimeout = setTimeout(() => {
            useGameStore.getState().setIsTalking(false)
            resolve()
          }, estDurationMs)

          utterance.onend = () => {
            clearTimeout(fallbackTimeout)
            useGameStore.getState().setIsTalking(false)
            resolve()
          }

          utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
              console.warn('TTS error:', e)
            }
            clearTimeout(fallbackTimeout)
            useGameStore.getState().setIsTalking(false)
            resolve()
          }

          window.speechSynthesis.speak(utterance)
        })
        break
    }
  }

  // --- 5. Procedural SFX ---
  private playProceduralSfx(type: 'correct' | 'wrong' | 'tick' | 'reveal' | 'intro') {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      if (type === 'tick') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.05)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.05)
      }
      else if (type === 'correct') {
        const freqs = [523.25, 659.25, 783.99, 1046.50]
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.value = freq
          const t = ctx.currentTime + i * 0.1
          gain.gain.setValueAtTime(0, t)
          gain.gain.linearRampToValueAtTime(0.15, t + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(t)
          osc.stop(t + 0.3)
        })
      }
      else if (type === 'wrong') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(200, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.4)
      }
      else if (type === 'reveal' || type === 'intro') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5)
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.5)
      }
    } catch (e) {
      console.warn('SFX failed', e)
    }
  }

  // --- 6. Memory Cleanup ---
  public destroy() {
    this.queue = []
    this.cancelCurrent()
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close()
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = null
    }
  }
}

// Export singleton instance
export const audioDirector = new MascotAudioDirector()
