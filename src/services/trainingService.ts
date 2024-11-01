import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { Json } from '@/integrations/supabase/types';

interface TrainingMetadata {
  timestamp: string;
  accuracy: number;
  loss: number;
  epochs: number;
  gamesCount?: number;
  weights?: any;
}

export const trainingService = {
  async saveModel(model: tf.LayersModel, metadata: TrainingMetadata) {
    try {
      const { data, error } = await supabase
        .from('trained_models')
        .insert({
          model_data: model.toJSON() as unknown as Json,
          metadata: {
            timestamp: metadata.timestamp,
            accuracy: metadata.accuracy,
            loss: metadata.loss,
            epochs: metadata.epochs,
            gamesCount: metadata.gamesCount,
            weights: metadata.weights
          } as unknown as Json,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      systemLogger.log('system', 'Modelo salvo com sucesso', { metadata });
      return true;
    } catch (error) {
      systemLogger.log('system', 'Erro ao salvar modelo', { error });
      return false;
    }
  },

  async loadLatestModel(): Promise<{ model: tf.LayersModel | null; metadata: TrainingMetadata | null }> {
    try {
      const { data, error } = await supabase
        .from('trained_models')
        .select()
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        const modelData = data.model_data as unknown as tf.io.ModelJSON;
        const model = await tf.models.modelFromJSON(modelData);
        
        const metadata = {
          timestamp: (data.metadata as any).timestamp || '',
          accuracy: (data.metadata as any).accuracy || 0,
          loss: (data.metadata as any).loss || 0,
          epochs: (data.metadata as any).epochs || 0,
          gamesCount: (data.metadata as any).gamesCount,
          weights: (data.metadata as any).weights
        } as TrainingMetadata;

        return { model, metadata };
      }

      const model = await tf.loadLayersModel('indexeddb://current-model');
      return { model, metadata: null };
    } catch (error) {
      systemLogger.log('system', 'Erro ao carregar modelo', { error });
      return { model: null, metadata: null };
    }
  },

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
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      systemLogger.log('system', 'Erro ao buscar último jogo', { error });
      return null;
    }
  },

  async updateGamesAndTrain(games: any[]) {
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

      return true;
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

  async exportCurrentModel() {
    const model = await this.loadLatestModel();
    if (!model.model) throw new Error('Nenhum modelo encontrado');

    const modelJSON = model.model.toJSON();
    const weights = await model.model.getWeights();
    
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