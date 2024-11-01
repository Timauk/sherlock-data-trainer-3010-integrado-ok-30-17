import * as tf from '@tensorflow/tfjs';

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  validationSplit: number;
  earlyStoppingPatience: number;
}

export function createModel(): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: 64, inputShape: [null, 17], returnSequences: true }));
  model.add(tf.layers.lstm({ units: 32 }));
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 15, activation: 'sigmoid' }));
  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
  return model;
}

export async function trainModel(
  model: tf.LayersModel,
  data: number[][],
  config: TrainingConfig
): Promise<tf.History> {
  const xs = tf.tensor3d(data.map(row => [row.slice(0, 17)]));
  const ys = tf.tensor2d(data.map(row => row.slice(17)));

  const history = await model.fit(xs, ys, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: config.validationSplit,
    callbacks: tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: config.earlyStoppingPatience })
  });

  xs.dispose();
  ys.dispose();

  return history;
}

export function normalizeData(data: number[][]): number[][] {
  const maxValue = 25;
  return data.map(row => row.map(n => n / maxValue));
}

export function denormalizeData(data: number[][]): number[][] {
  const maxValue = 25;
  return data.map(row => row.map(n => Math.round(n * maxValue)));
}

export function addDerivedFeatures(data: number[][]): number[][] {
  // Frequency analysis
  const frequencyMap = new Map<number, number>();
  data.forEach(row => {
    row.forEach(n => {
      frequencyMap.set(n, (frequencyMap.get(n) || 0) + 1);
    });
  });

  // Calculate global statistics
  const allNumbers = data.flat();
  const globalMean = allNumbers.reduce((a, b) => a + b, 0) / allNumbers.length;
  const globalStd = Math.sqrt(
    allNumbers.reduce((a, b) => a + Math.pow(b - globalMean, 2), 0) / allNumbers.length
  );

  return data.map(row => {
    // Basic features
    const frequencies = row.map(n => frequencyMap.get(n) || 0);
    const evenCount = row.filter(n => n % 2 === 0).length;
    const oddCount = row.length - evenCount;
    const sum = row.reduce((a, b) => a + b, 0);
    const mean = sum / row.length;
    
    // Statistical features
    const variance = row.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / row.length;
    const std = Math.sqrt(variance);
    const zScores = row.map(n => (n - globalMean) / globalStd);
    
    // Pattern features
    const consecutivePairs = row.slice(1).filter((n, i) => n === row[i] + 1).length;
    const gaps = row.slice(1).map((n, i) => n - row[i]);
    const maxGap = Math.max(...gaps);
    const minGap = Math.min(...gaps);
    
    return [
      ...row,
      ...frequencies,
      evenCount,
      oddCount,
      sum,
      mean,
      std,
      ...zScores,
      consecutivePairs,
      maxGap,
      minGap
    ];
  });
}

export async function updateModel(model: tf.LayersModel, newData: number[][]): Promise<tf.LayersModel> {
  const xs = tf.tensor2d(newData.map(row => row.slice(0, -15)));
  const ys = tf.tensor2d(newData.map(row => row.slice(-15)));

  // Adaptive epochs based on data size
  const epochs = Math.min(Math.ceil(newData.length / 100), 10);
  
  await model.fit(xs, ys, {
    epochs,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (logs && logs.val_loss < logs.loss * 0.8) {
          console.warn('Early stopping due to potential overfitting');
          return;
        }
      }
    }
  });

  xs.dispose();
  ys.dispose();

  return model;
}