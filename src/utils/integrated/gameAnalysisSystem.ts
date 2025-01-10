import * as tf from '@tensorflow/tfjs';
import { Player, ModelMetrics } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';

interface AnalysisResult {
  prediction: number[];
  confidence: number;
  patterns: number[][];
  metrics: ModelMetrics;
}

class GameAnalysisSystem {
  private static instance: GameAnalysisSystem;
  private metrics: ModelMetrics = {
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0
  };

  private constructor() {}

  static getInstance(): GameAnalysisSystem {
    if (!GameAnalysisSystem.instance) {
      GameAnalysisSystem.instance = new GameAnalysisSystem();
    }
    return GameAnalysisSystem.instance;
  }

  async analyzePrediction(
    model: tf.LayersModel,
    input: number[],
    playerWeights: number[],
    historicalData: number[][]
  ): Promise<AnalysisResult> {
    try {
      // Validação de dados
      this.validateInput(input, playerWeights);

      // Análise estatística e correlação
      const patterns = this.analyzePatterns(historicalData);
      
      // Processamento em lotes para otimização
      const batchResult = await this.processBatch(model, input, playerWeights);
      
      // Cálculo de confiança
      const confidence = this.calculateConfidence(batchResult);

      // Atualização de métricas
      this.updateMetrics(batchResult, patterns);

      return {
        prediction: batchResult,
        confidence,
        patterns,
        metrics: this.metrics
      };
    } catch (error) {
      systemLogger.log('system', 'Erro na análise de predição', { error });
      throw error;
    }
  }

  private validateInput(input: number[], weights: number[]): void {
    if (!input?.length || !weights?.length) {
      throw new Error('Dados de entrada inválidos');
    }
  }

  private analyzePatterns(historicalData: number[][]): number[][] {
    return historicalData
      .slice(-50)
      .filter((data, index, array) => {
        if (index === 0) return true;
        const previousData = array[index - 1];
        const matches = data.filter(n => previousData.includes(n)).length;
        return matches >= 5;
      });
  }

  private async processBatch(
    model: tf.LayersModel,
    input: number[],
    weights: number[]
  ): Promise<number[]> {
    const batchSize = 32;
    const inputTensor = tf.tensor2d([input]);
    const prediction = await model.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await prediction.data());
    
    // Aplicação dos pesos do jogador
    const weightedResult = result.map((value, index) => 
      value * (weights[index % weights.length] / 1000)
    );

    inputTensor.dispose();
    prediction.dispose();

    return weightedResult;
  }

  private calculateConfidence(predictions: number[]): number {
    const certainty = predictions.reduce((acc, pred) => {
      const distance = Math.abs(pred - 0.5);
      return acc + (distance / 0.5);
    }, 0);
    
    return (certainty / predictions.length) * 100;
  }

  private updateMetrics(predictions: number[], patterns: number[][]): void {
    this.metrics = {
      ...this.metrics,
      accuracy: patterns.length > 0 ? patterns.length / 50 : this.metrics.accuracy,
      totalPredictions: this.metrics.totalPredictions + 1
    };
  }

  getMetrics(): ModelMetrics {
    return this.metrics;
  }
}

export const gameAnalysisSystem = GameAnalysisSystem.getInstance();