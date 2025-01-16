import { systemLogger } from '../logging/systemLogger';
import { TrainingMetrics } from '@/types/gameTypes';

interface SpecializedModelsStatus {
  activeCount: number;
  totalCount: number;
}

interface AnalysisStatus {
  activeAnalyses: number;
}

class ModelMonitor {
  private metrics: TrainingMetrics[] = [];
  private readonly maxMetricsHistory = 1000;
  private totalSamples: number = 0;

  addMetrics(metrics: TrainingMetrics): void {
    this.metrics.push(metrics);
    this.totalSamples += 1;
    
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    systemLogger.log('model', 'Métricas do modelo atualizadas', metrics);
  }

  getAverageMetrics(): TrainingMetrics & { totalSamples: number } {
    if (this.metrics.length === 0) {
      return {
        loss: 0,
        accuracy: 0,
        epoch: 0,
        totalSamples: this.totalSamples
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
      validationAccuracy: sum.validationAccuracy ? sum.validationAccuracy / count : undefined,
      totalSamples: this.totalSamples
    };
  }

  getSpecializedModelsStatus(): SpecializedModelsStatus {
    return {
      activeCount: 3,
      totalCount: 4
    };
  }

  getAnalysisStatus(): AnalysisStatus {
    return {
      activeAnalyses: 7
    };
  }

  clearMetrics(): void {
    this.metrics = [];
    this.totalSamples = 0;
    systemLogger.log('model', 'Histórico de métricas limpo');
  }
}

export const modelMonitor = new ModelMonitor();