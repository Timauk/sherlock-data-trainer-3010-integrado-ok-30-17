interface LotofacilResult {
  concurso: number;
  data: string;
  dezenas: string[];
}

export const lotofacilService = {
  async fetchLatestFromAPI(): Promise<LotofacilResult> {
    try {
      const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados da API:', error);
      throw new Error('Falha ao buscar dados da API');
    }
  },

  async getLastResults(limit: number = 100): Promise<LotofacilResult[]> {
    try {
      // Buscar o último resultado primeiro
      const latestResult = await this.fetchLatestFromAPI();
      const latestConcurso = latestResult.concurso;
      
      // Criar array com os últimos 'limit' concursos
      const results: LotofacilResult[] = [];
      results.push(latestResult);
      
      // Buscar os resultados anteriores com retry logic
      const promises = Array.from({ length: Math.min(limit - 1, latestConcurso - 1) }, async (_, index) => {
        const concurso = latestConcurso - (index + 1);
        let retries = 3;
        
        while (retries > 0) {
          try {
            const response = await fetch(`https://loteriascaixa-api.herokuapp.com/api/lotofacil/${concurso}`, {
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            if (response.ok) {
              return response.json();
            }
            
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          } catch (error) {
            retries--;
            if (retries === 0) {
              console.error(`Falha ao buscar concurso ${concurso} após 3 tentativas`);
              return null;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        return null;
      });

      const additionalResults = await Promise.all(promises);
      results.push(...additionalResults.filter(Boolean));

      return results;
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      throw new Error('Falha ao buscar resultados da Lotofácil');
    }
  }
};