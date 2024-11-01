import { supabase } from '@/lib/supabase';
import { systemLogger } from '@/utils/logging/systemLogger';

export const gameService = {
  async fetchLatestGames(limit = 100) {
    const { data, error } = await supabase
      .from('historical_games')
      .select('*')
      .order('concurso', { ascending: false })
      .limit(limit);

    if (error) {
      systemLogger.log('error', 'Erro ao buscar jogos', { error });
      throw error;
    }

    return data;
  },

  async saveGame(concurso: number, data: string, numeros: number[]) {
    const { error } = await supabase
      .from('historical_games')
      .insert([{ concurso, data, numeros }]);

    if (error) {
      systemLogger.log('error', 'Erro ao salvar jogo', { error });
      throw error;
    }
  },

  async syncWithOfficialAPI() {
    try {
      const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest');
      const data = await response.json();
      
      await this.saveGame(
        data.concurso,
        data.data,
        data.dezenas.map(Number)
      );

      return true;
    } catch (error) {
      systemLogger.log('error', 'Erro na sincronização com API oficial', { error });
      return false;
    }
  }
};