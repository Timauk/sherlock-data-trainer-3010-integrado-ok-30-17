import * as tf from '@tensorflow/tfjs';
import { analysisCache } from './cacheSystem';

export interface TimeSeriesAnalysis {
  trend: number[];
  seasonality: number[];
  cycles: number[];
  predictions: number[];
}

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
  const result: number[] = [];
  
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
  const reshapedCycles = cycles.reshape(trend.shape) as tf.Tensor1D;
  
  const combined = tf.tidy(() => {
    const seasonalityTrend = tf.add(trend, seasonality) as tf.Tensor1D;
    return tf.add(seasonalityTrend, reshapedCycles) as tf.Tensor1D;
  });
  
  return combined;
};

export const analyzeTimeSeries = async (
  historicalData: number[][],
  windowSize: number = 10
): Promise<TimeSeriesAnalysis> => {
  const cacheKey = `timeseries-${windowSize}-${historicalData.length}`;
  const cached = await analysisCache.get(cacheKey);
  if (cached) return cached;

  const flatData = historicalData.flat();
  const tensor = tf.tensor1d(flatData);

  const trend = await calculateMovingAverage(tensor, windowSize);
  const seasonality = await calculateSeasonality(tensor, windowSize);
  const cycles = await detectCycles(tensor);
  const predictions = await makePredictions(tensor, trend, seasonality, cycles);

  const result: TimeSeriesAnalysis = {
    trend: Array.from(await trend.data()),
    seasonality: Array.from(await seasonality.data()),
    cycles: Array.from(await cycles.data()),
    predictions: Array.from(await predictions.data())
  };

  await analysisCache.set(cacheKey, result);
  
  tensor.dispose();
  trend.dispose();
  seasonality.dispose();
  cycles.dispose();
  predictions.dispose();

  return result;
};