import * as tf from '@tensorflow/tfjs';
import path from 'path';
import { logger } from '../logging/logger.js';
import fs from 'fs';

interface WeightData {
  name: string;
  tensor: tf.Tensor;
}

type OptimizerDType = "string" | "float32" | "int32" | "bool" | "complex64";

interface OptimizerWeightSpecs {
  name: string;
  shape: number[];
  dtype: OptimizerDType;
}

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
