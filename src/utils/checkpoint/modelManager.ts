import { ModelArtifacts, ModelArtifactsInfo } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';

export class ModelManager {
  private handler?: tf.io.IOHandler;
  private artifactsInfo?: ModelArtifactsInfo;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.handler = await tf.io.browserFiles([]);
    } catch (error) {
      console.error('Erro ao inicializar ModelManager:', error);
    }
  }

  async saveModel(model: tf.LayersModel, artifactsInfo: ModelArtifactsInfo): Promise<void> {
    if (!this.handler) {
      throw new Error('Handler não inicializado');
    }

    const weightSpecs = model.weights.map(weight => ({
      name: weight.name,
      shape: weight.shape,
      dtype: weight.dtype
    }));

    const modelArtifacts: ModelArtifacts = {
      modelTopology: model.toJSON(),
      weightSpecs,
      weightData: new ArrayBuffer(0),
      format: 'layers-model',
      generatedBy: 'TensorFlow.js v' + tf.version.tfjs,
      convertedBy: 'TensorFlow.js Converter v' + tf.version.tfjs,
      modelArtifactsInfo: artifactsInfo
    };

    await this.handler.save(modelArtifacts);
  }

  async loadModel(): Promise<tf.LayersModel | null> {
    if (!this.handler) {
      throw new Error('Handler não inicializado');
    }

    try {
      return await tf.loadLayersModel(this.handler);
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      return null;
    }
  }
}