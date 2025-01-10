import { systemLogger } from '../logging/systemLogger';

interface PredictionMetrics {
  accuracy: number;
  timestamp: number;
  cycleNumber: number;
  predictionQuality: 'high' | 'medium' | 'low';
  uniqueNumbersCount: number;
  numberRange: {
    min: number;
    max: number;
  };
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
  
  recordPrediction(prediction: number[], actual: number[]) {
    const matches = prediction.filter(num => actual.includes(num)).length;
    const accuracy = matches / 15;
    
    const uniqueNumbersCount = new Set(prediction).size;
    const numberRange = {
      min: Math.min(...prediction),
      max: Math.max(...prediction)
    };
    
    const predictionQuality = 
      accuracy >= this.QUALITY_THRESHOLDS.high ? 'high' :
      accuracy >= this.QUALITY_THRESHOLDS.medium ? 'medium' : 'low';
    
    const metrics: PredictionMetrics = {
      accuracy,
      timestamp: Date.now(),
      cycleNumber: ++this.cycleCount,
      predictionQuality,
      uniqueNumbersCount,
      numberRange
    };
    
    this.metrics.push(metrics);
    
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    systemLogger.log('prediction', 'Métricas de predição', {
      matches,
      accuracy,
      predictionQuality,
      uniqueNumbersCount,
      numberRange,
      cycleNumber: this.cycleCount
    });

    this.checkQuality(metrics);
  }
  
  private checkQuality(metrics: PredictionMetrics) {
    // Verifica se os números estão muito concentrados
    if (metrics.numberRange.max - metrics.numberRange.min < 10) {
      systemLogger.log('system', 'Alerta: Números muito concentrados', {
        range: metrics.numberRange
      });
    }

    // Verifica se há números únicos suficientes
    if (metrics.uniqueNumbersCount < 15) {
      systemLogger.log('system', 'Alerta: Números duplicados detectados', {
        uniqueCount: metrics.uniqueNumbersCount
      });
    }

    // Verifica a precisão geral
    if (metrics.accuracy < 0.2) {
      systemLogger.log('system', 'Alerta: Precisão muito baixa', {
        accuracy: metrics.accuracy
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
  }
}

export const predictionMonitor = PredictionMonitor.getInstance();