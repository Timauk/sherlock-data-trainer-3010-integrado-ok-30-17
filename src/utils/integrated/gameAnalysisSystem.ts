import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

class GameAnalysisSystem {
  private static instance: GameAnalysisSystem;
  private metrics = {
    predictions: 0,
    accuracy: 0,
    successRate: 0
  };

  private constructor() {}

  static getInstance(): GameAnalysisSystem {
    if (!GameAnalysisSystem.instance) {
      GameAnalysisSystem.instance = new GameAnalysisSystem();
    }
    return GameAnalysisSystem.instance;
  }

  updateMetrics(predictions: number, accuracy: number): void {
    this.metrics.predictions = predictions;
    this.metrics.successRate = predictions > 0 ? accuracy / predictions : 0;
    
    systemLogger.log('performance', 'Métricas atualizadas', this.metrics);
  }

  getMetrics() {
    return this.metrics;
  }

  async analyzeGameState(model: tf.LayersModel | null, currentState: any) {
    try {
      const analysis = {
        modelStatus: model ? 'loaded' : 'not_loaded',
        currentState,
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      };
      
      systemLogger.log('performance', 'Análise do estado do jogo', analysis);
      return analysis;
      
    } catch (error) {
      systemLogger.log('system', 'Erro na análise do estado do jogo', { error });
      throw error;
    }
  }
}

export const gameAnalysisSystem = GameAnalysisSystem.getInstance();