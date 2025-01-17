import * as tf from '@tensorflow/tfjs';
import { ModelManager } from '../integrated/modelManagementSystem';
import { systemLogger } from '../logging/systemLogger';

class CheckpointManager {
  private modelManager: ModelManager;

  constructor() {
    this.modelManager = ModelManager.getInstance();
  }

  async saveCheckpoint(model: tf.LayersModel, metadata?: any): Promise<void> {
    try {
      await this.modelManager.saveModel(model, metadata);
      systemLogger.log('checkpoint', 'Checkpoint salvo com sucesso');
    } catch (error) {
      systemLogger.log('system', 'Erro ao salvar checkpoint', { error });
      throw error;
    }
  }

  async loadCheckpoint(): Promise<tf.LayersModel | null> {
    try {
      const model = await this.modelManager.loadModel();
      systemLogger.log('checkpoint', 'Checkpoint carregado com sucesso');
      return model;
    } catch (error) {
      systemLogger.log('system', 'Erro ao carregar checkpoint', { error });
      return null;
    }
  }

  async deleteCheckpoint(): Promise<void> {
    try {
      await this.modelManager.deleteModel();
      systemLogger.log('checkpoint', 'Checkpoint excluído com sucesso');
    } catch (error) {
      systemLogger.log('system', 'Erro ao excluir checkpoint', { error });
      throw error;
    }
  }
}

export const checkpointManager = new CheckpointManager();
