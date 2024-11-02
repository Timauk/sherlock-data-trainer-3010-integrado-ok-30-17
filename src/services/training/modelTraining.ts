import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import type { Json } from '@/lib/database.types';

interface TrainingConfig {
  batchSize: number;
  epochs: number;
  learningRate: number;
  validationSplit: number;
}

export async function trainModelWithGames(games: any[], config: TrainingConfig) {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 32, activation: 'relu', inputShape: [15] }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({ units: 64, activation: 'relu' }),
      tf.layers.dense({ units: 25, activation: 'softmax' })
    ]
  });

  model.compile({
    optimizer: tf.train.adam(config.learningRate),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  const trainingData = games.map(game => ({
    input: game.numeros,
    output: game.numeros.map((n: number) => n - 1)
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
          const modelJson = model.toJSON();
          const weights = await model.getWeights();
          const weightsData = weights.map(w => Array.from(w.dataSync())); // Convert to regular arrays

          await supabase.from('trained_models').insert({
            model_data: modelJson as Json,
            metadata: {
              epoch,
              accuracy: logs.acc || 0,
              loss: logs.loss || 0,
              val_accuracy: logs.val_acc || 0,
              val_loss: logs.val_loss || 0,
              weightsData // Now it's a regular array
            } as Json,
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
    const { data: historicalGames, error: fetchError } = await supabase
      .from('historical_games')
      .select('*')
      .order('concurso', { ascending: true });

    if (fetchError) throw fetchError;

    const { error: upsertError } = await supabase
      .from('historical_games')
      .upsert(
        games.map(game => ({
          concurso: game.concurso,
          data: game.data,
          numeros: game.dezenas.map(Number)
        }))
      );

    if (upsertError) throw upsertError;

    const allGames = [...(historicalGames || []), ...games];
    const result = await trainModelWithGames(allGames, {
      batchSize: 32,
      epochs: 50,
      learningRate: 0.001,
      validationSplit: 0.2
    });

    const modelJson = result.model.toJSON();
    const weights = await result.model.getWeights();
    const weightsData = weights.map(w => Array.from(w.dataSync())); // Convert to regular arrays

    await supabase
      .from('trained_models')
      .update({ is_active: false })
      .eq('is_active', true);

    await supabase
      .from('trained_models')
      .insert({
        model_data: modelJson as Json,
        metadata: {
          timestamp: new Date().toISOString(),
          accuracy: typeof result.history.history.acc?.slice(-1)[0] === 'number' 
            ? result.history.history.acc.slice(-1)[0] 
            : 0,
          loss: typeof result.history.history.loss?.slice(-1)[0] === 'number'
            ? result.history.history.loss.slice(-1)[0]
            : 0,
          epochs: result.history.epoch.length,
          weightsData
        } as Json,
        is_active: true
      });

    return result;
  } catch (error) {
    console.error('Error in updateGamesAndTrain:', error);
    throw error;
  }
}