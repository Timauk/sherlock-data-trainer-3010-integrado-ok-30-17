import { ModelArtifacts, ModelArtifactsInfo } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import path from 'path';
import fs from 'fs';

export class CheckpointManager {
  private static instance: CheckpointManager | null = null;
  private readonly checkpointPath: string;
  private readonly maxCheckpoints: number;
  private readonly fileManager: FileManager;
  private readonly modelManager: ModelManager;
  private readonly stateManager: StateManager;
  
  private constructor() {
    this.checkpointPath = path.join(process.cwd(), 'checkpoints');
    this.maxCheckpoints = 50;
    
    this.fileManager = new FileManager(this.checkpointPath);
    this.modelManager = new ModelManager();
    this.stateManager = new StateManager(this.fileManager);
  }

  static getInstance(): CheckpointManager {
    if (!CheckpointManager.instance) {
      CheckpointManager.instance = new CheckpointManager();
    }
    return CheckpointManager.instance;
  }

  async saveCheckpoint(data: any): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const checkpointDir = path.join(this.checkpointPath, `checkpoint-${timestamp}`);

    try {
      if (data.csvData) {
        await this.fileManager.writeFile(
          path.join(checkpointDir, 'dataset.csv'),
          data.csvData
        );
      }

      await this.stateManager.saveGameState(checkpointDir, data);

      if (data.gameState.model) {
        const artifactsInfo: ModelArtifactsInfo = {
          dateSaved: new Date(),
          modelTopologyType: 'JSON',
          modelTopologyBytes: 0,
          weightSpecsBytes: 0,
          weightDataBytes: 0
        };
        await this.modelManager.saveModel(data.gameState.model, artifactsInfo);
      }

      await this.fileManager.writeFile(
        path.join(checkpointDir, 'manifest.json'),
        {
          version: '1.1',
          timestamp,
          files: [
            'dataset.csv',
            'gameState.json',
            'model.json',
            'model.weights.bin',
            'optimizer_state.bin',
            'training_data.json',
            'predictions_cache.json',
            'evolution_history.json',
            'environment_config.json'
          ]
        }
      );

      await this.cleanOldCheckpoints();
      return path.basename(checkpointDir);

    } catch (error) {
      throw error;
    }
  }

  async loadLatestCheckpoint(): Promise<any> {
    const checkpoints = fs.readdirSync(this.checkpointPath)
      .filter(f => f.startsWith('checkpoint-'))
      .sort()
      .reverse();

    if (checkpoints.length === 0) {
      return null;
    }

    const latestCheckpoint = checkpoints[0];
    const checkpointDir = path.join(this.checkpointPath, latestCheckpoint);

    try {
      const manifest = await this.fileManager.readFile(
        path.join(checkpointDir, 'manifest.json')
      );

      const csvData = await this.fileManager.readFile(
        path.join(checkpointDir, 'dataset.csv')
      );

      const gameState = await this.stateManager.loadGameState(checkpointDir);

      if (gameState) {
        gameState.model = await this.modelManager.loadModel();
      }

      return {
        timestamp: latestCheckpoint.replace('checkpoint-', ''),
        gameState,
        csvData
      };

    } catch (error) {
      throw error;
    }
  }

  private async cleanOldCheckpoints(): Promise<void> {
    const checkpoints = fs.readdirSync(this.checkpointPath)
      .filter(f => f.startsWith('checkpoint-'))
      .sort();

    if (checkpoints.length > this.maxCheckpoints) {
      const checkpointsToDelete = checkpoints.slice(0, checkpoints.length - this.maxCheckpoints);
      for (const checkpoint of checkpointsToDelete) {
        const checkpointPath = path.join(this.checkpointPath, checkpoint);
        await fs.promises.rm(checkpointPath, { recursive: true });
      }
    }
  }
}

export const checkpointManager = CheckpointManager.getInstance();