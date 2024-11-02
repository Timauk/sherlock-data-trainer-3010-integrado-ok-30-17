import * as fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logging/logger.js';

export class FileManager {
  constructor(private basePath: string) {
    this.ensureDirectory(basePath);
  }

  private ensureDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async writeFile(relativePath: string, data: any, isBinary = false) {
    const fullPath = path.join(this.basePath, relativePath);
    this.ensureDirectory(path.dirname(fullPath));
    
    if (isBinary) {
      await fs.promises.writeFile(fullPath, data);
    } else {
      await fs.promises.writeFile(fullPath, JSON.stringify(data, null, 2));
    }
    logger.debug(`Arquivo salvo: ${relativePath}`);
  }

  async readFile(relativePath: string, isBinary = false) {
    const fullPath = path.join(this.basePath, relativePath);
    if (!fs.existsSync(fullPath)) return null;
    
    if (isBinary) {
      return await fs.promises.readFile(fullPath);
    }
    return JSON.parse(await fs.promises.readFile(fullPath, 'utf8'));
  }
}