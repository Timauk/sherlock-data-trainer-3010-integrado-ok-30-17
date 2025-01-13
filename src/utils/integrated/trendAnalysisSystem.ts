import { systemLogger } from '../logging/systemLogger.js';
import { supabase } from '../../lib/supabase';

interface TrendAnalysis {
  seasonalPatterns: {
    monthly: number[];
    quarterly: number[];
    yearly: number[];
  };
  cyclicalPatterns: number[][];
  volatility: number[];
}

interface ArimaConfig {
  p: number;
  d: number;
  q: number;
}

class TrendAnalysisSystem {
  private static instance: TrendAnalysisSystem;
  private config: ArimaConfig = { p: 1, d: 1, q: 1 };

  private constructor() {}

  static getInstance(): TrendAnalysisSystem {
    if (!TrendAnalysisSystem.instance) {
      TrendAnalysisSystem.instance = new TrendAnalysisSystem();
    }
    return TrendAnalysisSystem.instance;
  }

  analyzeTrends(numbers: number[][], dates: Date[]): TrendAnalysis {
    try {
      return {
        seasonalPatterns: this.analyzeSeasonalPatterns(numbers, dates),
        cyclicalPatterns: this.analyzeCyclicalPatterns(numbers),
        volatility: this.calculateVolatility(numbers)
      };
    } catch (error) {
      systemLogger.log('system', 'Erro na análise de tendências', { error });
      throw error;
    }
  }

  private analyzeSeasonalPatterns(
    numbers: number[][],
    dates: Date[]
  ): { monthly: number[]; quarterly: number[]; yearly: number[] } {
    const monthly = Array(12).fill(0);
    const quarterly = Array(4).fill(0);
    const yearly = Array(Math.min(10, Math.floor(numbers.length / 365))).fill(0);

    dates.forEach((date, idx) => {
      const month = date.getMonth();
      const quarter = Math.floor(month / 3);
      const year = date.getFullYear() - dates[0].getFullYear();

      if (year < yearly.length) {
        numbers[idx].forEach(() => {
          monthly[month]++;
          quarterly[quarter]++;
          yearly[year]++;
        });
      }
    });

    return { monthly, quarterly, yearly };
  }

  private analyzeCyclicalPatterns(numbers: number[][]): number[][] {
    const patterns: number[][] = [];
    const windowSizes = [5, 10, 20];

    windowSizes.forEach(size => {
      const pattern = this.findCyclicalPattern(numbers, size);
      if (pattern.length > 0) {
        patterns.push(pattern);
      }
    });

    return patterns;
  }

  private findCyclicalPattern(numbers: number[][], windowSize: number): number[] {
    const frequency: { [key: string]: number } = {};

    for (let i = 0; i <= numbers.length - windowSize; i++) {
      const window = numbers.slice(i, i + windowSize);
      const key = window.map(nums => nums.join(',')).join('|');
      frequency[key] = (frequency[key] || 0) + 1;
    }

    const mostFrequent = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)[0];

    if (mostFrequent && mostFrequent[1] > 1) {
      return mostFrequent[0]
        .split('|')[0]
        .split(',')
        .map(Number);
    }

    return [];
  }

  private calculateVolatility(numbers: number[][]): number[] {
    const volatility: number[] = [];
    const windowSize = 10;

    for (let i = windowSize; i < numbers.length; i++) {
      const window = numbers.slice(i - windowSize, i);
      const changes = window.map((nums, idx) => {
        if (idx === 0) return 0;
        const prevNums = new Set(window[idx - 1]);
        return nums.filter(n => !prevNums.has(n)).length;
      });

      const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
      volatility.push(avgChange);
    }

    return volatility;
  }

  predictNextNumbers(historicalData: number[][]): number[] {
    const timeSeries = historicalData.map(draw => 
      draw.reduce((acc, num) => acc + num, 0) / draw.length
    );

    const stationarySeries = this.difference(timeSeries, this.config.d);
    const predictions = this.autoregressive(stationarySeries);

    return this.transformPredictionsToNumbers(predictions, historicalData);
  }

  private difference(series: number[], order: number = 1): number[] {
    if (order === 0) return series;
    
    const diffed = [];
    for (let i = 1; i < series.length; i++) {
      diffed.push(series[i] - series[i - 1]);
    }
    
    return this.difference(diffed, order - 1);
  }

  private autoregressive(series: number[]): number[] {
    const predictions: number[] = [];
    const p = this.config.p;
    
    for (let i = p; i < series.length; i++) {
      let prediction = 0;
      for (let j = 1; j <= p; j++) {
        prediction += series[i - j] * this.autocorrelation(series, j);
      }
      predictions.push(prediction);
    }
    
    return predictions;
  }

  private autocorrelation(series: number[], lag: number): number {
    const n = series.length;
    const mean = series.reduce((a, b) => a + b) / n;
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
      numerator += (series[i] - mean) * (series[i + lag] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(series[i] - mean, 2);
    }

    return numerator / denominator;
  }

  private transformPredictionsToNumbers(
    predictions: number[],
    historicalData: number[][]
  ): number[] {
    const frequencyMap = new Map<number, number>();
    
    historicalData.forEach(draw => {
      draw.forEach(num => {
        frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
      });
    });

    const weightedNumbers = Array.from({ length: 25 }, (_, i) => i + 1)
      .map(num => ({
        number: num,
        weight: (frequencyMap.get(num) || 0) / historicalData.length +
                predictions[predictions.length - 1] * Math.random()
      }));

    return weightedNumbers
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15)
      .map(n => n.number)
      .sort((a, b) => a - b);
  }
}

export const trendAnalysisSystem = TrendAnalysisSystem.getInstance();
