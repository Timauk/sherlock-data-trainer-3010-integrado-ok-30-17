import express, { Request, Response, Router } from 'express';
import { checkpointManager } from '../utils/checkpoint/checkpointManager.js';
import { logger } from '../utils/logging/logger.js';

const router: Router = express.Router();

interface CheckpointData {
  timestamp: string;
  systemInfo: {
    totalMemory: number;
    freeMemory: number;
    uptime: number;
  };
  gameState: any; // You can make this more specific based on your game state type
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const checkpointData: CheckpointData = {
      timestamp: new Date().toISOString(),
      systemInfo: {
        totalMemory: process.memoryUsage().heapTotal,
        freeMemory: process.memoryUsage().heapUsed,
        uptime: process.uptime()
      },
      gameState: req.body
    };

    const filename = await checkpointManager.saveCheckpoint(checkpointData);

    logger.info({ filename }, 'Checkpoint saved successfully');
    res.json({ 
      message: 'Checkpoint salvo com sucesso', 
      filename 
    });
  } catch (error) {
    logger.error({ error }, 'Error saving checkpoint');
    res.status(500).json({ 
      message: 'Erro ao salvar checkpoint', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/latest', async (req: Request, res: Response): Promise<void> => {
  try {
    const checkpoint = await checkpointManager.loadLatestCheckpoint();
    
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