import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

export const usePredictionLogic = (trainedModel: tf.LayersModel | null, concursoNumber: number) => {
  const makePrediction = useCallback((inputData: number[], playerWeights: number[]): number[] => {
    if (!trainedModel) return [];
    
    const normalizedConcursoNumber = concursoNumber / 3184;
    const normalizedDataSorteio = Date.now() / (1000 * 60 * 60 * 24 * 365);
    const input = [...inputData, normalizedConcursoNumber, normalizedDataSorteio];
    
    const weightedInput = input.map((value, index) => value * (playerWeights[index] / 1000));
    const inputTensor = tf.tensor2d([weightedInput], [1, 17]);
    
    const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
    const result = Array.from(predictions.dataSync());
    
    inputTensor.dispose();
    predictions.dispose();
    
    // Ensure 15 unique numbers
    const uniqueNumbers = new Set<number>();
    while (uniqueNumbers.size < 15) {
      const num = Math.floor(Math.random() * 25) + 1;
      uniqueNumbers.add(num);
    }
    return Array.from(uniqueNumbers);
  }, [trainedModel, concursoNumber]);

  return { makePrediction };
};