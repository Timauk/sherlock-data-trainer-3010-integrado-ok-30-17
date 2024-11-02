import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as tf from '@tensorflow/tfjs';
import { logger } from '../../src/utils/logging/logger.js';

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
      logger.info(`Diretório de checkpoints criado: ${this.checkpointPath}`);
    }
  }

  async saveCheckpoint(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const checkpointDir = path.join(this.checkpointPath, `checkpoint-${timestamp}`);
    fs.mkdirSync(checkpointDir);

    logger.info({
      checkpoint: checkpointDir,
      timestamp
    }, 'Iniciando salvamento de checkpoint completo');

    try {
      // 1. Salvar CSV original
      if (data.csvData) {
        await fs.promises.writeFile(
          path.join(checkpointDir, 'dataset.csv'),
          data.csvData
        );
        logger.debug('Dataset CSV salvo');
      }

      // 2. Salvar estado do jogo completo
      const gameState = {
        ...data.gameState,
        logs: data.gameState.logs || [],
        systemLogs: data.gameState.systemLogs || [],
        players: data.gameState.players || [],
        generation: data.gameState.generation || 0,
        concursoNumber: data.gameState.concursoNumber || 0,
        boardNumbers: data.gameState.boardNumbers || [],
        trainingData: data.gameState.trainingData || [],
        evolutionData: data.gameState.evolutionData || [],
        frequencyAnalysis: data.gameState.frequencyAnalysis || {},
        championData: data.gameState.championData || null
      };

      await fs.promises.writeFile(
        path.join(checkpointDir, 'gameState.json'),
        JSON.stringify(gameState, null, 2)
      );
      logger.debug('Estado do jogo salvo');

      // 3. Salvar modelo neural completo
      if (data.gameState.model) {
        const modelPath = path.join(checkpointDir, 'model');
        await data.gameState.model.save(`file://${modelPath}`);
        logger.debug('Modelo neural salvo');
      }

      // 4. Salvar pesos dos jogadores
      const playersWeights = path.join(checkpointDir, 'players-weights.bin');
      const weightsBuffer = Buffer.from(
        data.gameState.players.map(p => p.weights).flat()
      );
      await fs.promises.writeFile(playersWeights, weightsBuffer);
      logger.debug('Pesos dos jogadores salvos');

      // 5. Salvar configurações do modelo
      if (data.gameState.modelConfig) {
        await fs.promises.writeFile(
          path.join(checkpointDir, 'model-config.json'),
          JSON.stringify(data.gameState.modelConfig, null, 2)
        );
        logger.debug('Configurações do modelo salvas');
      }

      // 6. Salvar métricas e histórico
      await fs.promises.writeFile(
        path.join(checkpointDir, 'metrics.json'),
        JSON.stringify({
          accuracy: data.gameState.metrics?.accuracy || 0,
          loss: data.gameState.metrics?.loss || 0,
          predictions: data.gameState.metrics?.predictions || [],
          evolutionStats: data.gameState.metrics?.evolutionStats || [],
          trainingProgress: data.gameState.metrics?.trainingProgress || 0
        }, null, 2)
      );
      logger.debug('Métricas salvas');

      // 7. Salvar índices e mapeamentos
      await fs.promises.writeFile(
        path.join(checkpointDir, 'indexes.json'),
        JSON.stringify({
          playerIndex: data.gameState.playerIndex || {},
          generationMap: data.gameState.generationMap || {},
          trainingIndex: data.gameState.trainingIndex || []
        }, null, 2)
      );
      logger.debug('Índices salvos');

      // 8. Criar arquivo manifest.json com metadados do checkpoint
      await fs.promises.writeFile(
        path.join(checkpointDir, 'manifest.json'),
        JSON.stringify({
          version: '1.0',
          timestamp,
          files: [
            'dataset.csv',
            'gameState.json',
            'model.json',
            'model.weights.bin',
            'players-weights.bin',
            'model-config.json',
            'metrics.json',
            'indexes.json'
          ],
          modelInfo: {
            architecture: data.gameState.modelConfig?.architecture,
            optimizer: data.gameState.modelConfig?.optimizer,
            loss: data.gameState.modelConfig?.loss
          }
        }, null, 2)
      );
      logger.debug('Manifest do checkpoint criado');

      await this.cleanOldCheckpoints();
      logger.info(`Checkpoint completo salvo com sucesso: ${path.basename(checkpointDir)}`);
      return path.basename(checkpointDir);

    } catch (error) {
      logger.error({
        error,
        checkpoint: checkpointDir
      }, 'Erro ao salvar checkpoint');
      throw error;
    }
  }

  async loadLatestCheckpoint() {
    const checkpoints = fs.readdirSync(this.checkpointPath)
      .filter(f => f.startsWith('checkpoint-'))
      .sort()
      .reverse();

    if (checkpoints.length === 0) {
      logger.warn('Nenhum checkpoint encontrado para carregar');
      return null;
    }

    const latestCheckpoint = checkpoints[0];
    const checkpointDir = path.join(this.checkpointPath, latestCheckpoint);
    logger.info(`Carregando último checkpoint: ${latestCheckpoint}`);

    try {
      // 1. Verificar manifest
      const manifest = JSON.parse(
        await fs.promises.readFile(path.join(checkpointDir, 'manifest.json'), 'utf8')
      );

      // 2. Carregar CSV
      const csvPath = path.join(checkpointDir, 'dataset.csv');
      const csvData = fs.existsSync(csvPath) ? 
        await fs.promises.readFile(csvPath, 'utf8') : null;

      // 3. Carregar estado do jogo
      const gameState = JSON.parse(
        await fs.promises.readFile(path.join(checkpointDir, 'gameState.json'), 'utf8')
      );

      // 4. Carregar modelo neural
      const modelPath = path.join(checkpointDir, 'model');
      if (fs.existsSync(`${modelPath}.json`)) {
        gameState.model = await tf.loadLayersModel(`file://${modelPath}`);
        logger.debug('Modelo neural carregado');
      }

      // 5. Carregar pesos dos jogadores
      const weightsPath = path.join(checkpointDir, 'players-weights.bin');
      if (fs.existsSync(weightsPath)) {
        const weightsBuffer = await fs.promises.readFile(weightsPath);
        const weights = new Float32Array(weightsBuffer.buffer);
        gameState.players = gameState.players.map((player, idx) => ({
          ...player,
          weights: Array.from(weights.slice(idx * player.weights.length, (idx + 1) * player.weights.length))
        }));
        logger.debug('Pesos dos jogadores carregados');
      }

      // 6. Carregar configurações do modelo
      const configPath = path.join(checkpointDir, 'model-config.json');
      if (fs.existsSync(configPath)) {
        gameState.modelConfig = JSON.parse(
          await fs.promises.readFile(configPath, 'utf8')
        );
      }

      // 7. Carregar métricas
      const metricsPath = path.join(checkpointDir, 'metrics.json');
      if (fs.existsSync(metricsPath)) {
        gameState.metrics = JSON.parse(
          await fs.promises.readFile(metricsPath, 'utf8')
        );
      }

      // 8. Carregar índices
      const indexesPath = path.join(checkpointDir, 'indexes.json');
      if (fs.existsSync(indexesPath)) {
        const indexes = JSON.parse(
          await fs.promises.readFile(indexesPath, 'utf8')
        );
        Object.assign(gameState, indexes);
      }

      logger.info('Checkpoint carregado com sucesso');
      return {
        timestamp: latestCheckpoint.replace('checkpoint-', ''),
        gameState,
        csvData
      };

    } catch (error) {
      logger.error({
        error,
        checkpoint: checkpointDir
      }, 'Erro ao carregar checkpoint');
      throw error;
    }
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
        logger.info(`Checkpoint antigo removido: ${checkpoint}`);
      }
    }
  }
}

export const checkpointManager = CheckpointManager.getInstance();