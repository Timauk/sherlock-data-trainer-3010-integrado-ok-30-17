import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';

const BATCH_SIZE = 32;

export const processPredictionBatch = async (
  model: tf.LayersModel,
  inputs: number[][],
  playerWeights: number[]
): Promise<number[][]> => {
  const batches = [];
  
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batchInputs = inputs.slice(i, i + BATCH_SIZE);
    const inputTensor = tf.tensor2d(batchInputs);
    
    const predictions = await model.predict(inputTensor) as tf.Tensor;
    const batchResults = await predictions.array() as number[][];
    
    batches.push(...batchResults.map(pred => 
      pred.map((p, idx) => p * (playerWeights[idx % playerWeights.length] / 1000))
    ));
    
    inputTensor.dispose();
    predictions.dispose();
  }
  
  return batches;
};