import { systemLogger } from '@/utils/logging/systemLogger';

class GameAnalysisSystem {
  private metrics: {
    accuracy: number;
    predictions: number;
    successRate: number;
  };

  constructor() {
    this.metrics = {
      accuracy: 0,
      predictions: 0,
      successRate: 0
    };
  }

  updateMetrics(accuracy: number, predictions: number) {
    this.metrics.accuracy = accuracy;
    this.metrics.predictions = predictions;
    this.metrics.successRate = predictions > 0 ? accuracy / predictions : 0;
    
    systemLogger.log('metrics', 'Métricas atualizadas', this.metrics);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  async analyzeGameState(gameState: any) {
    try {
      const analysis = {
        currentState: gameState,
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      };
      
      systemLogger.log('analysis', 'Análise do estado do jogo', analysis);
      return analysis;
      
    } catch (error) {
      systemLogger.log('error', 'Erro na análise do estado do jogo', { error });
      throw error;
    }
  }
}

export const gameAnalysisSystem = new GameAnalysisSystem();