import { Json } from '@/lib/database.types';

export interface TrainingMetadata {
  timestamp: string;
  accuracy: number;
  loss: number;
  epochs: number;
  gamesCount?: number;
  weightsData?: number[][];
}

export interface ModelData {
  model_data: Json;
  metadata: Json;
  is_active?: boolean;
}

export interface TrainingResult {
  updated: boolean;
  message: string;
}

export interface ModelExport {
  json: any;
  weights: number[][];
}