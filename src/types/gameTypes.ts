export interface Player {
  id: number;
  score: number;
  predictions: number[];
  weights: number[];
  fitness: number;
  generation: number;
}

export interface ModelVisualization {
  input: number[];
  output: number[];
  weights: number[][];
}

export interface ModelMetrics {
  accuracy: number;
  randomAccuracy: number;
  totalPredictions: number;
  perGameAccuracy?: number;
  perGameRandomAccuracy?: number;
}

export interface TraditionalPlayerStats {
  score: number;
  matches: number;
  predictions: number[] | number[][];
}

export interface GameState {
  players: Player[];
  generation: number;
  gameCount: number;
  evolutionData: Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>;
  traditionalPlayerStats: TraditionalPlayerStats;
  modelMetrics: ModelMetrics;
  boardNumbers: number[];
  concursoNumber: number;
  isInfiniteMode: boolean;
  trainingData: number[][];
}