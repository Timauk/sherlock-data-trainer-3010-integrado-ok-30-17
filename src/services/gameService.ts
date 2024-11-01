import { systemLogger } from '../utils/logging/systemLogger';

export const gameService = {
  async fetchLatestGames(limit = 100) {
    try {
      const response = await fetch(`https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest/${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      systemLogger.log('system', 'Error fetching games', { error });
      return { data: null, error };
    }
  },

  async saveGame(concurso: number, data: string, numeros: number[]) {
    try {
      const games = JSON.parse(localStorage.getItem('games') || '[]');
      games.push({ concurso, data, numeros });
      localStorage.setItem('games', JSON.stringify(games));
      return { error: null };
    } catch (error) {
      systemLogger.log('system', 'Error saving game', { error });
      return { error };
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
      systemLogger.log('system', 'Error syncing with official API', { error });
      return false;
    }
  }
};