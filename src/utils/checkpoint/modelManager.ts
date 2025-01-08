import * as tf from '@tensorflow/tfjs';
import { Player } from '../types/gameTypes';

export class ModelManager {
  private model: tf.LayersModel | null = null;

  async loadModel(handler: tf.io.IOHandler): Promise<void> {
    this.model = await tf.loadLayersModel(handler);
  }

  async save(handler: tf.io.IOHandler) {
    if (handler) {
      await handler.save({
        modelTopology: this.model?.toJSON(),
        weightSpecs: this.model?.weights.map(weight => weight.shape),
        weightData: await this.model?.saveWeights(handler),
        modelInitializer: {},
        trainingConfig: {
          loss: {},
          metrics: [],
          optimizer_config: {
            class_name: "Adam",
            config: {}
          }
        }
      });
    }
  }

  getModel(): tf.LayersModel | null {
    return this.model;
  }

  async trainModel(trainingData: Player[]): Promise<void> {
    if (!this.model) {
      throw new Error("Model not loaded");
    }

    const xs = tf.tensor2d(trainingData.map(data => data.weights));
    const ys = tf.tensor2d(trainingData.map(data => data.fitness));

    await this.model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2
    });

    xs.dispose();
    ys.dispose();
  }
}
