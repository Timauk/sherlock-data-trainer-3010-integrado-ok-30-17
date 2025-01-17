import { LayersModel } from '@tensorflow/tfjs';

export interface SystemInfo {
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

export interface CheckpointData {
  timestamp: string;
  systemInfo: SystemInfo;
  gameState: any; // Adicionado gameState como any por enquanto
  csvData?: string;
}

export interface Checkpoint {
  model: LayersModel;
  data: CheckpointData;
}