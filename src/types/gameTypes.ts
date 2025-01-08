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
}

export interface ModelArtifacts {
  modelTopology: any;
  weightSpecs: any[];
  weightData: ArrayBuffer;
  format?: string;
  generatedBy?: string;
  convertedBy?: string;
  modelInitializer?: string;
  trainingConfig?: any;
  weightsManifest?: any[];
  modelArtifactsInfo?: any;
}