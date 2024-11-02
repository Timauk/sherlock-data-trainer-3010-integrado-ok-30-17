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
          const modelJson = model.toJSON();
          const weights = await model.getWeights();
          const weightsData = await Promise.all(
            weights.map(w => w.data())
          );

          await supabase.from('trained_models').insert({
            model_data: modelJson,
            metadata: {
              epoch,
              accuracy: logs.acc || 0,
              loss: logs.loss || 0,
              val_accuracy: logs.val_acc || 0,
              val_loss: logs.val_loss || 0,
              weights: weightsData
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
    // Primeiro, busca todos os jogos históricos do banco
    const { data: historicalGames, error: fetchError } = await supabase
      .from('historical_games')
      .select('*')
      .order('concurso', { ascending: true });

    if (fetchError) throw fetchError;

    // Atualiza com novos jogos
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

    // Treina o modelo com todos os dados
    const allGames = [...(historicalGames || []), ...games];
    const result = await trainModelWithGames(allGames, {
      batchSize: 32,
      epochs: 50,
      learningRate: 0.001,
      validationSplit: 0.2
    });

    // Salva o modelo final
    const modelJson = result.model.toJSON();
    const weights = await result.model.getWeights();
    const weightsData = await Promise.all(
      weights.map(w => w.data())
    );

    // Desativa todos os modelos anteriores
    await supabase
      .from('trained_models')
      .update({ is_active: false })
      .eq('is_active', true);

    // Salva o novo modelo como ativo
    await supabase
      .from('trained_models')
      .insert({
        model_data: modelJson,
        metadata: {
          timestamp: new Date().toISOString(),
          accuracy: result.history.history.acc?.slice(-1)[0] || 0,
          loss: result.history.history.loss?.slice(-1)[0] || 0,
          epochs: result.history.epoch.length,
          weights: weightsData
        },
        is_active: true
      });

    return result;
  } catch (error) {
    console.error('Error in updateGamesAndTrain:', error);
    throw error;
  }
}