import { toast } from "@/hooks/use-toast";

interface PerformanceMetrics {
  memoryUsage: number;
  modelAccuracy: number;
  predictionLatency: number;
  cpuUsage?: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private readonly maxStoredMetrics = 1000;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetrics(accuracy: number, predictionTime: number): void {
    const metrics: PerformanceMetrics = {
      memoryUsage: window.performance.memory?.usedJSHeapSize || 0,
      modelAccuracy: accuracy,
      predictionLatency: predictionTime,
      timestamp: new Date()
    };

    this.metrics.push(metrics);
    
    // Maintain only the last maxStoredMetrics entries
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics);
    }

    // Alert if performance degrades
    this.checkPerformanceThresholds(metrics);
  }

  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    if (metrics.modelAccuracy < 0.5) {
      toast({
        title: "Alerta de Desempenho",
        description: "Precisão do modelo está abaixo do esperado",
        variant: "destructive"
      });
    }

    if (metrics.predictionLatency > 1000) {
      toast({
        title: "Alerta de Latência",
        description: "Tempo de predição está alto",
        variant: "destructive"
      });
    }

    const memoryThresholdGB = 1.5;
    if (metrics.memoryUsage > memoryThresholdGB * 1024 * 1024 * 1024) {
      toast({
        title: "Alerta de Memória",
        description: "Uso de memória está alto",
        variant: "destructive"
      });
    }
  }

  getAverageMetrics(timeWindowMinutes: number = 60): {
    avgAccuracy: number;
    avgLatency: number;
    avgMemory: number;
  } {
    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > timeThreshold);

    if (recentMetrics.length === 0) {
      return { avgAccuracy: 0, avgLatency: 0, avgMemory: 0 };
    }

    return {
      avgAccuracy: this.calculateAverage(recentMetrics.map(m => m.modelAccuracy)),
      avgLatency: this.calculateAverage(recentMetrics.map(m => m.predictionLatency)),
      avgMemory: this.calculateAverage(recentMetrics.map(m => m.memoryUsage))
    };
  }

  private calculateAverage(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();