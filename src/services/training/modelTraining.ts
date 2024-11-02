import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '@/utils/logging/systemLogger';

export async function trainModelWithGames(games: any[]): Promise<tf.LayersModel> {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 128, activation: 'relu', inputShape: [17] }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({ units: 64, activation: 'relu' }),
      tf.layers.dense({ units: 15, activation: 'sigmoid' })
    ]
  });

  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  const trainingData = games.map(game => ({
    input: [...game.dezenas.map(Number), game.concurso],
    output: game.dezenas.map(Number)
  }));

  const xs = tf.tensor2d(trainingData.map(d => d.input));
  const ys = tf.tensor2d(trainingData.map(d => d.output));

  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2
  });

  xs.dispose();
  ys.dispose();

  return model;
}