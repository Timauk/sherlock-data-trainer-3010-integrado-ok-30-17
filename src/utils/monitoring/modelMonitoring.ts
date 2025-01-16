import { systemLogger } from '../logging/systemLogger';
import { TrainingMetrics } from '@/types/gameTypes';

class ModelMonitor {
  private metrics: TrainingMetrics[] = [];
  private readonly maxMetricsHistory = 1000;

  addMetrics(metrics: TrainingMetrics): void {
    this.metrics.push(metrics);
    
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    systemLogger.log('monitoring', 'Métricas do modelo atualizadas', metrics);
  }

  getAverageMetrics(): TrainingMetrics {
    if (this.metrics.length === 0) {
      return {
        loss: 0,
        accuracy: 0,
        epoch: 0
      };
    }

    const sum = this.metrics.reduce((acc, curr) => ({
      loss: acc.loss + curr.loss,
      accuracy: acc.accuracy + curr.accuracy,
      epoch: curr.epoch,
      validationLoss: (acc.validationLoss || 0) + (curr.validationLoss || 0),
      validationAccuracy: (acc.validationAccuracy || 0) + (curr.validationAccuracy || 0)
    }));

    const count = this.metrics.length;

    return {
      loss: sum.loss / count,
      accuracy: sum.accuracy / count,
      epoch: sum.epoch,
      validationLoss: sum.validationLoss ? sum.validationLoss / count : undefined,
      validationAccuracy: sum.validationAccuracy ? sum.validationAccuracy / count : undefined
    };
  }

  getLatestMetrics(): TrainingMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  clearMetrics(): void {
    this.metrics = [];
    systemLogger.log('monitoring', 'Histórico de métricas limpo');
  }
}

export const modelMonitor = new ModelMonitor();