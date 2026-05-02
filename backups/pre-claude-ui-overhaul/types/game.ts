// Game domain types

export type GameMode = 'local' | 'remote'
export type SessionState = 'lobby' | 'playing' | 'finished'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GamePhase = 'lobby' | 'playing' | 'reveal' | 'finished'
export type MascotState = 'idle' | 'correct' | 'wrong' | 'punishment' | 'thinking' | 'hype' | 'angry'

export interface Session {
  id: string
  host_id: string
  mode: GameMode
  state: SessionState
  join_code: string | null
  current_question_index: number
  current_team_index: number
  created_at: string
}

export interface Team {
  id: string
  session_id: string
  name: string
  color: string
  score: number
}

export interface Player {
  id: string
  session_id: string
  team_id: string | null
  name: string
}

export interface Category {
  id: string
  name: string
  icon?: string | null
  emoji?: string | null
  color?: string | null
  image_url?: string | null
}

export interface Question {
  id: string
  category_id: string | null
  difficulty: Difficulty
  question: string
  answer: string
  image_url?: string | null
  media_url: string | null
  points?: number
}

export interface SessionQuestion {
  id: string
  session_id: string
  question_id: string
  category_id: string | null
  order_index: number | null
  used: boolean
  question?: Question
  team_id?: string | null
}

export interface ScoringConfig {
  easy_points: number
  medium_points: number
  hard_points: number
  default_timer_seconds: number
  time_adjustment_seconds: number
  glow_enabled: boolean
  glow_intensity: number
  flash_start_seconds: number
}

export interface ThemeConfig {
  background: {
    type: 'color' | 'image' | 'gradient'
    value: string
  }
  colors: {
    primary: string
    accent: string
    surface: string
    text: string
  }
  font: string
  animation: 'fade' | 'slide' | 'zoom'
  card_style: 'glass' | 'solid' | 'outline'
}

export interface GameState {
  sessionId: string
  mode: GameMode
  phase: GamePhase
  teams: Team[]
  players: Player[]
  streaks: Record<string, number>
  sessionQuestions: SessionQuestion[]
  categories: Category[]
  selectedQuestion: (SessionQuestion & { question: Question }) | null
  currentQuestionIndex: number
  currentTeamIndex: number
  timer: number
  timerActive: boolean
  mascotState: MascotState
  isRevealed: boolean
  isTalking: boolean
  scoringConfig: ScoringConfig
  thinkingCount: number
}
