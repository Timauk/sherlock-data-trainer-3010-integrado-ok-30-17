import * as tf from '@tensorflow/tfjs';

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

export interface GameState {
  model: tf.LayersModel | null;
  players: Player[];
  generation: number;
  score: number;
}

export interface ModelMetrics {
  accuracy: number;
  predictionConfidence?: number;
}