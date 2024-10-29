import { useToast } from "@/hooks/use-toast";
import { performanceMonitor } from "../performance/performanceMonitor";

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
  private toast = useToast();

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
    if (metrics.accuracy < 0.5) {
      this.toast.toast({
        title: "Alerta de Precisão",
        description: "A precisão do modelo está abaixo do esperado",
        variant: "destructive"
      });
    }

    if (metrics.errorRate > 0.3) {
      this.toast.toast({
        title: "Taxa de Erro Alta",
        description: "A taxa de erro do modelo está acima do limite",
        variant: "destructive"
      });
    }

    if (metrics.resourceUsage.memory > 0.8) {
      this.toast.toast({
        title: "Uso de Memória Alto",
        description: "O consumo de memória está acima do limite",
        variant: "destructive"
      });
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
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

export const modelMonitoring = ModelMonitoring.getInstance();