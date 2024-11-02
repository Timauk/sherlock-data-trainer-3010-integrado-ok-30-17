import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';

export const trainingService = {
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

  async updateGames(games: any[]) {
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
      return true;
    } catch (error) {
      systemLogger.log('system', 'Erro ao atualizar jogos', { error });
      throw error;
    }
  }
};