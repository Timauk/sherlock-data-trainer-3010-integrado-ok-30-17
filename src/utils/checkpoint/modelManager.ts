import * as tf from '@tensorflow/tfjs';
import { FileManager } from './fileManager';
import { logger } from '../../utils/logging/logger.js';

export class ModelManager {
  constructor(private fileManager: FileManager) {}

  async saveModel(model: tf.LayersModel, checkpointDir: string) {
    const modelPath = path.join(checkpointDir, 'model');
    await model.save(`file://${modelPath}`);
    
    // Salvar estado do otimizador
    const optimizerState = await model.optimizer.getWeights();
    const optimizerBuffer = tf.io.encodeWeights(optimizerState);
    await this.fileManager.writeFile(
      path.join(checkpointDir, 'optimizer_state.bin'),
      optimizerBuffer.data,
      true
    );
    
    logger.debug('Modelo e otimizador salvos');
  }

  async loadModel(checkpointDir: string) {
    const modelPath = path.join(checkpointDir, 'model');
    if (!fs.existsSync(`${modelPath}.json`)) return null;

    const model = await tf.loadLayersModel(`file://${modelPath}`);
    
    // Carregar estado do otimizador
    const optimizerBuffer = await this.fileManager.readFile(
      path.join(checkpointDir, 'optimizer_state.bin'),
      true
    );
    if (optimizerBuffer) {
      const weights = tf.io.decodeWeights(
        optimizerBuffer,
        model.optimizer.getConfig().weightSpecs
      );
      await model.optimizer.setWeights(weights);
    }
    
    return model;
  }
}