/**
 * Global Constants — Abu Al-Areef
 * Centralized asset URLs and configuration.
 */

export const ASSETS = {
  AUDIO: {
    // Primary "Molly" style ethereal trap beat
    PRIMARY_BGM: 'https://cdn.pixabay.com/audio/2022/11/24/audio_165e315354.mp3',
    
    // Stable fallback track (guaranteed hotlinking)
    FALLBACK_BGM: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    
    // Game effects (Placeholders)
    CORRECT: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    WRONG: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3',
  },
  
  VIDEO: {
    LANDING_BG: 'https://assets.mixkit.co/videos/preview/mixkit-star-field-in-deep-space-34356-large.mp4',
  },
  
  BRAND: {
    ACCENT_DEFAULT: '#8B5CF6',
  }
}

export const APP_CONFIG = {
  MAX_TEAMS: 6,
  MAX_CATEGORIES: 6,
  MAINTENANCE_MODE: false,
}
