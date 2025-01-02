import { FileManager } from './fileManager';
import { ModelManager } from './modelManager';
import { StateManager } from './stateManager';
import { logger } from '../logging/logger.js';
import path from 'path';
import fs from 'fs';

export class CheckpointManager {
  private static instance: CheckpointManager | null = null;
  private readonly checkpointPath: string;
  private readonly maxCheckpoints: number;
  private readonly fileManager: FileManager;
  private readonly modelManager: ModelManager;
  private readonly stateManager: StateManager;
  
  constructor() {
    this.checkpointPath = path.join(process.cwd(), 'checkpoints');
    this.maxCheckpoints = 50;
    
    this.fileManager = new FileManager(this.checkpointPath);
    this.modelManager = new ModelManager(this.fileManager);
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

    logger.info({
      checkpoint: checkpointDir,
      timestamp
    }, 'Starting complete checkpoint save');

    try {
      if (data.csvData) {
        await this.fileManager.writeFile(
          path.join(checkpointDir, 'dataset.csv'),
          data.csvData
        );
      }

      await this.stateManager.saveGameState(checkpointDir, data);

      if (data.gameState.model) {
        await this.modelManager.saveModel(data.gameState.model, checkpointDir);
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
      logger.info(`Complete checkpoint saved: ${path.basename(checkpointDir)}`);
      return path.basename(checkpointDir);

    } catch (error) {
      logger.error({ error, checkpoint: checkpointDir }, 'Error saving checkpoint');
      throw error;
    }
  }

  async loadLatestCheckpoint(): Promise<any> {
    const checkpoints = fs.readdirSync(this.checkpointPath)
      .filter(f => f.startsWith('checkpoint-'))
      .sort()
      .reverse();

    if (checkpoints.length === 0) {
      logger.warn('No checkpoints found');
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
        gameState.model = await this.modelManager.loadModel(checkpointDir);
      }

      logger.info('Checkpoint loaded successfully');
      return {
        timestamp: latestCheckpoint.replace('checkpoint-', ''),
        gameState,
        csvData
      };

    } catch (error) {
      logger.error({ error, checkpoint: checkpointDir }, 'Error loading checkpoint');
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
        logger.info(`Old checkpoint removed: ${checkpoint}`);
      }
    }
  }
}

export const checkpointManager = CheckpointManager.getInstance();