import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { logger } from '../logging/logger.js';

// Usando type ao invés de interface e exportando como módulo ES
export type WeightData = {
  weights: number[];
  shape: number[];
};

export class ModelManager {
  async saveModel(model: tf.LayersModel, artifactsInfo: any): Promise<void> {
    if (!model) {
      throw new Error('Modelo não fornecido para salvamento');
    }

    const modelPath = path.join(process.cwd(), 'models');
    const modelFile = path.join(modelPath, `${artifactsInfo.dateSaved.toISOString()}`);

    try {
      await fs.promises.mkdir(modelPath, { recursive: true });

      const modelJson = model.toJSON();
      await fs.promises.writeFile(
        `${modelFile}.json`,
        JSON.stringify(modelJson)
      );

      await model.save(`file://${modelFile}`);
      logger.info('Modelo salvo com sucesso');
    } catch (error) {
      logger.error({ error }, 'Erro ao salvar modelo');
      throw error;
    }
  }

  async loadModel(): Promise<tf.LayersModel | undefined> {
    try {
      const modelPath = path.join(process.cwd(), 'models');
      const files = await fs.promises.readdir(modelPath);
      const modelFile = files.find(file => file.endsWith('.json'));

      if (!modelFile) {
        logger.warn('Nenhum modelo encontrado');
        return undefined;
      }

      const model = await tf.loadLayersModel(`file://${path.join(modelPath, modelFile)}`);
      logger.info('Modelo carregado com sucesso');
      return model;
    } catch (error) {
      logger.error({ error }, 'Erro ao carregar modelo');
      return undefined;
    }
  }
}