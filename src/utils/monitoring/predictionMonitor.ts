import { systemLogger } from '../logging/systemLogger';

interface PredictionMetrics {
  accuracy: number;
  timestamp: number;
  cycleNumber: number;
}

class PredictionMonitor {
  private static instance: PredictionMonitor;
  private metrics: PredictionMetrics[] = [];
  private cycleCount: number = 0;
  
  private constructor() {}
  
  static getInstance(): PredictionMonitor {
    if (!PredictionMonitor.instance) {
      PredictionMonitor.instance = new PredictionMonitor();
    }
    return PredictionMonitor.instance;
  }
  
  recordPrediction(prediction: number[], actual: number[], arimaPredictor: number[]) {
    const matches = prediction.filter(num => actual.includes(num)).length;
    
    this.metrics.push({
      accuracy: matches / 15,
      timestamp: Date.now(),
      cycleNumber: ++this.cycleCount
    });
    
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    this.checkStability();
    
    systemLogger.log('prediction', 'Métricas de predição', {
      matches,
      accuracy: matches / 15,
      cycleNumber: this.cycleCount
    });
  }
  
  private checkStability() {
    if (this.metrics.length < 50) return;
    
    const recentMetrics = this.metrics.slice(-50);
    const avgAccuracy = recentMetrics.reduce((sum, m) => sum + m.accuracy, 0) / 50;
    
    if (avgAccuracy < 0.2) {
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
  
  reset() {
    this.metrics = [];
    this.cycleCount = 0;
    systemLogger.log('system', 'Monitor de predições resetado');
  }
}

export const predictionMonitor = PredictionMonitor.getInstance();