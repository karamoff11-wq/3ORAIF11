import { Database } from './database'

export type Tables = Database['public']['Tables']

export interface MascotSettings {
  id: string
  enabled: boolean
  voice_enabled: boolean
  energy_level: number
  pebble_preview_color?: string
  timing_config: {
    correct: number
    wrong: number
    reveal: number
    voice_lang: string
  }
  created_at?: string
}

export interface MascotPhrase {
  id: string
  category: string
  text: string
  audio_url: string | null
  is_active: boolean
  created_at: string
}

export interface AnswerPhrase {
  id: string
  category: 'correct' | 'wrong' | 'punishment'
  text: string
  is_active: boolean
  created_at: string
}

export interface Topic {
  id: string
  name: string
  icon: string | null
  color: string | null
  order_index: number
  video_url: string | null
  bg_style: string | null
  crop_config: Record<string, unknown> | null
  created_at: string
  categories?: CategoryWithQuestions[]
}

export interface CategoryWithQuestions {
  id: string
  name: string
  icon: string | null
  topic_id: string | null
  image_url: string | null
  hide_icon: boolean
  crop_config: Record<string, unknown> | null
  created_at: string
  topics?: {
    name: string
    color: string
  }
  questions?: {
    count: number
  }[]
}

export interface QuestionWithCategory {
  id: string
  category_id: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  answer: string
  media_url: string | null
  created_at: string
  categories?: {
    name: string
  }
}

export interface AdminCategory {
  id: string
  name: string
  icon: string | null
  created_at: string
}

export interface SessionWithDetails {
  id: string
  mode: 'local' | 'remote'
  state: 'lobby' | 'playing' | 'finished'
  join_code: string | null
  created_at: string
  teams?: {
    id: string
    name: string
    score: number
    color: string
  }[]
  profiles?: {
    email: string
  }
}

export interface GeneratorCategory {
  id: string
  name: string
  topics: {
    name: string
    color: string
  } | null
  questions: {
    id: string
    difficulty: 'easy' | 'medium' | 'hard'
  }[]
}

export interface ScoringConfig {
  id: string
  easy_points: number
  medium_points: number
  hard_points: number
  default_timer_seconds: number
  time_adjustment_seconds: number
  glow_enabled: boolean
  glow_intensity: number
  flash_start_seconds: number
  updated_at?: string
}
