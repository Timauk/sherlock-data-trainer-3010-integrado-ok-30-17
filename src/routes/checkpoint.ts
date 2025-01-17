import express from 'express';
import { checkpointManager } from '../utils/checkpoint/checkpointManager.js';
import { logger } from '../utils/logging/logger.js';
import type { CheckpointData, SystemInfo } from '../types/checkpointTypes';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const systemInfo: SystemInfo = {
      totalMemory: process.memoryUsage().heapTotal,
      freeMemory: process.memoryUsage().heapUsed,
      uptime: process.uptime()
    };

    const { model, ...restData } = req.body;

    const checkpointData: CheckpointData = {
      timestamp: new Date().toISOString(),
      systemInfo,
      gameState: restData,
      csvData: req.body.csvData
    };

    // Removido o segundo argumento que estava causando o erro
    await checkpointManager.saveCheckpoint(model);

    logger.info('Checkpoint saved successfully');
    res.json({ 
      message: 'Checkpoint salvo com sucesso'
    });
  } catch (error) {
    logger.error({ error }, 'Error saving checkpoint');
    res.status(500).json({ 
      message: 'Erro ao salvar checkpoint', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/latest', async (_req, res) => {
  try {
    const checkpoint = await checkpointManager.loadCheckpoint();
    
    if (!checkpoint) {
      logger.warn('No checkpoint found');
      res.status(404).json({ message: 'Nenhum checkpoint encontrado' });
      return;
    }
    
    logger.info('Latest checkpoint loaded successfully');
    res.json(checkpoint);
  } catch (error) {
    logger.error({ error }, 'Error loading checkpoint');
    res.status(500).json({ 
      message: 'Erro ao carregar checkpoint', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as checkpointRouter };