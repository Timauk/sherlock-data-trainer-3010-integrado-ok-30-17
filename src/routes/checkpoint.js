import express from 'express';
import { checkpointManager } from '../utils/checkpoint/checkpointManager.js';
import { logger } from '../utils/logging/logger.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const filename = await checkpointManager.saveCheckpoint({
      timestamp: new Date().toISOString(),
      systemInfo: {
        totalMemory: process.memoryUsage().heapTotal,
        freeMemory: process.memoryUsage().heapUsed,
        uptime: process.uptime()
      },
      gameState: req.body
    });

    logger.info({ filename }, 'Checkpoint saved successfully');
    res.json({ 
      message: 'Checkpoint salvo com sucesso', 
      filename 
    });
  } catch (error) {
    logger.error({ error }, 'Error saving checkpoint');
    res.status(500).json({ 
      message: 'Erro ao salvar checkpoint', 
      error: error.message 
    });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const checkpoint = await checkpointManager.loadLatestCheckpoint();
    
    if (!checkpoint) {
      logger.warn('No checkpoint found');
      return res.status(404).json({ message: 'Nenhum checkpoint encontrado' });
    }
    
    logger.info('Latest checkpoint loaded successfully');
    res.json(checkpoint);
  } catch (error) {
    logger.error({ error }, 'Error loading checkpoint');
    res.status(500).json({ 
      message: 'Erro ao carregar checkpoint', 
      error: error.message 
    });
  }
});

export { router as checkpointRouter };