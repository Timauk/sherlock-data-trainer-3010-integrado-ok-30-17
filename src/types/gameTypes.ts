import type { LayersModel } from '@tensorflow/tfjs';

export interface ModelVisualization {
  predictions: Array<{
    number: number;
    probability: number;
  }>;
}

export interface Player {
  id: number;
  name: string;
  score: number;
  weights: number[];
  generation: number;
  matches: number;
  fitness: number;
  isChampion?: boolean;
  predictions?: number[];
  lastPrediction?: number[];
}

export interface GameState {
  players: Player[];
  generation: number;
  champion: Player | null;
  boardNumbers: number[];
  concursoNumber: number;
  isPlaying: boolean;
  model: LayersModel | null;
  evolutionData: Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>;
  frequencyData: Record<string, number[]>;
  dates: Date[];
  numbers: number[][];
}

export interface DiagnosticResult {
  phase: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface SystemMetrics {
  accuracy: number;
  randomAccuracy: number;
  totalPredictions: number;
  modelVisualization?: ModelVisualization;
}

export interface TrainingMetrics {
  loss: number;
  accuracy: number;
  epoch: number;
  validationLoss?: number;
  validationAccuracy?: number;
}