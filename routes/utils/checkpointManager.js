import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CheckpointManager {
  static instance = null;
  
  constructor() {
    this.checkpointPath = path.join(process.cwd(), 'checkpoints');
    this.maxCheckpoints = 50;
    this.ensureCheckpointDirectory();
  }

  static getInstance() {
    if (!CheckpointManager.instance) {
      CheckpointManager.instance = new CheckpointManager();
    }
    return CheckpointManager.instance;
  }

  ensureCheckpointDirectory() {
    if (!fs.existsSync(this.checkpointPath)) {
      fs.mkdirSync(this.checkpointPath, { recursive: true });
    }
  }

  async saveCheckpoint(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `checkpoint-${timestamp}.json`;
    const filepath = path.join(this.checkpointPath, filename);

    await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2));
    await this.cleanOldCheckpoints();
    
    return filename;
  }

  async loadLatestCheckpoint() {
    const files = fs.readdirSync(this.checkpointPath)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) return null;

    const latestFile = files[0];
    const data = await fs.promises.readFile(
      path.join(this.checkpointPath, latestFile),
      'utf8'
    );
    return JSON.parse(data);
  }

  async cleanOldCheckpoints() {
    const files = fs.readdirSync(this.checkpointPath)
      .filter(f => f.endsWith('.json'))
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