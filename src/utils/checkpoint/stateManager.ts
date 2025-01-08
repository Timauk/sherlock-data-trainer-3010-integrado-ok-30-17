import path from 'path';
import { FileManager } from './fileManager';
import { logger } from '../logging/logger.js';

export class StateManager {
  private readonly fileManager: FileManager;

  constructor(fileManager: FileManager) {
    this.fileManager = fileManager;
  }

  async saveGameState(checkpointDir: string, data: any): Promise<void> {
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

  async loadGameState(checkpointDir: string): Promise<any> {
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
