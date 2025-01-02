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
  dtype: "string" | "float32" | "int32" | "bool" | "complex64";
}

export class ModelManager {
  private readonly fileManager: FileManager;

  constructor(fileManager: FileManager) {
    this.fileManager = fileManager;
  }

  async saveModel(model: tf.LayersModel, checkpointDir: string): Promise<void> {
    const modelPath = path.join(checkpointDir, 'model');
    await model.save(`file://${modelPath}`);
    
    const optimizerState = await model.optimizer?.getWeights();
    if (optimizerState) {
      const optimizerBuffer = await tf.io.encodeWeights(optimizerState);
      await this.fileManager.writeFile(
        path.join(checkpointDir, 'optimizer_state.bin'),
        optimizerBuffer.data,
        true
      );
    }
    
    logger.debug('Model and optimizer saved');
  }

  async loadModel(checkpointDir: string): Promise<tf.LayersModel | null> {
    const modelPath = path.join(checkpointDir, 'model');
    if (!fs.existsSync(`${modelPath}.json`)) return null;

    const model = await tf.loadLayersModel(`file://${modelPath}`);
    
    const optimizerBuffer = await this.fileManager.readFile(
      path.join(checkpointDir, 'optimizer_state.bin'),
      true
    );
    
    if (optimizerBuffer && model.optimizer) {
      const config = model.optimizer.getConfig();
      const weightSpecs = config?.weightSpecs as unknown as OptimizerWeightSpecs[];
      
      if (weightSpecs && weightSpecs.length > 0) {
        const weights = tf.io.decodeWeights(optimizerBuffer, weightSpecs as tf.io.WeightsManifestEntry[]);
        const weightList: WeightData[] = Object.entries(weights).map(([name, tensor]) => ({
          name,
          tensor: tensor as tf.Tensor
        }));
        await model.optimizer.setWeights(weightList);
      }
    }
    
    return model;
  }
}