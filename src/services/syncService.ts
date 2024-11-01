import { supabase } from '@/lib/supabase';
import { systemLogger } from '@/utils/logging/systemLogger';
import NodeCache from 'node-cache';

const resultsCache = new NodeCache({ stdTTL: 3600 }); // Cache por 1 hora

interface LotofacilResult {
  concurso: number;
  data: string;
  dezenas: string[];
}

export const syncService = {
  async syncWithOfficialAPI() {
    try {
      const cachedResult = resultsCache.get<LotofacilResult>('latest_result');
      if (cachedResult) {
        return cachedResult;
      }

      const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar dados da API oficial');
      }

      const data: LotofacilResult = await response.json();
      
      if (!this.validateResult(data)) {
        throw new Error('Dados inválidos recebidos da API');
      }

      const { error } = await supabase
        .from('historical_games')
        .upsert({
          concurso: data.concurso,
          data: data.data,
          numeros: data.dezenas.map(Number)
        });

      if (error) {
        throw error;
      }

      resultsCache.set('latest_result', data);
      await this.notifyWebhooks(data);

      systemLogger.log('system', 'Sincronização com API oficial concluída', {
        concurso: data.concurso
      });

      return data;
    } catch (error) {
      systemLogger.log('system', 'Erro na sincronização', { error });
      throw error;
    }
  },

  validateResult(data: LotofacilResult): boolean {
    return (
      typeof data.concurso === 'number' &&
      data.concurso > 0 &&
      Array.isArray(data.dezenas) &&
      data.dezenas.length === 15 &&
      data.dezenas.every(n => !isNaN(Number(n)) && Number(n) >= 1 && Number(n) <= 25)
    );
  },

  async notifyWebhooks(data: LotofacilResult) {
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('url')
      .eq('active', true);

    if (error || !webhooks) return;

    const notifications = webhooks.map(webhook =>
      fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(error => 
        systemLogger.log('system', 'Erro ao notificar webhook', { error, url: webhook.url })
      )
    );

    await Promise.allSettled(notifications);
  }
};