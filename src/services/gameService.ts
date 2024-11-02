import { systemLogger } from '../utils/logging/systemLogger';
import { lotofacilService } from './lotofacilService';

export const gameService = {
  async fetchLatestGames() {
    try {
      const results = await lotofacilService.getLastResults();
      return { data: results, error: null };
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
      const data = await lotofacilService.fetchLatestFromAPI();
      
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