import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';
import { enhancedLogger } from '../logging/enhancedLogger';

interface CheckpointData {
  model: tf.LayersModel;
  weights: tf.Tensor[];
  trainingHistory: any[];
  playerStates: any[];
  gameState: any;
  timestamp: number;
  csvData?: number[][];
  modelJson?: any;
  modelWeights?: ArrayBuffer;
  persistenceData?: any;
}

export class CheckpointManager {
  private static instance: CheckpointManager;
  
  private constructor() {}
  
  static getInstance(): CheckpointManager {
    if (!CheckpointManager.instance) {
      CheckpointManager.instance = new CheckpointManager();
    }
    return CheckpointManager.instance;
  }

  async saveCheckpoint(data: CheckpointData): Promise<boolean> {
    try {
      // Salva o modelo e seus pesos
      await data.model.save('indexeddb://checkpoint-model');
      
      // Salva os dados do CSV
      if (data.csvData) {
        localStorage.setItem('checkpoint-csv', JSON.stringify(data.csvData));
      }

      // Salva o JSON do modelo
      if (data.modelJson) {
        localStorage.setItem('checkpoint-model-json', JSON.stringify(data.modelJson));
      }

      // Salva os pesos do modelo em formato binário
      if (data.modelWeights) {
        const blob = new Blob([data.modelWeights], { type: 'application/octet-stream' });
        const weightsUrl = URL.createObjectURL(blob);
        localStorage.setItem('checkpoint-model-weights-url', weightsUrl);
      }

      // Salva os dados de persistência
      if (data.persistenceData) {
        localStorage.setItem('checkpoint-persistence', JSON.stringify(data.persistenceData));
      }

      // Salva os dados do estado do jogo
      localStorage.setItem('checkpoint-data', JSON.stringify({
        trainingHistory: data.trainingHistory,
        playerStates: data.playerStates,
        gameState: data.gameState,
        timestamp: data.timestamp
      }));

      // Salva os pesos do modelo separadamente
      const weightsData = await Promise.all(
        data.weights.map(async (weight) => Array.from(await weight.data()))
      );
      localStorage.setItem('checkpoint-weights', JSON.stringify(weightsData));

      enhancedLogger.log('checkpoint', 'Checkpoint completo salvo com sucesso', {
        timestamp: new Date(data.timestamp).toISOString()
      });

      return true;
    } catch (error) {
      enhancedLogger.log('system', 'Erro ao salvar checkpoint completo', { error });
      return false;
    }
  }

  async loadCheckpoint(): Promise<CheckpointData | null> {
    try {
      // Carrega o modelo
      const model = await tf.loadLayersModel('indexeddb://checkpoint-model');
      
      // Carrega os dados do estado
      const savedData = JSON.parse(localStorage.getItem('checkpoint-data') || 'null');
      const weightsData = JSON.parse(localStorage.getItem('checkpoint-weights') || 'null');
      const csvData = JSON.parse(localStorage.getItem('checkpoint-csv') || 'null');
      const modelJson = JSON.parse(localStorage.getItem('checkpoint-model-json') || 'null');
      const persistenceData = JSON.parse(localStorage.getItem('checkpoint-persistence') || 'null');
      
      // Carrega os pesos binários
      const weightsUrl = localStorage.getItem('checkpoint-model-weights-url');
      let modelWeights: ArrayBuffer | undefined;
      
      if (weightsUrl) {
        const response = await fetch(weightsUrl);
        modelWeights = await response.arrayBuffer();
      }

      if (!savedData || !weightsData || !model) {
        throw new Error('Dados do checkpoint incompletos');
      }

      // Reconstrói os tensores dos pesos
      const weights = weightsData.map((data: number[]) => tf.tensor(data));

      return {
        model,
        weights,
        csvData,
        modelJson,
        modelWeights,
        persistenceData,
        ...savedData
      };
    } catch (error) {
      enhancedLogger.log('system', 'Erro ao carregar checkpoint completo', { error });
      return null;
    }
  }

  async clearCheckpoints(): Promise<void> {
    try {
      await tf.io.removeModel('indexeddb://checkpoint-model');
      localStorage.removeItem('checkpoint-data');
      localStorage.removeItem('checkpoint-weights');
      localStorage.removeItem('checkpoint-csv');
      localStorage.removeItem('checkpoint-model-json');
      localStorage.removeItem('checkpoint-model-weights-url');
      localStorage.removeItem('checkpoint-persistence');
      enhancedLogger.log('checkpoint', 'Checkpoints limpos com sucesso');
    } catch (error) {
      enhancedLogger.log('system', 'Erro ao limpar checkpoints', { error });
    }
  }
}

export const checkpointManager = CheckpointManager.getInstance();