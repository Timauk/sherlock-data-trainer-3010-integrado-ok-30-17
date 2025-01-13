import * as tf from '@tensorflow/tfjs';
import { ModelArtifacts } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export class ModelManager {
  private static instance: ModelManager | null = null;

  private constructor() {}

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  async saveModel(model: tf.LayersModel, metadata?: any): Promise<void> {
    try {
      const artifacts = await model.save('indexeddb://current-model');
      systemLogger.log('model', 'Modelo salvo com sucesso', { artifacts });
    } catch (error) {
      systemLogger.log('system', 'Erro ao salvar modelo', { error });
      throw error;
    }
  }

  async loadModel(): Promise<tf.LayersModel | null> {
    try {
      const model = await tf.loadLayersModel('indexeddb://current-model');
      systemLogger.log('model', 'Modelo carregado com sucesso');
      return model;
    } catch (error) {
      systemLogger.log('system', 'Erro ao carregar modelo', { error });
      return null;
    }
  }

  async deleteModel(): Promise<void> {
    try {
      await tf.io.removeModel('indexeddb://current-model');
      systemLogger.log('model', 'Modelo excluído com sucesso');
    } catch (error) {
      systemLogger.log('system', 'Erro ao excluir modelo', { error });
      throw error;
    }
  }
}

export const modelManagementSystem = {
  async saveModel(model: tf.LayersModel, metadata?: any): Promise<void> {
    try {
      const artifacts = await model.save('indexeddb://current-model');
      systemLogger.log('model', 'Modelo salvo com sucesso', { artifacts });
    } catch (error) {
      systemLogger.log('system', 'Erro ao salvar modelo', { error });
      throw error;
    }
  },

  async loadModel(): Promise<tf.LayersModel | null> {
    try {
      const model = await tf.loadLayersModel('indexeddb://current-model');
      systemLogger.log('model', 'Modelo carregado com sucesso');
      return model;
    } catch (error) {
      systemLogger.log('system', 'Erro ao carregar modelo', { error });
      return null;
    }
  },

  async deleteModel(): Promise<void> {
    try {
      await tf.io.removeModel('indexeddb://current-model');
      systemLogger.log('model', 'Modelo excluído com sucesso');
    } catch (error) {
      systemLogger.log('system', 'Erro ao excluir modelo', { error });
      throw error;
    }
  }
};