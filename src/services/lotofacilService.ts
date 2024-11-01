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
      const response = await fetch(`https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest/${limit}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar resultados anteriores');
      }
      return response.json();
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      return [];
    }
  }
};