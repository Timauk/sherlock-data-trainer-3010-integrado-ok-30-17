interface ModelMetrics {
  accuracy: number;
  learningRate: number;
  errorRate: number;
  resourceUsage: {
    memory: number;
    cpu: number;
  };
  timestamp: Date;
}

class ModelMonitoring {
  private static instance: ModelMonitoring;
  private metrics: ModelMetrics[] = [];

  private constructor() {}

  static getInstance(): ModelMonitoring {
    if (!ModelMonitoring.instance) {
      ModelMonitoring.instance = new ModelMonitoring();
    }
    return ModelMonitoring.instance;
  }

  recordMetrics(
    accuracy: number,
    learningRate: number,
    errorRate: number
  ): void {
    const metrics: ModelMetrics = {
      accuracy,
      learningRate,
      errorRate,
      resourceUsage: {
        memory: performanceMonitor.getMemoryUsage(),
        cpu: performanceMonitor.getCPUUsage() || 0,
      },
      timestamp: new Date()
    };

    this.metrics.push(metrics);
    this.checkThresholds(metrics);
  }

  private checkThresholds(metrics: ModelMetrics): void {
    if (metrics.accuracy < 0.5 || metrics.errorRate > 0.3 || metrics.resourceUsage.memory > 0.8) {
      const event = new CustomEvent('modelAlert', {
        detail: {
          type: metrics.accuracy < 0.5 ? 'accuracy' :
                metrics.errorRate > 0.3 ? 'error' : 'memory',
          value: metrics.accuracy < 0.5 ? metrics.accuracy :
                metrics.errorRate > 0.3 ? metrics.errorRate : metrics.resourceUsage.memory,
          metrics: metrics
        }
      });
      window.dispatchEvent(event);
    }
  }

  getMetricsSummary(): {
    avgAccuracy: number;
    avgLearningRate: number;
    avgErrorRate: number;
    resourceTrend: { memory: number[]; cpu: number[] };
  } {
    const recentMetrics = this.metrics.slice(-100);
    
    return {
      avgAccuracy: this.calculateAverage(recentMetrics.map(m => m.accuracy)),
      avgLearningRate: this.calculateAverage(recentMetrics.map(m => m.learningRate)),
      avgErrorRate: this.calculateAverage(recentMetrics.map(m => m.errorRate)),
      resourceTrend: {
        memory: recentMetrics.map(m => m.resourceUsage.memory),
        cpu: recentMetrics.map(m => m.resourceUsage.cpu)
      }
    };
  }

  private calculateAverage(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
}

export const modelMonitoring = ModelMonitoring.getInstance();