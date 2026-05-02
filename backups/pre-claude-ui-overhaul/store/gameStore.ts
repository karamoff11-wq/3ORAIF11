import { create } from 'zustand'
import { 
  GameState, 
  GameMode, 
  GamePhase, 
  Team, 
  Player, 
  SessionQuestion, 
  ScoringConfig,
  MascotState
} from '@/types/game'

export interface Category {
  id: string
  name: string
  icon?: string
  image_url?: string
}

interface GameActions {
  setSession: (sessionId: string, mode: GameMode) => void
  setPhase: (phase: GamePhase) => void
  setTeams: (teams: Team[]) => void
  setPlayers: (players: Player[]) => void
  setQuestions: (questions: SessionQuestion[]) => void
  setCurrentQuestion: (index: number) => void
  setCurrentTeam: (index: number) => void
  updateScore: (teamId: string, score: number) => void
  updateStreak: (teamId: string, reset?: boolean) => void
  setTimer: (seconds: number) => void
  setTimerActive: (active: boolean) => void
  setMascotState: (state: MascotState) => void
  setRevealed: (revealed: boolean) => void
  setScoringConfig: (config: ScoringConfig) => void
  setCategories: (cats: Category[]) => void
  setSelectedQuestion: (q: any | null) => void
  markQuestionUsed: (sqId: string) => void
  resetGame: () => void
  setIsTalking: (isTalking: boolean) => void
  incrementThinkingCount: () => void
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  sessionId: '',
  mode: 'local',
  phase: 'lobby',
  teams: [],
  players: [],
  streaks: {} as Record<string, number>,
  sessionQuestions: [],
  categories: [] as Category[],
  selectedQuestion: null as any,
  currentQuestionIndex: 0,
  currentTeamIndex: 0,
  timer: 30,
  timerActive: false,
  mascotState: 'idle',
  isRevealed: false,
  isTalking: false,
  scoringConfig: {
    easy_points: 100,
    medium_points: 200,
    hard_points: 300,
    default_timer_seconds: 30,
    time_adjustment_seconds: 5,
    glow_enabled: true,
    glow_intensity: 40,
    flash_start_seconds: 15
  },
  thinkingCount: 0,

  setSession: (sessionId, mode) => set({ sessionId, mode }),
  setPhase: (phase) => set({ phase }),
  setTeams: (teams) => set({ teams }),
  setPlayers: (players) => set({ players }),
  setQuestions: (sessionQuestions) => set({ sessionQuestions }),
  setCurrentQuestion: (currentQuestionIndex) => set({ currentQuestionIndex, isRevealed: false }),
  setCurrentTeam: (currentTeamIndex) => set({ currentTeamIndex }),
  updateScore: (teamId, score) => set((state) => ({
    teams: state.teams.map(t => t.id === teamId ? { ...t, score } : t)
  })),
  updateStreak: (teamId, reset) => set((state) => ({
    streaks: {
      ...state.streaks,
      [teamId]: reset ? 0 : (state.streaks[teamId] || 0) + 1
    }
  })),
  setTimer: (timer) => set({ timer }),
  setTimerActive: (timerActive) => set({ timerActive }),
  setMascotState: (mascotState) => set({ mascotState }),
  setRevealed: (isRevealed) => set({ isRevealed }),
  setScoringConfig: (scoringConfig) => set({ scoringConfig }),
  setCategories: (categories) => set({ categories }),
  setSelectedQuestion: (selectedQuestion) => set({ selectedQuestion, isRevealed: false }),
  markQuestionUsed: (sqId) => set((state) => ({
    sessionQuestions: state.sessionQuestions.map(q =>
      q.id === sqId ? { ...q, used: true } : q
    )
  })),
  resetGame: () => set({
    phase: 'lobby',
    currentQuestionIndex: 0,
    currentTeamIndex: 0,
    timerActive: false,
    isRevealed: false,
    mascotState: 'idle',
    isTalking: false,
    selectedQuestion: null,
    thinkingCount: 0
  }),
  setIsTalking: (isTalking) => set({ isTalking }),
  incrementThinkingCount: () => set((state) => ({ thinkingCount: state.thinkingCount + 1 }))
}))
