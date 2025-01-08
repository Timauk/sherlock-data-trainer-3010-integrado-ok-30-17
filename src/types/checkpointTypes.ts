import { LayersModel } from '@tensorflow/tfjs';
import { GameState } from './gameTypes';

export interface SystemInfo {
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

export interface CheckpointData {
  timestamp: string;
  systemInfo: SystemInfo;
  gameState: GameState;
  csvData?: string;
}

export interface CheckpointManifest {
  version: string;
  timestamp: string;
  files: string[];
}

export interface ModelManagerResponse {
  model?: LayersModel;
  error?: Error;
}