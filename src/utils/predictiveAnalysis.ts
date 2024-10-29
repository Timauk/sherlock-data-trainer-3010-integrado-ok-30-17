import * as tf from '@tensorflow/tfjs';
import { analysisCache } from './cacheSystem';

export interface TimeSeriesAnalysis {
  trend: number[];
  seasonality: number[];
  cycles: number[];
  predictions: number[];
}

export interface CorrelationAnalysis {
  matrix: number[][];
  significantPairs: Array<{
    numbers: [number, number];
    correlation: number;
  }>;
}

export const analyzeTimeSeries = async (
  historicalData: number[][],
  windowSize: number = 10
): Promise<TimeSeriesAnalysis> => {
  const cacheKey = `timeseries-${windowSize}-${historicalData.length}`;
  const cached = await analysisCache.get(cacheKey);
  if (cached) return cached;

  const flatData = historicalData.flat();
  const tensor = tf.tensor1d(flatData);

  // Calcular tendência usando média móvel
  const trend = await calculateMovingAverage(tensor, windowSize);

  // Calcular sazonalidade
  const seasonality = await calculateSeasonality(tensor, windowSize);

  // Detectar ciclos usando autocorrelação
  const cycles = await detectCycles(tensor);

  // Fazer previsões
  const predictions = await makePredictions(tensor, trend, seasonality, cycles);

  const result = {
    trend: Array.from(await trend.data()),
    seasonality: Array.from(await seasonality.data()),
    cycles: Array.from(await cycles.data()),
    predictions: Array.from(await predictions.data()),
  };

  await analysisCache.set(cacheKey, result);
  
  // Limpar tensores
  tensor.dispose();
  trend.dispose();
  seasonality.dispose();
  cycles.dispose();
  predictions.dispose();

  return result;
};

const calculateMovingAverage = async (
  data: tf.Tensor1D,
  windowSize: number
): Promise<tf.Tensor1D> => {
  const values = await data.array();
  const result = [];
  
  for (let i = 0; i < values.length - windowSize + 1; i++) {
    const window = values.slice(i, i + windowSize);
    const average = window.reduce((a, b) => a + b) / windowSize;
    result.push(average);
  }
  
  // Preencher o início com o primeiro valor calculado
  while (result.length < values.length) {
    result.unshift(result[0]);
  }
  
  return tf.tensor1d(result);
};

const calculateSeasonality = async (
  data: tf.Tensor1D,
  period: number
): Promise<tf.Tensor1D> => {
  const values = await data.array();
  const result = [];
  
  for (let i = 0; i < values.length; i++) {
    const seasonIndex = i % period;
    const seasonValues = [];
    
    for (let j = seasonIndex; j < values.length; j += period) {
      seasonValues.push(values[j]);
    }
    
    const seasonAverage = seasonValues.reduce((a, b) => a + b) / seasonValues.length;
    result.push(seasonAverage);
  }
  
  return tf.tensor1d(result);
};

const detectCycles = async (data: tf.Tensor1D): Promise<tf.Tensor1D> => {
  const values = await data.array();
  const result = [];
  
  // Calcular autocorrelação para diferentes lags
  for (let lag = 1; lag <= Math.floor(values.length / 2); lag++) {
    let correlation = 0;
    let n = values.length - lag;
    
    for (let i = 0; i < n; i++) {
      correlation += (values[i] - values[i + lag]) ** 2;
    }
    
    correlation = correlation / n;
    result.push(correlation);
  }
  
  return tf.tensor1d(result);
};

const makePredictions = async (
  data: tf.Tensor1D,
  trend: tf.Tensor1D,
  seasonality: tf.Tensor1D,
  cycles: tf.Tensor1D
): Promise<tf.Tensor1D> => {
  // Ensure all tensors have the same shape
  const reshapedCycles = cycles.reshape(trend.shape);
  
  // Combine components safely with proper shapes
  const combined = tf.tidy(() => {
    const seasonalityTrend = tf.add(trend, seasonality);
    return tf.add(seasonalityTrend, reshapedCycles).asType('float32');
  });
  
  return combined as tf.Tensor1D;
};

const calculateCorrelation = (
  numbers: number[][],
  num1: number,
  num2: number
): number => {
  // Convert boolean presence to binary values (0 or 1)
  const occurrences1 = numbers.map(draw => draw.includes(num1) ? (1 as const) : (0 as const));
  const occurrences2 = numbers.map(draw => draw.includes(num2) ? (1 as const) : (0 as const));

  const mean1 = occurrences1.reduce((a, b) => a + b) / occurrences1.length;
  const mean2 = occurrences2.reduce((a, b) => a + b) / occurrences2.length;

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < occurrences1.length; i++) {
    const diff1 = occurrences1[i] - mean1;
    const diff2 = occurrences2[i] - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  return numerator / Math.sqrt(denominator1 * denominator2);
};

export const analyzeCorrelations = async (
  numbers: number[][],
  threshold: number = 0.7
): Promise<CorrelationAnalysis> => {
  const cacheKey = `correlations-${threshold}-${numbers.length}`;
  const cached = await analysisCache.get(cacheKey);
  if (cached) return cached;

  const flatNumbers = numbers.flat();
  const uniqueNumbers = Array.from(new Set(flatNumbers));
  const matrix: number[][] = [];
  const significantPairs: Array<{
    numbers: [number, number];
    correlation: number;
  }> = [];

  // Calcular matriz de correlação
  for (let i = 0; i < uniqueNumbers.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < uniqueNumbers.length; j++) {
      const correlation = calculateCorrelation(
        numbers,
        uniqueNumbers[i],
        uniqueNumbers[j]
      );
      matrix[i][j] = correlation;

      if (i < j && Math.abs(correlation) > threshold) {
        significantPairs.push({
          numbers: [uniqueNumbers[i], uniqueNumbers[j]],
          correlation
        });
      }
    }
  }

  const result = { matrix, significantPairs };
  await analysisCache.set(cacheKey, result);
  return result;
};
