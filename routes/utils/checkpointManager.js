import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as tf from '@tensorflow/tfjs';

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
    const checkpointDir = path.join(this.checkpointPath, `checkpoint-${timestamp}`);
    fs.mkdirSync(checkpointDir);

    // Save game state JSON with logs
    const gameStatePath = path.join(checkpointDir, 'gameState.json');
    const gameState = {
      ...data.gameState,
      logs: data.gameState.logs || [],
      systemLogs: data.gameState.systemLogs || []
    };

    await fs.promises.writeFile(gameStatePath, JSON.stringify(gameState, null, 2));

    // Save separate logs file for better organization
    const logsPath = path.join(checkpointDir, 'logs.json');
    await fs.promises.writeFile(logsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      logs: data.gameState.logs || [],
      systemLogs: data.gameState.systemLogs || []
    }, null, 2));

    // Save neural network model if exists
    if (data.gameState.model) {
      const modelPath = path.join(checkpointDir, 'model.json');
      const modelData = await data.gameState.model.save('file://' + modelPath);
      await fs.promises.writeFile(
        path.join(checkpointDir, 'model-topology.json'),
        JSON.stringify(modelData.modelTopology)
      );
      if (modelData.weightData) {
        await fs.promises.writeFile(
          path.join(checkpointDir, 'model-weights.bin'),
          Buffer.from(modelData.weightData)
        );
      }
    }

    // Save training metrics and charts data
    const metricsPath = path.join(checkpointDir, 'metrics.json');
    await fs.promises.writeFile(metricsPath, JSON.stringify({
      accuracy: data.gameState.metrics?.accuracy || 0,
      loss: data.gameState.metrics?.loss || 0,
      predictions: data.gameState.metrics?.predictions || [],
      evolutionStats: data.gameState.metrics?.evolutionStats || [],
      trainingProgress: data.gameState.metrics?.trainingProgress || 0
    }, null, 2));

    await this.cleanOldCheckpoints();
    return path.basename(checkpointDir);
  }

  async loadLatestCheckpoint() {
    const checkpoints = fs.readdirSync(this.checkpointPath)
      .filter(f => f.startsWith('checkpoint-'))
      .sort()
      .reverse();

    if (checkpoints.length === 0) return null;

    const latestCheckpoint = checkpoints[0];
    const checkpointDir = path.join(this.checkpointPath, latestCheckpoint);

    // Load game state
    const gameStatePath = path.join(checkpointDir, 'gameState.json');
    const gameState = JSON.parse(await fs.promises.readFile(gameStatePath, 'utf8'));

    // Load model if exists
    const modelPath = path.join(checkpointDir, 'model.json');
    if (fs.existsSync(modelPath)) {
      try {
        const modelTopology = JSON.parse(
          await fs.promises.readFile(path.join(checkpointDir, 'model-topology.json'), 'utf8')
        );
        const weightsData = await fs.promises.readFile(path.join(checkpointDir, 'model-weights.bin'));
        
        gameState.model = await tf.loadLayersModel(tf.io.fromMemory(modelTopology, weightsData));
      } catch (error) {
        console.error('Error loading model:', error);
      }
    }

    // Load logs if they exist
    const logsPath = path.join(checkpointDir, 'logs.json');
    if (fs.existsSync(logsPath)) {
      const logs = JSON.parse(await fs.promises.readFile(logsPath, 'utf8'));
      gameState.logs = logs.logs;
      gameState.systemLogs = logs.systemLogs;
    }

    return {
      timestamp: latestCheckpoint.replace('checkpoint-', ''),
      gameState
    };
  }

  async cleanOldCheckpoints() {
    const checkpoints = fs.readdirSync(this.checkpointPath)
      .filter(f => f.startsWith('checkpoint-'))
      .sort();

    if (checkpoints.length > this.maxCheckpoints) {
      const checkpointsToDelete = checkpoints.slice(0, checkpoints.length - this.maxCheckpoints);
      for (const checkpoint of checkpointsToDelete) {
        const checkpointPath = path.join(this.checkpointPath, checkpoint);
        await fs.promises.rm(checkpointPath, { recursive: true });
      }
    }
  }
}

export const checkpointManager = CheckpointManager.getInstance();
