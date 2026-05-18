import { create } from 'zustand'
import { 
  GameState, 
  GameMode, 
  GamePhase, 
  Team, 
  Player, 
  SessionQuestion, 
  ScoringConfig,
  MascotState,
  Question
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
  setSelectedQuestion: (q: (SessionQuestion & { question: Question }) | null) => void
  markQuestionUsed: (sqId: string) => void
  resetGame: () => void
  setIsTalking: (isTalking: boolean) => void
  incrementThinkingCount: () => void
  setIsHost: (isHost: boolean) => void
  setPlayerTeamId: (id: string | null) => void
  setBuzzedTeamId: (id: string | null) => void
  setMediaRevealed: (revealed: boolean) => void
  setBroadcastChannel: (ch: import('@supabase/supabase-js').RealtimeChannel | null) => void
  setPunishmentConfig: (mode: import('@/types/game').PunishmentMode | null, punishments: import('@/types/game').Punishment[]) => void
  triggerPunishmentPopup: (team: Team) => void
  closePunishmentPopup: () => void
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  sessionId: '',
  mode: 'local',
  phase: 'lobby',
  teams: [],
  players: [],
  streaks: {} as Record<string, number>,
  sessionQuestions: [],
  categories: [] as Category[],
  selectedQuestion: null as (SessionQuestion & { question: Question }) | null,
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
  isHost: false,
  playerTeamId: null,
  buzzedTeamId: null,
  mediaRevealed: false,
  broadcastChannel: null,
  punishmentMode: null,
  punishments: [],
  activePunishment: null,
  punishmentEscalationLevel: 1,

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
    thinkingCount: 0,
    buzzedTeamId: null,
    activePunishment: null,
    punishmentMode: null,
    punishments: []
  }),
  setIsTalking: (isTalking) => set({ isTalking }),
  incrementThinkingCount: () => set((state) => ({ thinkingCount: state.thinkingCount + 1 })),
  setIsHost: (isHost) => set({ isHost }),
  setPlayerTeamId: (playerTeamId) => set({ playerTeamId }),
  setBuzzedTeamId: (buzzedTeamId) => set({ buzzedTeamId }),
  setMediaRevealed: (mediaRevealed) => set({ mediaRevealed }),
  setBroadcastChannel: (broadcastChannel) => set({ broadcastChannel }),
  setPunishmentConfig: (punishmentMode, punishments) => set({ punishmentMode, punishments }),
  triggerPunishmentPopup: (team) => {
    const { punishmentMode, punishments, punishmentEscalationLevel } = get()
    if (!punishmentMode || punishmentMode === 'off' || punishments.length === 0) return

    let selected: import('@/types/game').Punishment
    if (punishmentMode === 'escalating') {
      const candidates = punishments.filter(p => p.level === punishmentEscalationLevel && p.enabled)
      const pool = candidates.length > 0 ? candidates : punishments.filter(p => p.enabled)
      selected = pool[Math.floor(Math.random() * pool.length)] || punishments[0]
      const nextLevel = (punishmentEscalationLevel < 3 ? punishmentEscalationLevel + 1 : 3) as 1 | 2 | 3
      set({ punishmentEscalationLevel: nextLevel })
    } else {
      const pool = punishments.filter(p => p.enabled)
      const activePool = pool.length > 0 ? pool : punishments
      selected = activePool[Math.floor(Math.random() * activePool.length)] || punishments[0]
    }

    set({ activePunishment: { team, punishment: selected, mode: punishmentMode } })
  },
  closePunishmentPopup: () => set({ activePunishment: null })
}))
