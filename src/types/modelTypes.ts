export interface ModelVisualization {
  input: number[];
  output: number[];
  weights: number[][];
}

export interface EvolutionData {
  generation: number;
  playerId: number;
  score: number;
  fitness: number;
}