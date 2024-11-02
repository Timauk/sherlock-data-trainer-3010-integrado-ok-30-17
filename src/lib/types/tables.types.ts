import { Json } from './json.types';

export interface Tables {
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
    Relationships: []
  }
  trained_models: {
    Row: {
      id: number
      model_data: Json
      metadata: Json
      is_active: boolean
      created_at: string
    }
    Insert: {
      id?: number
      model_data: Json
      metadata: Json
      is_active?: boolean
      created_at?: string
    }
    Update: {
      id?: number
      model_data?: Json
      metadata?: Json
      is_active?: boolean
      created_at?: string
    }
    Relationships: []
  }
}