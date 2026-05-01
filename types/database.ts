export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          role: string
          created_at: string
          free_sessions_used: boolean
        }
        Insert: {
          id: string
          email?: string | null
          role?: string
          created_at?: string
          free_sessions_used?: boolean
        }
        Update: {
          id?: string
          email?: string | null
          role?: string
          created_at?: string
          free_sessions_used?: boolean
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          paddle_subscription_id: string | null
          status: string
          current_period_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          paddle_subscription_id?: string | null
          status: string
          current_period_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          paddle_subscription_id?: string | null
          status?: string
          current_period_end?: string | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          host_id: string
          mode: 'local' | 'remote'
          state: 'lobby' | 'playing' | 'finished'
          join_code: string | null
          current_question_index: number
          current_team_index: number
          created_at: string
        }
        Insert: {
          id?: string
          host_id: string
          mode: 'local' | 'remote'
          state?: 'lobby' | 'playing' | 'finished'
          join_code?: string | null
          current_question_index?: number
          current_team_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          mode?: 'local' | 'remote'
          state?: 'lobby' | 'playing' | 'finished'
          join_code?: string | null
          current_question_index?: number
          current_team_index?: number
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          session_id: string
          name: string
          color: string
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          color: string
          score?: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          color?: string
          score?: number
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          session_id: string
          team_id: string | null
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          team_id?: string | null
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          team_id?: string | null
          name?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          created_at?: string
        }
      }
      themes: {
        Row: {
          id: string
          name: string
          is_default: boolean
          config: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          is_default?: boolean
          config: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_default?: boolean
          config?: Json
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          category_id: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          question: string
          answer: string
          media_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          question: string
          answer: string
          media_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          question?: string
          answer?: string
          media_url?: string | null
          created_at?: string
        }
      }
      session_questions: {
        Row: {
          id: string
          session_id: string
          question_id: string
          category_id: string | null
          team_id: string | null
          difficulty: string | null
          order_index: number | null
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          category_id?: string | null
          team_id?: string | null
          difficulty?: string | null
          order_index?: number | null
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          category_id?: string | null
          team_id?: string | null
          difficulty?: string | null
          order_index?: number | null
          used?: boolean
          created_at?: string
        }
      }
      session_categories: {
        Row: {
          id: string
          session_id: string
          category_id: string
        }
        Insert: {
          id?: string
          session_id: string
          category_id: string
        }
        Update: {
          id?: string
          session_id?: string
          category_id?: string
        }
      }
      scoring_config: {
        Row: {
          id: string
          easy_points: number
          medium_points: number
          hard_points: number
          default_timer_seconds: number
          updated_at: string
        }
        Insert: {
          id?: string
          easy_points?: number
          medium_points?: number
          hard_points?: number
          default_timer_seconds?: number
          updated_at?: string
        }
        Update: {
          id?: string
          easy_points?: number
          medium_points?: number
          hard_points?: number
          default_timer_seconds?: number
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          type: 'session' | 'subscription'
          status: 'pending' | 'completed' | 'failed'
          paddle_transaction_id: string | null
          amount: number | null
          currency: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'session' | 'subscription'
          status: 'pending' | 'completed' | 'failed'
          paddle_transaction_id?: string | null
          amount?: number | null
          currency?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'session' | 'subscription'
          status?: 'pending' | 'completed' | 'failed'
          paddle_transaction_id?: string | null
          amount?: number | null
          currency?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_team_score: {
        Args: {
          team_id: string
          points_to_add: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

