import fs from 'fs';
import path from 'path';
import { logger } from '../logging/logger.js';

export class FileManager {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.ensureDirectory(basePath);
  }

  ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async writeFile(relativePath: string, data: any, isBinary = false): Promise<void> {
    const fullPath = path.join(this.basePath, relativePath);
    this.ensureDirectory(path.dirname(fullPath));
    
    try {
      if (isBinary) {
        await fs.promises.writeFile(fullPath, data);
      } else {
        await fs.promises.writeFile(fullPath, JSON.stringify(data, null, 2));
      }
      logger.debug(`File written successfully: ${relativePath}`);
    } catch (error) {
      logger.error({ error, path: relativePath }, 'Error writing file');
      throw error;
    }
  }

  async readFile<T>(relativePath: string, isBinary = false): Promise<T | null> {
    const fullPath = path.join(this.basePath, relativePath);
    
    try {
      if (!fs.existsSync(fullPath)) return null;
      
      const data = await fs.promises.readFile(fullPath, isBinary ? undefined : 'utf8');
      return isBinary ? (data as unknown as T) : JSON.parse(data as string) as T;
    } catch (error) {
      logger.error({ error, path: relativePath }, 'Error reading file');
      throw error;
    }
  }
}