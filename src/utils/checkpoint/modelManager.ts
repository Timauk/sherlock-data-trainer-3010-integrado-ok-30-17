import * as tf from '@tensorflow/tfjs';
import { Player } from '../../types/gameTypes';
import { logger } from '../logging/logger';

export class ModelManager {
  async saveModel(model: tf.LayersModel, checkpointDir: string): Promise<void> {
    try {
      await model.save(`file://${checkpointDir}/model`);
      logger.info('Model saved successfully');
    } catch (error) {
      logger.error({ error }, 'Error saving model');
      throw error;
    }
  }

  async loadModel(checkpointDir: string): Promise<tf.LayersModel | null> {
    try {
      const model = await tf.loadLayersModel(`file://${checkpointDir}/model/model.json`);
      logger.info('Model loaded successfully');
      return model;
    } catch (error) {
      logger.error({ error }, 'Error loading model');
      return null;
    }
  }

  async trainModel(model: tf.LayersModel, trainingData: Player[]): Promise<void> {
    try {
      const xs = tf.tensor2d(trainingData.map(data => data.weights));
      const ys = tf.tensor2d(trainingData.map(data => [data.fitness]));

      await model.fit(xs, ys, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2
      });

      xs.dispose();
      ys.dispose();
      logger.info('Model training completed');
    } catch (error) {
      logger.error({ error }, 'Error training model');
      throw error;
    }
  }
}