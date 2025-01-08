import * as tf from '@tensorflow/tfjs';
import { logger } from '../logging/logger';

interface WeightData {
  name: string;
  tensor: tf.Tensor;
}

interface OptimizerWeightSpecs {
  name: string;
  shape: number[];
  dtype: 'float32' | 'int32' | 'bool' | 'string' | 'complex64';
}

export class ModelManager {
  private model: tf.LayersModel | null = null;

  async saveModel(model: tf.LayersModel, path: string): Promise<void> {
    try {
      await model.save(`file://${path}`);
      logger.info(`Model saved to ${path}`);
    } catch (error) {
      logger.error('Error saving model:', error);
      throw error;
    }
  }

  async loadModel(path: string): Promise<tf.LayersModel> {
    try {
      this.model = await tf.loadLayersModel(`file://${path}`);
      logger.info(`Model loaded from ${path}`);
      return this.model;
    } catch (error) {
      logger.error('Error loading model:', error);
      throw error;
    }
  }

  async saveOptimizer(model: tf.LayersModel, path: string): Promise<void> {
    if (!model.optimizer) {
      logger.warn('No optimizer found in model');
      return;
    }

    try {
      const weights = await (model.optimizer as tf.Optimizer).getWeights();
      const weightSpecs = weights.map(weight => {
        const tensor = weight as unknown as tf.Tensor;
        return {
          name: tensor.name || 'unnamed',
          shape: Array.from(tensor.shape),
          dtype: tensor.dtype as 'float32' | 'int32' | 'bool' | 'string' | 'complex64'
        };
      });

      const weightData = await tf.io.encodeWeights(weights);
      
      const handler = tf.io.getSaveHandlers('file://')[0];
      await handler.save({
        modelTopology: null,
        weightSpecs,
        weightData: weightData.data,
        format: 'weights',
        generatedBy: 'TensorFlow.js',
        convertedBy: null,
        modelInitializer: null,
        trainingConfig: null,
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON',
          modelTopologyBytes: 0,
          weightSpecsBytes: 0,
          weightDataBytes: 0,
        }
      });
      
      logger.info(`Optimizer weights saved to ${path}`);
    } catch (error) {
      logger.error('Error saving optimizer weights:', error);
      throw error;
    }
  }

  async loadOptimizer(model: tf.LayersModel, path: string, optimizerBuffer: ArrayBuffer): Promise<void> {
    if (!model.optimizer) {
      logger.warn('No optimizer found in model');
      return;
    }

    try {
      const config = (model.optimizer as tf.Optimizer).getConfig();
      const weightSpecs = (config?.weightSpecs as unknown as OptimizerWeightSpecs[]) || [];
      
      if (weightSpecs.length > 0) {
        const validWeightSpecs = weightSpecs.every(spec => 
          spec.name && Array.isArray(spec.shape) && spec.dtype
        );

        if (validWeightSpecs) {
          const weights = tf.io.decodeWeights(optimizerBuffer, weightSpecs);
          const weightList: WeightData[] = Object.entries(weights).map(([name, tensor]) => ({
            name,
            tensor: tensor as tf.Tensor
          }));
          await (model.optimizer as tf.Optimizer).setWeights(weightList);
          logger.info('Optimizer weights loaded successfully');
        } else {
          logger.warn('Invalid weight specifications found in optimizer config');
        }
      }
    } catch (error) {
      logger.error('Error loading optimizer weights:', error);
      throw error;
    }
  }

  disposeModel(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      logger.info('Model disposed');
    }
  }
}