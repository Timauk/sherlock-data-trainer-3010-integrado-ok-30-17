import * as tf from '@tensorflow/tfjs';
import path from 'path';
import fs from 'fs';
import { logger } from '../logging/logger.js';
import { FileManager } from './fileManager';

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
  private readonly fileManager: FileManager;

  constructor(fileManager: FileManager) {
    this.fileManager = fileManager;
  }

  async saveModel(model: tf.LayersModel, checkpointDir: string): Promise<void> {
    const modelPath = path.join(checkpointDir, 'model');
    await model.save(`file://${modelPath}`);
    
    if (model.optimizer) {
      const optimizerState = await (model.optimizer as tf.Optimizer).getWeights();
      if (optimizerState) {
        const optimizerBuffer = await tf.io.encodeWeights(optimizerState);
        await this.fileManager.writeFile(
          path.join(checkpointDir, 'optimizer_state.bin'),
          optimizerBuffer.data,
          true
        );
      }
    }
    
    logger.debug('Model and optimizer saved');
  }

  async loadModel(checkpointDir: string): Promise<tf.LayersModel | null> {
    const modelPath = path.join(checkpointDir, 'model');
    if (!fs.existsSync(`${modelPath}.json`)) return null;

    const model = await tf.loadLayersModel(`file://${modelPath}`);
    
    const optimizerBuffer = await this.fileManager.readFile<Buffer>(
      path.join(checkpointDir, 'optimizer_state.bin'),
      true
    );
    
    if (optimizerBuffer && model.optimizer) {
      const config = (model.optimizer as tf.Optimizer).getConfig();
      // Safely cast the config weightSpecs to our expected type
      const weightSpecs = (config?.weightSpecs as unknown as OptimizerWeightSpecs[]) || [];
      
      if (weightSpecs.length > 0) {
        // Ensure the weightSpecs match our expected format
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
        } else {
          logger.warn('Invalid weight specifications found in optimizer config');
        }
      }
    }
    
    return model;
  }
}