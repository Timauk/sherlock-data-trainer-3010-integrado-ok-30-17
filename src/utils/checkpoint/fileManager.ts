import fs from 'fs';
import path from 'path';
import { logger } from '../logging/logger.js';

export class FileManager {
  constructor(private basePath: string) {
    this.ensureDirectory(basePath);
  }

  private ensureDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  exists(relativePath: string): boolean {
    const fullPath = path.join(this.basePath, relativePath);
    return fs.existsSync(fullPath);
  }

  async writeFile(relativePath: string, data: any, isBinary = false) {
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

  async readFile(relativePath: string, isBinary = false) {
    const fullPath = path.join(this.basePath, relativePath);
    
    try {
      if (!fs.existsSync(fullPath)) return null;
      
      const data = await fs.promises.readFile(fullPath, isBinary ? null : 'utf8');
      return isBinary ? data : JSON.parse(data);
    } catch (error) {
      logger.error({ error, path: relativePath }, 'Error reading file');
      throw error;
    }
  }
}