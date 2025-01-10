import { FileManager } from './fileManager';
import { logger } from '../logging/logger';
import path from 'path';

export class StateManager {
  constructor(private fileManager: FileManager) {}

  async saveGameState(checkpointDir: string, data: any): Promise<void> {
    try {
      await this.fileManager.writeFile(
        path.join(checkpointDir, 'gameState.json'),
        data.gameState
      );
      logger.info('Estado do jogo salvo com sucesso');
    } catch (error) {
      logger.error({ error }, 'Erro ao salvar estado do jogo');
      throw error;
    }
  }

  async loadGameState(checkpointDir: string): Promise<any> {
    try {
      return await this.fileManager.readFile(
        path.join(checkpointDir, 'gameState.json')
      );
    } catch (error) {
      logger.error({ error }, 'Erro ao carregar estado do jogo');
      throw error;
    }
  }
}