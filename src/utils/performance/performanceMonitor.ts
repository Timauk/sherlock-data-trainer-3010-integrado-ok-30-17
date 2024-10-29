import { useToast } from "@/components/ui/use-toast";

interface PerformanceMetrics {
  memoryUsage: number;
  modelAccuracy: number;
  predictionLatency: number;
  cpuUsage: number | null;
  timestamp: Date;
}

// Extend Performance interface to include memory
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private readonly maxStoredMetrics = 1000;
  private toast = useToast();
  private lastCpuUsage: number | null = null;

  private constructor() {
    // Initialize CPU monitoring
    this.startCpuMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private startCpuMonitoring() {
    if ('requestIdleCallback' in window) {
      const updateCpuUsage = () => {
        const lastTime = performance.now();
        requestIdleCallback((deadline) => {
          this.lastCpuUsage = 1 - deadline.timeRemaining() / (performance.now() - lastTime);
          // Schedule next update
          setTimeout(updateCpuUsage, 1000);
        });
      };
      updateCpuUsage();
    }
  }

  recordMetrics(accuracy: number, predictionTime: number): void {
    const metrics: PerformanceMetrics = {
      memoryUsage: this.getMemoryUsage(),
      modelAccuracy: accuracy,
      predictionLatency: predictionTime,
      cpuUsage: this.lastCpuUsage,
      timestamp: new Date()
    };

    this.metrics.push(metrics);
    
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics);
    }

    this.checkPerformanceThresholds(metrics);
  }

  getMemoryUsage(): number {
    if (window.performance.memory) {
      return window.performance.memory.usedJSHeapSize / window.performance.memory.jsHeapSizeLimit;
    }
    return 0;
  }

  getCPUUsage(): number | null {
    return this.lastCpuUsage;
  }

  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    if (metrics.modelAccuracy < 0.5) {
      this.toast.toast({
        title: "Alerta de Desempenho",
        description: "Precisão do modelo está abaixo do esperado",
        variant: "destructive"
      });
    }

    if (metrics.predictionLatency > 1000) {
      this.toast.toast({
        title: "Alerta de Latência",
        description: "Tempo de predição está alto",
        variant: "destructive"
      });
    }

    const memoryThresholdGB = 1.5;
    if (metrics.memoryUsage > memoryThresholdGB * 1024 * 1024 * 1024) {
      this.toast.toast({
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
    avgCPU: number | null;
  } {
    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > timeThreshold);

    if (recentMetrics.length === 0) {
      return { avgAccuracy: 0, avgLatency: 0, avgMemory: 0, avgCPU: null };
    }

    const cpuMetrics = recentMetrics.filter(m => m.cpuUsage !== null);

    return {
      avgAccuracy: this.calculateAverage(recentMetrics.map(m => m.modelAccuracy)),
      avgLatency: this.calculateAverage(recentMetrics.map(m => m.predictionLatency)),
      avgMemory: this.calculateAverage(recentMetrics.map(m => m.memoryUsage)),
      avgCPU: cpuMetrics.length > 0 ? this.calculateAverage(cpuMetrics.map(m => m.cpuUsage!)) : null
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