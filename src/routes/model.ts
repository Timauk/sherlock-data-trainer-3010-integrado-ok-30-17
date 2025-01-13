import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { logger } from '../utils/logging/logger.js';

const router = express.Router();
let globalModel: tf.Sequential | null = null;

async function getOrCreateModel(): Promise<tf.Sequential> {
  if (!globalModel) {
    globalModel = tf.sequential();
    globalModel.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [17] }));
    globalModel.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    globalModel.add(tf.layers.dense({ units: 15, activation: 'sigmoid' }));
    globalModel.compile({ 
      optimizer: 'adam', 
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }
  return globalModel;
}

function calculateConfidence(predictions: number[]): number {
  const certainty = predictions.reduce((acc: number, pred: number) => {
    const distance = Math.abs(pred - 0.5);
    return acc + (distance / 0.5);
  }, 0);
  
  return (certainty / predictions.length) * 100;
}

router.post('/train', async (req, res) => {
  try {
    const { trainingData } = req.body as { trainingData: number[][] };
    const model = await getOrCreateModel();
    
    const xs = tf.tensor2d(trainingData.map(d => d.slice(0, -15)));
    const ys = tf.tensor2d(trainingData.map(d => d.slice(-15)));
    
    const result = await model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2
    });
    
    res.json({
      loss: result.history.loss[result.history.loss.length - 1],
      accuracy: result.history.acc[result.history.acc.length - 1]
    });
    
    xs.dispose();
    ys.dispose();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/predict', async (req, res) => {
  try {
    const { inputData } = req.body as { inputData: number[] };
    const model = await getOrCreateModel();
    
    const inputTensor = tf.tensor2d([inputData]);
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await prediction.data()) as number[];
    
    const confidence = calculateConfidence(result);
    
    inputTensor.dispose();
    prediction.dispose();
    
    res.json({ prediction: result, confidence });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export { router as modelRouter };
