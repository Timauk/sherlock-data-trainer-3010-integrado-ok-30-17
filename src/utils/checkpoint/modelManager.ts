import { ModelArtifactsInfo } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';

export class ModelManager {
  async saveModel(model: tf.LayersModel, artifactsInfo: ModelArtifactsInfo): Promise<void> {
    const modelPath = path.join(process.cwd(), 'models', `${artifactsInfo.dateSaved.toISOString()}.json`);
    const weightsPath = path.join(process.cwd(), 'models', `${artifactsInfo.dateSaved.toISOString()}.bin`);

    const modelJson = await model.toJSON();
    await fs.promises.writeFile(modelPath, JSON.stringify(modelJson));

    const weights = await model.save(`file://${weightsPath}`);
    await fs.promises.writeFile(weightsPath, weights);
  }

  async loadModel(): Promise<tf.LayersModel | null> {
    const modelPath = path.join(process.cwd(), 'models');
    const files = await fs.promises.readdir(modelPath);
    const modelFile = files.find(file => file.endsWith('.json'));

    if (!modelFile) {
      return null;
    }

    const model = await tf.loadLayersModel(`file://${path.join(modelPath, modelFile)}`);
    return model;
  }
}
