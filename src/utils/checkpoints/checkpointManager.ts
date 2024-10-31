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

      enhancedLogger.log('checkpoint', 'Checkpoint salvo com sucesso', {
        timestamp: new Date(data.timestamp).toISOString()
      });

      return true;
    } catch (error) {
      enhancedLogger.log('error', 'Erro ao salvar checkpoint', { error });
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

      if (!savedData || !weightsData || !model) {
        throw new Error('Dados do checkpoint incompletos');
      }

      // Reconstrói os tensores dos pesos
      const weights = weightsData.map((data: number[]) => tf.tensor(data));

      return {
        model,
        weights,
        ...savedData
      };
    } catch (error) {
      enhancedLogger.log('error', 'Erro ao carregar checkpoint', { error });
      return null;
    }
  }

  async clearCheckpoints(): Promise<void> {
    try {
      await tf.io.removeModel('indexeddb://checkpoint-model');
      localStorage.removeItem('checkpoint-data');
      localStorage.removeItem('checkpoint-weights');
      enhancedLogger.log('checkpoint', 'Checkpoints limpos com sucesso');
    } catch (error) {
      enhancedLogger.log('error', 'Erro ao limpar checkpoints', { error });
    }
  }
}

export const checkpointManager = CheckpointManager.getInstance();