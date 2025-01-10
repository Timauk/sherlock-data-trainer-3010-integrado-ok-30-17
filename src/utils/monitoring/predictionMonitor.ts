import { systemLogger } from '../logging/systemLogger';

interface PredictionMetrics {
  accuracy: number;
  timestamp: number;
  cycleNumber: number;
  predictionQuality: 'high' | 'medium' | 'low';
}

class PredictionMonitor {
  private static instance: PredictionMonitor;
  private metrics: PredictionMetrics[] = [];
  private cycleCount: number = 0;
  private readonly QUALITY_THRESHOLDS = {
    high: 0.7,
    medium: 0.4
  };
  
  private constructor() {}
  
  static getInstance(): PredictionMonitor {
    if (!PredictionMonitor.instance) {
      PredictionMonitor.instance = new PredictionMonitor();
    }
    return PredictionMonitor.instance;
  }
  
  recordPrediction(prediction: number[], actual: number[], arimaPredictor: number[]) {
    const matches = prediction.filter(num => actual.includes(num)).length;
    const accuracy = matches / 15;
    
    const predictionQuality = 
      accuracy >= this.QUALITY_THRESHOLDS.high ? 'high' :
      accuracy >= this.QUALITY_THRESHOLDS.medium ? 'medium' : 'low';
    
    this.metrics.push({
      accuracy,
      timestamp: Date.now(),
      cycleNumber: ++this.cycleCount,
      predictionQuality
    });
    
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    this.checkStability();
    
    console.log('Métricas de predição:', {
      matches,
      accuracy,
      predictionQuality,
      cycleNumber: this.cycleCount
    });
    
    systemLogger.log('prediction', 'Métricas de predição', {
      matches,
      accuracy,
      predictionQuality,
      cycleNumber: this.cycleCount
    });

    // Alerta se a precisão estiver muito baixa
    if (accuracy < 0.2) {
      console.warn('Alerta: Precisão muito baixa detectada', {
        accuracy,
        prediction,
        actual
      });
    }
  }
  
  private checkStability() {
    if (this.metrics.length < 50) return;
    
    const recentMetrics = this.metrics.slice(-50);
    const avgAccuracy = recentMetrics.reduce((sum, m) => sum + m.accuracy, 0) / 50;
    
    if (avgAccuracy < 0.2) {
      console.warn('Alerta: Baixa precisão persistente detectada', {
        avgAccuracy,
        lastCycles: 50,
        metricsDetail: recentMetrics
      });
      
      systemLogger.log('system', 'Alerta: Baixa precisão detectada', {
        avgAccuracy,
        lastCycles: 50
      });
    }
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  getCycleCount() {
    return this.cycleCount;
  }
  
  getAverageAccuracy(windowSize: number = 50): number {
    if (this.metrics.length === 0) return 0;
    const recentMetrics = this.metrics.slice(-windowSize);
    return recentMetrics.reduce((sum, m) => sum + m.accuracy, 0) / recentMetrics.length;
  }
  
  reset() {
    this.metrics = [];
    this.cycleCount = 0;
    systemLogger.log('system', 'Monitor de predições resetado');
    console.log('Monitor de predições resetado');
  }
}

export const predictionMonitor = PredictionMonitor.getInstance();