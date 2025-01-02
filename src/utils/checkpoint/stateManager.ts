import path from 'path';
import { logger } from '../logging/logger.js';

export class StateManager {
  constructor(fileManager) {
    this.fileManager = fileManager;
  }

  async saveGameState(checkpointDir, data) {
    try {
      await this.fileManager.writeFile(
        path.join(checkpointDir, 'gameState.json'),
        data.gameState || {}
      );
      logger.debug('Game state saved successfully');
    } catch (error) {
      logger.error({ error }, 'Error saving game state');
      throw error;
    }
  }

  async loadGameState(checkpointDir) {
    try {
      return await this.fileManager.readFile(
        path.join(checkpointDir, 'gameState.json')
      );
    } catch (error) {
      logger.error({ error }, 'Error loading game state');
      throw error;
    }
  }
}