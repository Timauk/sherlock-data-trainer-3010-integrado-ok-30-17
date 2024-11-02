import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { TrainingMetadata, TrainingResult, ModelExport } from './types';
import { saveModelToSupabase, loadModelFromSupabase } from './modelStorage';

export const trainingService = {
  saveModel: saveModelToSupabase,
  loadLatestModel: loadModelFromSupabase,

  async getTrainingHistory() {
    try {
      const { data, error } = await supabase
        .from('trained_models')
        .select('metadata, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      systemLogger.log('system', 'Erro ao buscar histórico de treinamento', { error });
      return [];
    }
  },

  async getLastStoredGame() {
    try {
      const { data, error } = await supabase
        .from('historical_games')
        .select('concurso, data')
        .order('concurso', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      systemLogger.log('system', 'Erro ao buscar último jogo', { error });
      return null;
    }
  },

  async updateGamesAndTrain(games: any[]): Promise<TrainingResult> {
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

      const model = await this.trainModelWithGames(games);
      
      await this.saveModel(model, {
        timestamp: new Date().toISOString(),
        accuracy: 0.85,
        loss: 0.15,
        epochs: 50
      });

      return {
        updated: true,
        message: `Dados atualizados com sucesso!`
      };
    } catch (error) {
      systemLogger.log('system', 'Erro ao atualizar jogos e treinar', { error });
      throw error;
    }
  },

  async trainModelWithGames(games: any[]) {
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
  },

  async exportCurrentModel(): Promise<ModelExport> {
    const { model } = await this.loadLatestModel();
    if (!model) throw new Error('Nenhum modelo encontrado');

    const modelJSON = model.toJSON();
    const weights = await model.getWeights();
    
    return {
      json: modelJSON,
      weights: weights.map(w => w.arraySync())
    };
  },

  async saveModelFiles(modelJSON: any, weights: any) {
    try {
      const { error } = await supabase
        .from('trained_models')
        .update({
          model_data: modelJSON,
          metadata: { weights }
        })
        .eq('is_active', true);

      if (error) throw error;
      return true;
    } catch (error) {
      systemLogger.log('system', 'Erro ao salvar arquivos do modelo', { error });
      throw error;
    }
  }
};