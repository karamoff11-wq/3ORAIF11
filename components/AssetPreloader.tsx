'use client'

import { useEffect, useRef } from 'react'

const CRITICAL_ASSETS = [
  '/alien-earth.png',
  '/alien-planet.png',
  '/logo-orb-v2.png',
  '/logo.png'
]

export default function AssetPreloader() {
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    // Give the main UI time to paint, then start prefetching assets in background
    setTimeout(() => {
      // 1. Preload Images
      CRITICAL_ASSETS.forEach(src => {
        const img = new Image()
        img.src = src
      })
      
      // 2. Pre-warm AudioDirector Web Audio Context quietly
      import('@/lib/audioDirector').then(({ audioDirector }) => {
        // By importing, it instantiates the singleton which preps TTS voices
        // We do not play sound yet, just let the instance initialize
      }).catch(() => {})
      
    }, 2000)
  }, [])

  return null
}
