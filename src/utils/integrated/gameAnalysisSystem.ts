import { systemLogger } from '../logging/systemLogger.js';
import { supabase } from '../../lib/supabase';
import * as tf from '@tensorflow/tfjs';

interface GameAnalysis {
  timestamp: string;
  metrics: {
    accuracy: number;
    predictions: number[];
    confidence: number;
  };
  patterns: {
    frequency: Record<number, number>;
    sequences: number[][];
  };
}

export class GameAnalysisSystem {
  private static instance: GameAnalysisSystem;
  private analysisHistory: GameAnalysis[] = [];
  private readonly maxHistorySize = 1000;

  private constructor() {}

  static getInstance(): GameAnalysisSystem {
    if (!GameAnalysisSystem.instance) {
      GameAnalysisSystem.instance = new GameAnalysisSystem();
    }
    return GameAnalysisSystem.instance;
  }

  async analyzeGame(
    predictions: number[],
    actualNumbers: number[],
    model: tf.LayersModel
  ): Promise<GameAnalysis> {
    try {
      const accuracy = this.calculateAccuracy(predictions, actualNumbers);
      const confidence = this.calculateConfidence(predictions);
      const patterns = this.analyzePatterns(actualNumbers);

      const analysis: GameAnalysis = {
        timestamp: new Date().toISOString(),
        metrics: {
          accuracy,
          predictions,
          confidence
        },
        patterns
      };

      await this.saveAnalysis(analysis);
      this.updateHistory(analysis);

      systemLogger.log('analysis', 'Game analysis completed', {
        accuracy,
        confidence,
        patternsFound: patterns.sequences.length
      });

      return analysis;
    } catch (error) {
      systemLogger.log('analysis', 'Error analyzing game', { error });
      throw error;
    }
  }

  private calculateAccuracy(predictions: number[], actual: number[]): number {
    const matches = predictions.filter((pred, index) => pred === actual[index]);
    return (matches.length / predictions.length) * 100;
  }

  private calculateConfidence(predictions: number[]): number {
    const certainty = predictions.reduce((acc, pred) => {
      const distance = Math.abs(pred - 0.5);
      return acc + (distance / 0.5);
    }, 0);
    
    return (certainty / predictions.length) * 100;
  }

  private analyzePatterns(numbers: number[]): {
    frequency: Record<number, number>;
    sequences: number[][];
  } {
    const frequency: Record<number, number> = {};
    const sequences: number[][] = [];

    // Calculate frequency
    numbers.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1;
    });

    // Find sequences (3 or more consecutive numbers)
    for (let i = 0; i < numbers.length - 2; i++) {
      const sequence = [numbers[i]];
      let j = i + 1;
      while (j < numbers.length && numbers[j] === numbers[j-1] + 1) {
        sequence.push(numbers[j]);
        j++;
      }
      if (sequence.length >= 3) {
        sequences.push(sequence);
      }
    }

    return { frequency, sequences };
  }

  private async saveAnalysis(analysis: GameAnalysis): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_analysis')
        .insert({
          timestamp: analysis.timestamp,
          metrics: analysis.metrics,
          patterns: analysis.patterns
        });

      if (error) throw error;
    } catch (error) {
      systemLogger.log('analysis', 'Error saving analysis to database', { error });
      // Continue execution even if save fails
    }
  }

  private updateHistory(analysis: GameAnalysis): void {
    this.analysisHistory.push(analysis);
    if (this.analysisHistory.length > this.maxHistorySize) {
      this.analysisHistory.shift();
    }
  }

  getAnalysisHistory(): GameAnalysis[] {
    return [...this.analysisHistory];
  }

  async getHistoricalAnalysis(): Promise<GameAnalysis[]> {
    try {
      const { data, error } = await supabase
        .from('game_analysis')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(this.maxHistorySize);

      if (error) throw error;
      return data || [];
    } catch (error) {
      systemLogger.log('analysis', 'Error fetching historical analysis', { error });
      return [];
    }
  }

  clearHistory(): void {
    this.analysisHistory = [];
    systemLogger.log('analysis', 'Analysis history cleared');
  }
}

export const gameAnalysisSystem = GameAnalysisSystem.getInstance();