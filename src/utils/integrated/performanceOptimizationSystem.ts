import * as tf from '@tensorflow/tfjs';
import pako from 'pako';
import { systemLogger } from '../logging/systemLogger';

interface BatchProcessingConfig {
  batchSize: number;
  maxConcurrent: number;
  compressionEnabled: boolean;
}

class PerformanceOptimizationSystem {
  private static instance: PerformanceOptimizationSystem;
  private workers: Worker[] = [];
  private taskQueue: Array<() => Promise<any>> = [];
  private activeWorkers = 0;
  private config: BatchProcessingConfig = {
    batchSize: 32,
    maxConcurrent: navigator.hardwareConcurrency || 4,
    compressionEnabled: true
  };

  private constructor() {}

  static getInstance(): PerformanceOptimizationSystem {
    if (!PerformanceOptimizationSystem.instance) {
      PerformanceOptimizationSystem.instance = new PerformanceOptimizationSystem();
    }
    return PerformanceOptimizationSystem.instance;
  }

  async processPredictionBatch(
    model: tf.LayersModel,
    inputs: number[][],
    playerWeights: number[]
  ): Promise<number[][]> {
    try {
      const batches = [];
      
      for (let i = 0; i < inputs.length; i += this.config.batchSize) {
        const batchInputs = inputs.slice(i, i + this.config.batchSize);
        const inputTensor = tf.tensor2d(batchInputs);
        
        const predictions = await model.predict(inputTensor) as tf.Tensor;
        const batchResults = await predictions.array() as number[][];
        
        batches.push(...batchResults.map(pred => 
          pred.map((p, idx) => p * (playerWeights[idx % playerWeights.length] / 1000))
        ));
        
        inputTensor.dispose();
        predictions.dispose();
      }
      
      return batches;
    } catch (error) {
      systemLogger.log('performance', 'Erro no processamento em lote', { error });
      throw error;
    }
  }

  async addTask<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.activeWorkers >= this.config.maxConcurrent || this.taskQueue.length === 0) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) return;

    this.activeWorkers++;
    try {
      await task();
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }

  compressData(data: number[][]): Uint8Array {
    if (!this.config.compressionEnabled) return new Uint8Array(0);
    
    try {
      const jsonString = JSON.stringify(data);
      return pako.deflate(jsonString);
    } catch (error) {
      systemLogger.log('performance', 'Erro na compressão de dados', { error });
      throw error;
    }
  }

  decompressData(compressedData: Uint8Array): number[][] {
    if (!this.config.compressionEnabled) return [];
    
    try {
      const jsonString = pako.inflate(compressedData, { to: 'string' });
      return JSON.parse(jsonString);
    } catch (error) {
      systemLogger.log('performance', 'Erro na descompressão de dados', { error });
      throw error;
    }
  }

  updateConfig(newConfig: Partial<BatchProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    systemLogger.log('performance', 'Configuração atualizada', { config: this.config });
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;
    systemLogger.log('performance', 'Sistema de otimização finalizado');
  }
}

export const performanceOptimizationSystem = PerformanceOptimizationSystem.getInstance();