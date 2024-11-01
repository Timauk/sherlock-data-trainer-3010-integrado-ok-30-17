import { supabase } from '@/lib/supabase';
import { systemLogger } from '@/utils/logging/systemLogger';
import * as tf from '@tensorflow/tfjs';

interface AnalysisResult {
  statisticalViews: any[];
  predictions: number[];
  recommendations: string[];
  realTimeMetrics: {
    accuracy: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  };
}

class AdvancedAnalysisService {
  private static instance: AdvancedAnalysisService;
  private model: tf.LayersModel | null = null;
  private predictionCache: Map<string, number[]> = new Map();

  private constructor() {
    this.initializeModel();
  }

  static getInstance(): AdvancedAnalysisService {
    if (!AdvancedAnalysisService.instance) {
      AdvancedAnalysisService.instance = new AdvancedAnalysisService();
    }
    return AdvancedAnalysisService.instance;
  }

  private async initializeModel() {
    try {
      this.model = await tf.loadLayersModel('indexeddb://prediction-model');
      systemLogger.log('system', 'Modelo de predição carregado com sucesso');
    } catch (error) {
      systemLogger.log('system', 'Erro ao carregar modelo de predição', { error });
    }
  }

  async getStatisticalViews() {
    const { data: views, error } = await supabase
      .rpc('get_statistical_views');

    if (error) {
      systemLogger.log('system', 'Erro ao buscar views estatísticas', { error });
      throw error;
    }

    return views;
  }

  async getPredictiveAnalysis(numbers: number[]): Promise<number[]> {
    if (!this.model) {
      throw new Error('Modelo não inicializado');
    }

    const cacheKey = numbers.join(',');
    if (this.predictionCache.has(cacheKey)) {
      return this.predictionCache.get(cacheKey)!;
    }

    const inputTensor = tf.tensor2d([numbers]);
    const predictions = await this.model.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await predictions.data());

    inputTensor.dispose();
    predictions.dispose();

    this.predictionCache.set(cacheKey, result);
    return result;
  }

  async getRecommendations(playerId: number): Promise<string[]> {
    const { data: recommendations, error } = await supabase
      .rpc('get_player_recommendations', { player_id: playerId });

    if (error) {
      systemLogger.log('system', 'Erro ao buscar recomendações', { error });
      throw error;
    }

    return recommendations;
  }

  async getRealTimeMetrics(): Promise<AnalysisResult['realTimeMetrics']> {
    const { data: metrics, error } = await supabase
      .rpc('get_realtime_metrics');

    if (error) {
      systemLogger.log('system', 'Erro ao buscar métricas em tempo real', { error });
      throw error;
    }

    return {
      accuracy: metrics.accuracy,
      confidence: metrics.confidence,
      trend: metrics.trend
    };
  }

  async getFullAnalysis(playerId: number, numbers: number[]): Promise<AnalysisResult> {
    const [views, predictions, recommendations, metrics] = await Promise.all([
      this.getStatisticalViews(),
      this.getPredictiveAnalysis(numbers),
      this.getRecommendations(playerId),
      this.getRealTimeMetrics()
    ]);

    return {
      statisticalViews: views,
      predictions,
      recommendations,
      realTimeMetrics: metrics
    };
  }
}

export const advancedAnalysisService = AdvancedAnalysisService.getInstance();