interface LotofacilResult {
  concurso: number;
  data: string;
  dezenas: string[];
}

const API_BASE_URL = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil';

export const lotofacilService = {
  async fetchLatestFromAPI(): Promise<LotofacilResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/latest`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao buscar dados da API');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados da API:', error);
      throw error;
    }
  },

  async getConcurso(concurso: number): Promise<LotofacilResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/${concurso}`);
      if (!response.ok) {
        throw new Error(`Falha ao buscar concurso ${concurso}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Erro ao buscar concurso ${concurso}:`, error);
      throw error;
    }
  },

  async getLastResults(): Promise<LotofacilResult[]> {
    try {
      const latestResult = await this.fetchLatestFromAPI();
      const results: LotofacilResult[] = [latestResult];
      
      // Buscar todos os resultados anteriores
      for (let i = 1; i < latestResult.concurso; i++) {
        try {
          const concurso = latestResult.concurso - i;
          if (concurso <= 0) break;
          
          const response = await fetch(`${API_BASE_URL}/${concurso}`);
          
          if (response.ok) {
            const result = await response.json();
            results.push(result);
          }
          
          // Pequena pausa entre requisições para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.warn(`Falha ao buscar concurso, continuando...`, error);
          continue;
        }
      }

      return results.sort((a, b) => b.concurso - a.concurso);
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      throw error;
    }
  }
};