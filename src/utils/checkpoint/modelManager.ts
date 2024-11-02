import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import path from 'path';
import { FileManager } from './fileManager';
import { logger } from '../../utils/logging/logger.js';

export class ModelManager {
  constructor(private fileManager: FileManager) {}

  async saveModel(model: tf.LayersModel, checkpointDir: string) {
    const modelPath = path.join(checkpointDir, 'model');
    await model.save(`file://${modelPath}`);
    
    // Salvar estado do otimizador
    const optimizerState = await model.optimizer?.getWeights();
    if (optimizerState) {
      const optimizerBuffer = await tf.io.encodeWeights(optimizerState);
      await this.fileManager.writeFile(
        path.join(checkpointDir, 'optimizer_state.bin'),
        optimizerBuffer.data,
        true
      );
    }
    
    logger.debug('Modelo e otimizador salvos');
  }

  async loadModel(checkpointDir: string): Promise<tf.LayersModel | null> {
    const modelPath = path.join(checkpointDir, 'model');
    if (!fs.existsSync(`${modelPath}.json`)) return null;

    const model = await tf.loadLayersModel(`file://${modelPath}`);
    
    // Carregar estado do otimizador
    const optimizerBuffer = await this.fileManager.readFile(
      path.join(checkpointDir, 'optimizer_state.bin'),
      true
    );
    
    if (optimizerBuffer && model.optimizer) {
      const weightSpecs = model.optimizer.getConfig().weightSpecs || [];
      const weights = tf.io.decodeWeights(optimizerBuffer, weightSpecs);
      const weightList = Object.entries(weights).map(([name, tensor]) => ({
        name,
        tensor
      }));
      await model.optimizer.setWeights(weightList);
    }
    
    return model;
  }
}