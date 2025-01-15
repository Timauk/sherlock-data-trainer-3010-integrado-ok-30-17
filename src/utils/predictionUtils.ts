import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '../types/gameTypes';
import { systemLogger } from './logging/systemLogger';

export const makePrediction = async (
  model: tf.LayersModel,
  currentNumbers: number[],
  weights: number[],
  concursoNumber: number,
  setVisualization: (vis: ModelVisualization | null) => void,
  lunarInfo: { lunarPhase: string; lunarPatterns: Record<string, number[]> },
  timeSeriesData: { numbers: number[][]; dates: Date[] }
): Promise<number[]> => {
  const inputTensor = tf.tensor2d([currentNumbers]);
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const predictedNumbers = Array.from(await prediction.data());
  
  setVisualization({
    input: currentNumbers,
    output: predictedNumbers,
    weights: weights,
  });

  inputTensor.dispose();
  prediction.dispose();

  return predictedNumbers;
};
