import fs from 'fs';
import path from 'path';
import { logger } from '../logging/logger.js';

export class FileManager {
  constructor(private readonly basePath: string) {}

  async writeFile<T>(filePath: string, data: T): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    try {
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.promises.writeFile(
        fullPath, 
        typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      );
      logger.debug(`Arquivo salvo: ${fullPath}`);
    } catch (error) {
      logger.error({ error, path: fullPath }, 'Erro ao salvar arquivo');
      throw error;
    }
  }

  async readFile<T>(filePath: string): Promise<T> {
    const fullPath = path.join(this.basePath, filePath);
    try {
      const data = await fs.promises.readFile(fullPath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error({ error, path: fullPath }, 'Erro ao ler arquivo');
      throw error;
    }
  }
}