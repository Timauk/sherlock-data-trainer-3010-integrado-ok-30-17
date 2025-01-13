import { FileManager } from '../checkpoint/fileManager';
import { ModelManager } from '../integrated/modelManagementSystem';
import { StateManager } from './stateManager';
import { logger } from '../logging/logger';
import { ModelArtifactsInfo } from '@/types/gameTypes';
import { CheckpointData, CheckpointManifest, ModelMetadata } from '@/types/checkpointTypes';
import path from 'path';
import fs from 'fs';

class CheckpointManager {
  static instance: CheckpointManager | null = null;
  private readonly checkpointPath: string;
  private readonly maxCheckpoints: number;
  private readonly fileManager: FileManager;
  private readonly modelManager: ModelManager;
  private readonly stateManager: StateManager;
  
  private constructor() {
    this.checkpointPath = path.join(process.cwd(), 'checkpoints');
    this.maxCheckpoints = 50;
    
    this.fileManager = new FileManager(this.checkpointPath);
    this.modelManager = ModelManager.getInstance();
    this.stateManager = new StateManager(this.fileManager);
  }

  static getInstance(): CheckpointManager {
    if (!CheckpointManager.instance) {
      CheckpointManager.instance = new CheckpointManager();
    }
    return CheckpointManager.instance;
  }

  private convertToModelMetadata(artifactsInfo: ModelArtifactsInfo): ModelMetadata {
    return {
      timestamp: artifactsInfo.dateSaved.toISOString(),
      architecture: ['dense'],
      performance: {
        accuracy: 0,
        loss: 0
      },
      trainingIterations: 0
    };
  }

  async saveCheckpoint(data: CheckpointData): Promise<string> {
    if (!data || !data.gameState) {
      throw new Error('Dados inválidos para checkpoint');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const checkpointDir = path.join(this.checkpointPath, `checkpoint-${timestamp}`);

    logger.info({
      checkpoint: checkpointDir,
      timestamp
    }, 'Iniciando salvamento de checkpoint');

    try {
      if (data.csvData) {
        await this.fileManager.writeFile(
          path.join(checkpointDir, 'dataset.csv'),
          data.csvData
        );
      }

      await this.stateManager.saveGameState(checkpointDir, data);

      if (data.gameState?.model) {
        const artifactsInfo: ModelArtifactsInfo = {
          dateSaved: new Date(),
          modelTopologyType: 'layers',
          modelTopologyBytes: 0,
          weightSpecsBytes: 0,
          weightDataBytes: 0
        };
        const metadata = this.convertToModelMetadata(artifactsInfo);
        await this.modelManager.saveModel(data.gameState.model, metadata);
      }

      const manifest: CheckpointManifest = {
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
      };

      await this.fileManager.writeFile(
        path.join(checkpointDir, 'manifest.json'),
        manifest
      );

      await this.cleanOldCheckpoints();
      logger.info(`Checkpoint salvo: ${path.basename(checkpointDir)}`);
      return path.basename(checkpointDir);

    } catch (error) {
      logger.error({ error, checkpoint: checkpointDir }, 'Erro ao salvar checkpoint');
      throw error;
    }
  }

  async loadLatestCheckpoint(): Promise<CheckpointData | undefined> {
    const checkpoints = fs.readdirSync(this.checkpointPath)
      .filter(f => f.startsWith('checkpoint-'))
      .sort()
      .reverse();

    if (checkpoints.length === 0) {
      logger.warn('Nenhum checkpoint encontrado');
      return undefined;
    }

    const latestCheckpoint = checkpoints[0];
    const checkpointDir = path.join(this.checkpointPath, latestCheckpoint);

    try {
      const manifest = await this.fileManager.readFile<CheckpointManifest>(
        path.join(checkpointDir, 'manifest.json')
      );

      if (!manifest) {
        throw new Error('Manifesto do checkpoint não encontrado');
      }

      const csvData = await this.fileManager.readFile<string>(
        path.join(checkpointDir, 'dataset.csv')
      );

      const gameState = await this.stateManager.loadGameState(checkpointDir);

      if (gameState) {
        const model = await this.modelManager.loadModel();
        if (model) {
          gameState.model = model;
        }
      }

      return {
        timestamp: latestCheckpoint.replace('checkpoint-', ''),
        systemInfo: {
          totalMemory: process.memoryUsage().heapTotal,
          freeMemory: process.memoryUsage().heapUsed,
          uptime: process.uptime()
        },
        gameState: gameState!,
        csvData
      };

    } catch (error) {
      logger.error({ error, checkpoint: checkpointDir }, 'Erro ao carregar checkpoint');
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
        logger.info(`Checkpoint antigo removido: ${checkpoint}`);
      }
    }
  }
}

export const checkpointManager = CheckpointManager.getInstance();