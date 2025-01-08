import path from 'path';
import { FileManager } from './fileManager.js';
import { logger } from '../logging/logger.js';
import { GameState } from '@/types/gameTypes';
import { CheckpointData } from '@/types/checkpointTypes';

export class StateManager {
  private readonly fileManager: FileManager;

  constructor(fileManager: FileManager) {
    this.fileManager = fileManager;
  }

  async saveGameState(checkpointDir: string, data: CheckpointData): Promise<void> {
    try {
      await this.fileManager.writeFile<GameState>(
        path.join(checkpointDir, 'gameState.json'),
        data.gameState
      );
      logger.debug('Estado do jogo salvo com sucesso');
    } catch (error) {
      logger.error({ error }, 'Erro ao salvar estado do jogo');
      throw error;
    }
  }

  async loadGameState(checkpointDir: string): Promise<GameState | null> {
    try {
      return await this.fileManager.readFile<GameState>(
        path.join(checkpointDir, 'gameState.json')
      );
    } catch (error) {
      logger.error({ error }, 'Erro ao carregar estado do jogo');
      throw error;
    }
  }
}