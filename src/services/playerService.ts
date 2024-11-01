import { systemLogger } from '@/utils/logging/systemLogger';

export const playerService = {
  async createPlayer(dna: any, generation: number, parentId?: number) {
    try {
      const players = JSON.parse(localStorage.getItem('players') || '[]');
      const newPlayer = {
        id: Date.now(),
        dna,
        score: 0,
        generation,
        parent_id: parentId,
        created_at: new Date().toISOString()
      };
      players.push(newPlayer);
      localStorage.setItem('players', JSON.stringify(players));
      return { data: newPlayer, error: null };
    } catch (error) {
      systemLogger.log('system', 'Error creating player', { error });
      return { data: null, error };
    }
  },

  async updatePlayerScore(playerId: number, score: number) {
    try {
      const players = JSON.parse(localStorage.getItem('players') || '[]');
      const updatedPlayers = players.map((p: any) => 
        p.id === playerId ? { ...p, score } : p
      );
      localStorage.setItem('players', JSON.stringify(updatedPlayers));
      return { error: null };
    } catch (error) {
      systemLogger.log('system', 'Error updating score', { error });
      return { error };
    }
  },

  async savePrediction(playerId: number, numbers: number[], confidence: number) {
    try {
      const predictions = JSON.parse(localStorage.getItem('predictions') || '[]');
      predictions.push({ playerId, numbers, confidence, timestamp: Date.now() });
      localStorage.setItem('predictions', JSON.stringify(predictions));
      return { error: null };
    } catch (error) {
      systemLogger.log('system', 'Error saving prediction', { error });
      return { error };
    }
  },

  async getPlayerMetrics(playerId: number) {
    try {
      const predictions = JSON.parse(localStorage.getItem('predictions') || '[]');
      const playerPredictions = predictions.filter((p: any) => p.playerId === playerId);
      return {
        data: {
          totalPredictions: playerPredictions.length,
          averageConfidence: playerPredictions.reduce((acc: number, curr: any) => 
            acc + curr.confidence, 0) / playerPredictions.length || 0
        },
        error: null
      };
    } catch (error) {
      systemLogger.log('system', 'Error calculating metrics', { error });
      return { data: null, error };
    }
  },

  async getPlayerLineage(playerId: number) {
    try {
      const players = JSON.parse(localStorage.getItem('players') || '[]');
      const lineage = [];
      let currentId = playerId;
      
      while (currentId) {
        const player = players.find((p: any) => p.id === currentId);
        if (!player) break;
        lineage.push(player);
        currentId = player.parent_id;
      }
      
      return { data: lineage, error: null };
    } catch (error) {
      systemLogger.log('system', 'Error fetching lineage', { error });
      return { data: null, error };
    }
  }
};