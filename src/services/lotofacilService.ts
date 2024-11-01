interface LotofacilResult {
  concurso: number;
  data: string;
  dezenas: string[];
}

const API_BASE_URL = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil';
const MOCK_DATA = {
  concurso: 2999,
  data: "10/01/2024",
  dezenas: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"]
};

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
        console.warn('API indisponível, usando dados mockados');
        return MOCK_DATA;
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Erro ao buscar dados da API, usando dados mockados:', error);
      return MOCK_DATA;
    }
  },

  async getLastResults(limit: number = 100): Promise<LotofacilResult[]> {
    try {
      const latestResult = await this.fetchLatestFromAPI();
      const results: LotofacilResult[] = [latestResult];
      
      // Se estiver usando dados mockados, retorna apenas o último resultado
      if (latestResult === MOCK_DATA) {
        return results;
      }

      // Buscar resultados anteriores com tratamento de erro individual
      for (let i = 1; i < Math.min(limit, 10); i++) {
        try {
          const concurso = latestResult.concurso - i;
          const response = await fetch(`${API_BASE_URL}/${concurso}`);
          
          if (response.ok) {
            const result = await response.json();
            results.push(result);
          }
          
          // Pequena pausa entre requisições
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.warn(`Falha ao buscar concurso, continuando...`, error);
          continue;
        }
      }

      return results;
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      return [MOCK_DATA];
    }
  }
};