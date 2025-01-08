import { ModelArtifactsInfo } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';

export class ModelManager {
  async saveModel(model: tf.LayersModel, artifactsInfo: ModelArtifactsInfo): Promise<void> {
    const modelPath = path.join(process.cwd(), 'models', `${artifactsInfo.dateSaved.toISOString()}.json`);
    const weightsPath = path.join(process.cwd(), 'models', `${artifactsInfo.dateSaved.toISOString()}.bin`);

    // Salva o modelo como JSON
    const modelJson = await model.toJSON();
    await fs.promises.writeFile(modelPath, JSON.stringify(modelJson));

    // Salva os pesos do modelo
    const modelArtifacts = await model.save(`file://${weightsPath}`);
    const weightsData = Buffer.from(JSON.stringify(modelArtifacts));
    await fs.promises.writeFile(weightsPath, weightsData);
  }

  async loadModel(): Promise<tf.LayersModel | null> {
    try {
      const modelPath = path.join(process.cwd(), 'models');
      const files = await fs.promises.readdir(modelPath);
      const modelFile = files.find(file => file.endsWith('.json'));

      if (!modelFile) {
        return null;
      }

      const model = await tf.loadLayersModel(`file://${path.join(modelPath, modelFile)}`);
      return model;
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      return null;
    }
  }
}