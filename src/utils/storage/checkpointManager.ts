import fs from 'fs';
import path from 'path';
import { compressHistoricalData } from '../performance/dataCompression';
import { optimizedCheckpointWrite, optimizedCheckpointRead } from '../performance/checkpointOptimization';

export class CheckpointManager {
  private static instance: CheckpointManager;
  private checkpointPath: string;
  private maxCheckpoints: number = 50;

  private constructor() {
    this.checkpointPath = path.join(process.cwd(), 'checkpoints');
    this.ensureCheckpointDirectory();
  }

  static getInstance(): CheckpointManager {
    if (!CheckpointManager.instance) {
      CheckpointManager.instance = new CheckpointManager();
    }
    return CheckpointManager.instance;
  }

  private ensureCheckpointDirectory(): void {
    if (!fs.existsSync(this.checkpointPath)) {
      fs.mkdirSync(this.checkpointPath, { recursive: true });
    }
  }

  async saveCheckpoint(data: any): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `checkpoint-${timestamp}.dat`;
    const filepath = path.join(this.checkpointPath, filename);

    await optimizedCheckpointWrite(filepath, data);
    await this.cleanOldCheckpoints();
    
    return filename;
  }

  async loadLatestCheckpoint(): Promise<any> {
    const files = fs.readdirSync(this.checkpointPath)
      .filter(f => f.endsWith('.dat'))
      .sort()
      .reverse();

    if (files.length === 0) return null;

    const latestFile = files[0];
    const data = await optimizedCheckpointRead(
      path.join(this.checkpointPath, latestFile)
    );
    return data;
  }

  private async cleanOldCheckpoints(): Promise<void> {
    const files = fs.readdirSync(this.checkpointPath)
      .filter(f => f.endsWith('.dat'))
      .sort();

    if (files.length > this.maxCheckpoints) {
      const filesToDelete = files.slice(0, files.length - this.maxCheckpoints);
      for (const file of filesToDelete) {
        fs.unlinkSync(path.join(this.checkpointPath, file));
      }
    }
  }
}

export const checkpointManager = CheckpointManager.getInstance();