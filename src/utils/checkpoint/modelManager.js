import * as tf from '@tensorflow/tfjs';
import { logger } from '../logging/logger.js';
import path from 'path';

export class ModelManager {
  constructor(fileManager) {
    this.fileManager = fileManager;
  }

  async saveModel(model, checkpointDir) {
    try {
      const modelPath = path.join(checkpointDir, 'model');
      await model.save(`file://${modelPath}`);
      logger.debug('Model saved successfully');
    } catch (error) {
      logger.error({ error }, 'Error saving model');
      throw error;
    }
  }

  async loadModel(checkpointDir) {
    try {
      const modelPath = path.join(checkpointDir, 'model');
      return await tf.loadLayersModel(`file://${modelPath}`);
    } catch (error) {
      logger.error({ error }, 'Error loading model');
      throw error;
    }
  }
}