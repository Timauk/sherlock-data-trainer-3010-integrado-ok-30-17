import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '../types/gameTypes';
import { analyzeAdvancedPatterns, enrichPredictionData } from './advancedDataAnalysis';

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
  lunarData?: LunarData,
  historicalData?: { numbers: number[][], dates: Date[] }
): Promise<number[]> {
  if (!trainedModel) return [];
  
  const normalizedConcursoNumber = concursoNumber / 3184;
  const normalizedDataSorteio = Date.now() / (1000 * 60 * 60 * 24 * 365);
  
  let enrichedInput = [
    ...inputData.slice(0, 15), 
    normalizedConcursoNumber, 
    normalizedDataSorteio
  ];
  
  // Adiciona aleatoriedade aos pesos do jogador
  const randomizedWeights = playerWeights.map(weight => {
    const randomFactor = 1 + (Math.random() - 0.5) * 0.2; // ±10% de variação
    return weight * randomFactor;
  });
  
  const weightedInput = enrichedInput.map((value, index) => 
    value * (randomizedWeights[index] / 1000));
  
  const inputTensor = tf.tensor2d([weightedInput]);
  
  const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
  const result = Array.from(await predictions.data());
  
  inputTensor.dispose();
  predictions.dispose();
  
  setNeuralNetworkVisualization({ 
    input: weightedInput, 
    output: result, 
    weights: trainedModel.getWeights().map(w => Array.from(w.dataSync())) 
  });
  
  // Adiciona aleatoriedade na seleção dos números
  const weightedNumbers = Array.from({ length: 25 }, (_, i) => ({
    number: i + 1,
    weight: result[i % result.length] * (1 + (Math.random() - 0.5) * 0.3) // ±15% de variação
  })).sort((a, b) => b.weight - a.weight);
  
  // Seleciona 15 números únicos
  const uniqueNumbers = new Set<number>();
  let index = 0;
  
  while (uniqueNumbers.size < 15 && index < weightedNumbers.length) {
    uniqueNumbers.add(weightedNumbers[index].number);
    index++;
  }
  
  // Se ainda precisar de mais números, adiciona aleatoriamente
  while (uniqueNumbers.size < 15) {
    const randomNum = Math.floor(Math.random() * 25) + 1;
    uniqueNumbers.add(randomNum);
  }
  
  return Array.from(uniqueNumbers).sort((a, b) => a - b);
}