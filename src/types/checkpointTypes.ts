import { LayersModel } from '@tensorflow/tfjs';
import { GameState } from './gameTypes';

export interface CheckpointData {
  timestamp: string;
  systemInfo: {
    totalMemory: number;
    freeMemory: number;
    uptime: number;
  };
  gameState: GameState;
  csvData?: string;
}

export interface CheckpointManifest {
  version: string;
  timestamp: string;
  files: string[];
}