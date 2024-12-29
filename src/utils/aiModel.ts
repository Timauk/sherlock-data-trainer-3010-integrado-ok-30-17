import * as tf from '@tensorflow/tfjs';

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  validationSplit: number;
  earlyStoppingPatience: number;
}

export function createModel(): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: 64, inputShape: [null, 19], returnSequences: true })); // Aumentado para 19 inputs
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
  const xs = tf.tensor3d(data.map(row => [row.slice(0, 19)]));
  const ys = tf.tensor2d(data.map(row => row.slice(19)));

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
  const frequencyMap = new Map<number, number>();
  data.forEach(row => {
    row.forEach(n => {
      frequencyMap.set(n, (frequencyMap.get(n) || 0) + 1);
    });
  });

  return data.map(row => {
    const frequencies = row.map(n => frequencyMap.get(n) || 0);
    return [...row, ...frequencies];
  });
}

export async function updateModel(model: tf.LayersModel, newData: number[][]): Promise<tf.LayersModel> {
  const xs = tf.tensor2d(newData.map(row => row.slice(0, -15)));
  const ys = tf.tensor2d(newData.map(row => row.slice(-15)));

  await model.fit(xs, ys, {
    epochs: 1,
    batchSize: 32,
  });

  xs.dispose();
  ys.dispose();

  return model;
}
