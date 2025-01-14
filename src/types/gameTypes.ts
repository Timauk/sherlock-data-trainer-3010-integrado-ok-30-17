import * as tf from '@tensorflow/tfjs';
import { Optional, Nullable } from './utils';

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
  predictionConfidence?: number;
  perGameAccuracy?: number;
  perGameRandomAccuracy?: number;
}

export interface ModelArtifactsInfo {
  dateSaved: Date;
  modelTopologyType: string;
  modelTopologyBytes: number;
  weightSpecsBytes: number;
  weightDataBytes: number;
}

export interface WeightSpecs {
  name: string;
  shape: number[];
  dtype: 'float32' | 'int32' | 'bool' | 'string' | 'complex64';
}

export interface ModelArtifacts {
  modelTopology: any;
  weightSpecs: WeightSpecs[];
  weightData: ArrayBuffer;
  format?: string;
  generatedBy?: string;
  convertedBy: string;
  modelInitializer?: string;
  trainingConfig?: any;
  weightsManifest?: any[];
  modelArtifactsInfo?: ModelArtifactsInfo;
}

export interface PredictionResult {
  numbers: number[];
  confidence: number;
  matchCount?: number;
}

export interface GameState {
  players: Player[];
  generation: number;
  evolutionData: EvolutionDataEntry[];
  boardNumbers: number[];
  concursoNumber: number;
  isInfiniteMode: boolean;
  trainingData: number[][];
  model?: Nullable<tf.LayersModel>;
}

export interface EvolutionDataEntry {
  generation: number;
  playerId: number;
  score: number;
  fitness: number;
}

export interface LunarData {
  lunarPhase: string;
  lunarPatterns: Record<string, number[]>;
}

export interface TimeSeriesData {
  numbers: number[][];
  dates: Date[];
}

export interface ChampionData {
  player: Player;
  trainingData: number[][];
}

export interface ModelManagerResponse {
  model: Optional<tf.LayersModel>;
  metadata: Optional<any>;
}

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  cleanedData?: number[][];
};

export interface Weight {
  name: string;
  value: number;
  description: string;
}

export interface PlayerWeights {
  [key: string]: number;
}

export interface GameConfig {
  maxPlayers: number;
  generationSize: number;
  mutationRate: number;
  crossoverRate: number;
  elitismCount: number;
}