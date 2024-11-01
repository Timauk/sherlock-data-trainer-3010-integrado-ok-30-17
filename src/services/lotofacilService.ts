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

  async getLastResults(limit: number = 100): Promise<LotofacilResult[]> {
    try {
      // Buscar o último resultado primeiro
      const latestResult = await this.fetchLatestFromAPI();
      const latestConcurso = latestResult.concurso;
      
      // Criar array com os últimos 'limit' concursos
      const results: LotofacilResult[] = [];
      results.push(latestResult);
      
      // Buscar os resultados anteriores
      const promises = Array.from({ length: Math.min(limit - 1, latestConcurso - 1) }, async (_, index) => {
        const concurso = latestConcurso - (index + 1);
        const response = await fetch(`https://loteriascaixa-api.herokuapp.com/api/lotofacil/${concurso}`);
        if (response.ok) {
          return response.json();
        }
        return null;
      });

      const additionalResults = await Promise.all(promises);
      results.push(...additionalResults.filter(Boolean));

      return results;
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      return [];
    }
  }
};