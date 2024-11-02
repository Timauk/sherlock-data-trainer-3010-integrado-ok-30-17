const API_URL = 'https://loteriascaixa-api.herokuapp.com/api';

export const lotofacilService = {
  async fetchLatestFromAPI() {
    const response = await fetch(`${API_URL}/lotofacil/latest`);
    if (!response.ok) {
      throw new Error('Falha ao buscar dados da API');
    }
    return response.json();
  },

  async getLastResults() {
    const response = await fetch(`${API_URL}/lotofacil/latest`);
    if (!response.ok) {
      throw new Error('Falha ao buscar dados da API');
    }
    const data = await response.json();
    return [data]; // For now, just return the latest result
  },

  getStoredGames() {
    return JSON.parse(localStorage.getItem('historical_games') || '[]');
  }
};