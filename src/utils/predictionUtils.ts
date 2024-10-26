import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '../types/gameTypes';

export async function makePrediction(
  trainedModel: tf.LayersModel | null,
  inputData: number[],
  playerWeights: number[],
  concursoNumber: number,
  setNeuralNetworkVisualization: (vis: ModelVisualization) => void
): Promise<number[]> {
  if (!trainedModel) return [];
  
  const normalizedConcursoNumber = concursoNumber / 3184;
  const normalizedDataSorteio = Date.now() / (1000 * 60 * 60 * 24 * 365);
  const input = [...inputData, normalizedConcursoNumber, normalizedDataSorteio];
  
  const weightedInput = input.map((value, index) => value * (playerWeights[index] / 1000));
  const inputTensor = tf.tensor2d([weightedInput], [1, 17]);
  
  const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
  const result = Array.from(await predictions.data());
  
  inputTensor.dispose();
  predictions.dispose();
  
  setNeuralNetworkVisualization({ 
    input: weightedInput, 
    output: result, 
    weights: trainedModel.getWeights().map(w => Array.from(w.dataSync())) 
  });
  
  // Ensure 15 unique numbers
  const uniqueNumbers = new Set<number>();
  while (uniqueNumbers.size < 15) {
    const num = Math.floor(Math.random() * 25) + 1;
    uniqueNumbers.add(num);
  }
  return Array.from(uniqueNumbers);
}