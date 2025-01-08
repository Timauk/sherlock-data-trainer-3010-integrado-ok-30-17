import fs from 'fs';
import path from 'path';

export class FileManager {
  private checkpointPath: string;

  constructor(checkpointPath: string) {
    this.checkpointPath = checkpointPath;
  }

  async writeFile(filePath: string, data: any): Promise<void> {
    const fullPath = path.join(this.checkpointPath, filePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, JSON.stringify(data, null, 2));
  }

  async readFile(filePath: string): Promise<any> {
    const fullPath = path.join(this.checkpointPath, filePath);
    const data = await fs.promises.readFile(fullPath, 'utf-8');
    return JSON.parse(data);
  }
}
