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
      historical_games: {
        Row: {
          id: number
          concurso: number
          data: string
          numeros: number[]
          created_at: string
        }
        Insert: {
          id?: number
          concurso: number
          data: string
          numeros: number[]
          created_at?: string
        }
        Update: {
          id?: number
          concurso?: number
          data?: string
          numeros?: number[]
          created_at?: string
        }
      }
      webhooks: {
        Row: {
          id: number
          url: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          url: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          url?: string
          active?: boolean
          created_at?: string
        }
      }
      players: {
        Row: {
          id: number
          dna: Json
          score: number
          generation: number
          parent_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          dna: Json
          score: number
          generation: number
          parent_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          dna?: Json
          score?: number
          generation?: number
          parent_id?: number | null
          created_at?: string
        }
      }
      predictions: {
        Row: {
          id: number
          player_id: number
          numbers: number[]
          confidence: number
          created_at: string
        }
        Insert: {
          id?: number
          player_id: number
          numbers: number[]
          confidence: number
          created_at?: string
        }
        Update: {
          id?: number
          player_id?: number
          numbers?: number[]
          confidence?: number
          created_at?: string
        }
      }
      performance_metrics: {
        Row: {
          id: number
          player_id: number
          accuracy: number
          matches: number
          timestamp: string
        }
        Insert: {
          id?: number
          player_id: number
          accuracy: number
          matches: number
          timestamp?: string
        }
        Update: {
          id?: number
          player_id?: number
          accuracy?: number
          matches?: number
          timestamp?: string
        }
      }
    }
    Functions: {
      get_player_lineage: {
        Args: { player_id: number }
        Returns: {
          id: number
          generation: number
          parent_id: number | null
          dna: Json
          created_at: string
          performance_metrics: Json
        }[]
      }
      calculate_player_metrics: {
        Args: { player_id: number }
        Returns: { accuracy: number; matches: number }
      }
      update_player_dna: {
        Args: { player_id: number; new_dna: Json }
        Returns: boolean
      }
    }
    Views: {
      player_statistics: {
        Row: {
          player_id: number
          avg_accuracy: number
          total_matches: number
          predictions_count: number
        }
      }
    }
  }
}
