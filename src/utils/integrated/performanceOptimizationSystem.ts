import { systemLogger } from '../logging/systemLogger.js';
import { supabase } from '../../lib/supabase';

interface PerformanceMetrics {
  accuracy: number;
  latency: number;
  memoryUsage: number;
  timestamp: string;
}

class PerformanceOptimizationSystem {
  private static instance: PerformanceOptimizationSystem;
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS_HISTORY = 1000;

  private constructor() {}

  static getInstance(): PerformanceOptimizationSystem {
    if (!PerformanceOptimizationSystem.instance) {
      PerformanceOptimizationSystem.instance = new PerformanceOptimizationSystem();
    }
    return PerformanceOptimizationSystem.instance;
  }

  recordMetrics(accuracy: number, latency: number): void {
    const metrics: PerformanceMetrics = {
      accuracy,
      latency,
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(metrics);
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics.shift();
    }

    this.saveMetricsToDatabase(metrics);
    this.analyzePerformance();
  }

  private async saveMetricsToDatabase(metrics: PerformanceMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(metrics);

      if (error) throw error;
      systemLogger.log('performance', 'Metrics saved to database', metrics);
    } catch (error) {
      systemLogger.log('performance', 'Error saving metrics to database', { error });
    }
  }

  private analyzePerformance(): void {
    if (this.metrics.length < 10) return;

    const recentMetrics = this.metrics.slice(-10);
    const avgAccuracy = recentMetrics.reduce((sum, m) => sum + m.accuracy, 0) / recentMetrics.length;
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;

    if (avgAccuracy < 0.7) {
      systemLogger.log('performance', 'Warning: Low accuracy detected', { avgAccuracy });
    }

    if (avgLatency > 1000) {
      systemLogger.log('performance', 'Warning: High latency detected', { avgLatency });
    }

    const memoryTrend = this.calculateMemoryTrend(recentMetrics);
    if (memoryTrend > 0.1) {
      systemLogger.log('performance', 'Warning: Increasing memory usage trend detected', { memoryTrend });
    }
  }

  private calculateMemoryTrend(metrics: PerformanceMetrics[]): number {
    const memoryValues = metrics.map(m => m.memoryUsage);
    const n = memoryValues.length;
    
    if (n < 2) return 0;

    const sumX = (n * (n - 1)) / 2;
    const sumY = memoryValues.reduce((a, b) => a + b, 0);
    const sumXY = memoryValues.reduce((sum, y, i) => sum + (i * y), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope / memoryValues[0]; // Normalize by initial memory usage
  }

  getPerformanceReport(): {
    metrics: PerformanceMetrics[];
    summary: {
      avgAccuracy: number;
      avgLatency: number;
      memoryTrend: number;
    };
  } {
    const recentMetrics = this.metrics.slice(-100);
    const avgAccuracy = recentMetrics.reduce((sum, m) => sum + m.accuracy, 0) / recentMetrics.length;
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
    const memoryTrend = this.calculateMemoryTrend(recentMetrics);

    return {
      metrics: recentMetrics,
      summary: {
        avgAccuracy,
        avgLatency,
        memoryTrend
      }
    };
  }

  async optimizePerformance(): Promise<void> {
    const report = this.getPerformanceReport();
    
    if (report.summary.avgLatency > 1000) {
      systemLogger.log('performance', 'Initiating performance optimization');
      
      // Clear metrics history to free memory if it's too large
      if (this.metrics.length > this.MAX_METRICS_HISTORY / 2) {
        this.metrics = this.metrics.slice(-100);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        systemLogger.log('performance', 'Garbage collection triggered');
      }
    }

    try {
      await this.saveMetricsToDatabase({
        accuracy: report.summary.avgAccuracy,
        latency: report.summary.avgLatency,
        memoryUsage: process.memoryUsage().heapUsed,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      systemLogger.log('performance', 'Error during performance optimization', { error });
    }
  }
}

export const performanceOptimizer = PerformanceOptimizationSystem.getInstance();
