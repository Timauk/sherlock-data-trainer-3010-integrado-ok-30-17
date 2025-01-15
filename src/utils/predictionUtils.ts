import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '@/types/gameTypes';
import { systemLogger } from './logging/systemLogger';

export const makePrediction = async (
  model: tf.LayersModel,
  currentNumbers: number[],
  weights: number[],
  concursoNumber: number,
  setVisualization: (vis: ModelVisualization) => void,
  lunarData: {
    lunarPhase: number;
    lunarPatterns: number[];
  },
  timeSeriesData: {
    numbers: number[][];
    dates: Date[];
  }
): Promise<number[]> => {
  try {
    const normalizedInput = currentNumbers.map(n => n / 25);
    const inputTensor = tf.tensor2d([normalizedInput]);
    
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const predictionArray = Array.from(await prediction.data());
    
    const weightedPredictions = predictionArray.map((pred, idx) => ({
      number: idx + 1,
      probability: pred * (weights[idx % weights.length] / 1000)
    }));
    
    const sortedPredictions = weightedPredictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(p => p.number)
      .sort((a, b) => a - b);
    
    setVisualization({
      layers: model.layers.map(layer => ({
        name: layer.name,
        units: layer.units || 0,
        activation: layer.getConfig().activation
      })),
      predictions: weightedPredictions
    });
    
    inputTensor.dispose();
    prediction.dispose();
    
    return sortedPredictions;
    
  } catch (error) {
    systemLogger.log('system', `Erro ao fazer previsão: ${error}`);
    throw error;
  }
};