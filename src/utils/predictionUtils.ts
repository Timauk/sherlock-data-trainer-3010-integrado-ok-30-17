import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '../types/gameTypes';

interface LunarData {
  lunarPhase: string;
  lunarPatterns: Record<string, number[]>;
}

export async function makePrediction(
  trainedModel: tf.LayersModel | null,
  inputData: number[],
  playerWeights: number[],
  concursoNumber: number,
  setNeuralNetworkVisualization: (vis: ModelVisualization) => void,
  lunarData?: LunarData
): Promise<number[]> {
  if (!trainedModel) return [];
  
  const normalizedConcursoNumber = concursoNumber / 3184;
  const normalizedDataSorteio = Date.now() / (1000 * 60 * 60 * 24 * 365);
  
  // Include lunar phase data in prediction
  const lunarPhaseEncoding = {
    Nova: [1, 0, 0, 0],
    Crescente: [0, 1, 0, 0],
    Cheia: [0, 0, 1, 0],
    Minguante: [0, 0, 0, 1]
  };
  
  const lunarPhaseData = lunarData ? 
    lunarPhaseEncoding[lunarData.lunarPhase as keyof typeof lunarPhaseEncoding] : 
    [0, 0, 0, 0];

  const input = [
    ...inputData, 
    normalizedConcursoNumber, 
    normalizedDataSorteio,
    ...lunarPhaseData
  ];
  
  const weightedInput = input.map((value, index) => 
    value * (playerWeights[index] / 1000));
  
  const inputTensor = tf.tensor2d([weightedInput], [1, weightedInput.length]);
  
  const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
  const result = Array.from(await predictions.data());
  
  inputTensor.dispose();
  predictions.dispose();
  
  setNeuralNetworkVisualization({ 
    input: weightedInput, 
    output: result, 
    weights: trainedModel.getWeights().map(w => Array.from(w.dataSync())) 
  });
  
  // Ensure 15 unique numbers with weighted random selection
  const uniqueNumbers = new Set<number>();
  const weightedNumbers = result.map((weight, index) => ({
    number: index + 1,
    weight: weight
  })).sort((a, b) => b.weight - a.weight);
  
  while (uniqueNumbers.size < 15) {
    const selectedNumber = weightedNumbers[uniqueNumbers.size].number;
    uniqueNumbers.add(selectedNumber);
  }
  
  return Array.from(uniqueNumbers);
}