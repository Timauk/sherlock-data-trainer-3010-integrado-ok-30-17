import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';

interface TrainingConfig {
  batchSize: number;
  epochs: number;
  learningRate: number;
  validationSplit: number;
}

export async function trainModelWithGames(games: any[], config: TrainingConfig) {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 128, activation: 'relu', inputShape: [17] }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({ units: 64, activation: 'relu' }),
      tf.layers.dense({ units: 15, activation: 'sigmoid' })
    ]
  });

  model.compile({
    optimizer: tf.train.adam(config.learningRate),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  const trainingData = games.map(game => ({
    input: [...game.numeros, game.concurso],
    output: game.numeros
  }));

  const xs = tf.tensor2d(trainingData.map(d => d.input));
  const ys = tf.tensor2d(trainingData.map(d => d.output));

  const history = await model.fit(xs, ys, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: config.validationSplit,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (logs) {
          await supabase.from('trained_models').insert({
            model_data: model.toJSON(),
            metadata: {
              epoch,
              accuracy: logs.acc || 0,
              loss: logs.loss || 0,
              val_accuracy: logs.val_acc || 0,
              val_loss: logs.val_loss || 0
            },
            is_active: true
          });
        }
      }
    }
  });

  xs.dispose();
  ys.dispose();

  return { model, history };
}

export async function updateGamesAndTrain(games: any[]) {
  try {
    const { error } = await supabase
      .from('historical_games')
      .upsert(
        games.map(game => ({
          concurso: game.concurso,
          data: game.data,
          numeros: game.dezenas.map(Number)
        }))
      );

    if (error) throw error;

    const result = await trainModelWithGames(games, {
      batchSize: 32,
      epochs: 50,
      learningRate: 0.001,
      validationSplit: 0.2
    });
    return result;
  } catch (error) {
    console.error('Error in updateGamesAndTrain:', error);
    throw error;
  }
}