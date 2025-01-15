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
  predictions: number[];
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
  evolutionData: EvolutionDataEntry[];
  frequencyData: Record<string, number[]>;
  dates: Date[];
  numbers: number[][];
}

export interface ChampionData {
  player: Player;
  trainingData: number[][];
}

export interface EvolutionDataEntry {
  generation: number;
  playerId: number;
  score: number;
  fitness: number;
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

export interface ModelArtifacts {
  modelTopology: any;
  weightSpecs: any[];
  weightData: ArrayBuffer;
  format?: string;
  generatedBy?: string;
  convertedBy?: string;
  modelInitializer?: any;
  trainingConfig?: any;
  weightsManifest?: any[];
}

export interface AnalysisTabsProps {
  numbers: number[][];
  dates: Date[];
  modelMetrics: {
    accuracy: number;
    randomAccuracy: number;
    totalPredictions: number;
  };
  neuralNetworkVisualization?: ModelVisualization;
  onFrequencyUpdate: (data: Record<string, number[]>) => void;
  boardNumbers: number[];
}

export interface DataUploaderProps {
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File) => void;
  onSaveModel: () => void;
}