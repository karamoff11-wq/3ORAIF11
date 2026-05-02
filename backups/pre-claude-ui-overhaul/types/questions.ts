export interface Category {
  id: string
  name: string           // e.g. "كرة القدم"
  topicName?: string     // e.g. "دوري أبطال أوروبا"
  specialRules?: string  // injected from rules engine
}

export interface SessionConfig {
  sessionId: string
  teams: 2 | 3 | 4
  categories: Category[] // exactly 6
  language?: 'ar' | 'en'
}

export interface Question {
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  categoryId: string
}
