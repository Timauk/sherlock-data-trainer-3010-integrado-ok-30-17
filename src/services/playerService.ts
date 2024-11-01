import { supabase } from '@/lib/supabase';
import { Json } from '@/lib/database.types';
import { systemLogger } from '@/utils/logging/systemLogger';

export const playerService = {
  async createPlayer(dna: Json, generation: number, parentId?: number) {
    const { data, error } = await supabase
      .from('players')
      .insert([{
        dna,
        score: 0,
        generation,
        parent_id: parentId
      }])
      .select()
      .single();

    if (error) {
      systemLogger.log('error', 'Erro ao criar jogador', { error });
      throw error;
    }

    return data;
  },

  async updatePlayerScore(playerId: number, score: number) {
    const { error } = await supabase
      .from('players')
      .update({ score })
      .eq('id', playerId);

    if (error) {
      systemLogger.log('error', 'Erro ao atualizar score', { error });
      throw error;
    }
  },

  async savePrediction(playerId: number, numbers: number[], confidence: number) {
    const { error } = await supabase
      .from('predictions')
      .insert([{
        player_id: playerId,
        numbers,
        confidence
      }]);

    if (error) {
      systemLogger.log('error', 'Erro ao salvar previsão', { error });
      throw error;
    }
  },

  async getPlayerMetrics(playerId: number) {
    const { data, error } = await supabase
      .rpc('calculate_player_metrics', { player_id: playerId });

    if (error) {
      systemLogger.log('error', 'Erro ao calcular métricas', { error });
      throw error;
    }

    return data;
  },

  async getPlayerLineage(playerId: number) {
    const { data, error } = await supabase
      .from('players')
      .select(`
        id,
        generation,
        parent_id,
        created_at,
        players!players_parent_id_fkey (
          id,
          generation,
          parent_id,
          created_at
        )
      `)
      .eq('id', playerId);

    if (error) {
      systemLogger.log('error', 'Erro ao buscar linhagem', { error });
      throw error;
    }

    return data;
  }
};