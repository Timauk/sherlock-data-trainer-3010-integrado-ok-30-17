import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logging/systemLogger';

export interface ModelMetadata {
  timestamp: string;
  architecture: string[];
  performance: {
    accuracy: number;
    loss: number;
  };
  trainingIterations: number;
}

export const serializeModel = async (model: tf.LayersModel, metadata: ModelMetadata) => {
  try {
    // Salva o modelo completo com pesos
    await model.save('indexeddb://current-model');
    
    // Salva metadata separadamente para fácil acesso
    localStorage.setItem('model-metadata', JSON.stringify(metadata));
    
    // Salva configuração da arquitetura
    const config = model.getConfig();
    localStorage.setItem('model-architecture', JSON.stringify(config));
    
    systemLogger.log('model', 'Modelo serializado com sucesso', metadata);
    return true;
  } catch (error) {
    systemLogger.log('model', 'Erro ao serializar modelo', { error });
    return false;
  }
};

export const deserializeModel = async (): Promise<{
  model: tf.LayersModel | null;
  metadata: ModelMetadata | null;
}> => {
  try {
    const model = await tf.loadLayersModel('indexeddb://current-model');
    const metadata = JSON.parse(localStorage.getItem('model-metadata') || 'null');
    return { model, metadata };
  } catch (error) {
    systemLogger.log('model', 'Erro ao deserializar modelo', { error });
    return { model: null, metadata: null };
  }
};