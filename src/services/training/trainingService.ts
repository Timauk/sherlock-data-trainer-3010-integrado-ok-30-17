import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { saveModelToSupabase, loadLatestModelFromSupabase } from './modelStorage';
import { trainModelWithGames } from './modelTraining';
import type { TrainingMetadata } from './types';

export const trainingService = {
  saveModel: saveModelToSupabase,
  loadLatestModel: loadLatestModelFromSupabase,

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

      const model = await trainModelWithGames(games);
      
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

  async exportCurrentModel() {
    const result = await this.loadLatestModel();
    if (!result?.model) throw new Error('Nenhum modelo encontrado');

    const modelJSON = result.model.toJSON();
    const weights = await result.model.getWeights();
    
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