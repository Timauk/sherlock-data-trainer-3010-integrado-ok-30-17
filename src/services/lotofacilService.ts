import { supabase } from '@/lib/supabase';
import { systemLogger } from '@/utils/logging/systemLogger';

interface LotofacilResult {
  concurso: number;
  data: string;
  dezenas: string[];
}

export const lotofacilService = {
  async fetchLatestFromAPI(): Promise<LotofacilResult> {
    const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest');
    if (!response.ok) {
      throw new Error('Falha ao buscar dados da API');
    }
    return response.json();
  },

  async getLastStoredConcurso(): Promise<number> {
    const { data, error } = await supabase
      .from('historical_games')
      .select('concurso')
      .order('concurso', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data?.concurso || 0;
  },

  async updateDatabase(result: LotofacilResult) {
    const { error } = await supabase
      .from('historical_games')
      .insert({
        concurso: result.concurso,
        data: result.data,
        numeros: result.dezenas.map(Number)
      });

    if (error) throw error;
    return result.concurso;
  },

  async syncHistoricalData() {
    try {
      const lastConcurso = await this.getLastStoredConcurso();
      const latestResult = await this.fetchLatestFromAPI();

      if (latestResult.concurso > lastConcurso) {
        await this.updateDatabase(latestResult);
        systemLogger.log('system', 'Dados atualizados com sucesso', {
          lastConcurso: latestResult.concurso
        });
        return latestResult;
      }

      return null;
    } catch (error) {
      systemLogger.log('system', 'Erro na sincronização', { error });
      throw error;
    }
  }
};