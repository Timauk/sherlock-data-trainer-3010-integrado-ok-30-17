import express, { Request, Response, Router } from 'express';
import { checkpointManager } from '../utils/checkpoint/checkpointManager.js';
import { logger } from '../utils/logging/logger.js';
import { LayersModel } from '@tensorflow/tfjs';
import { CheckpointData, SystemInfo } from '../types/checkpointTypes';

const router: Router = express.Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const systemInfo: SystemInfo = {
      totalMemory: process.memoryUsage().heapTotal,
      freeMemory: process.memoryUsage().heapUsed,
      uptime: process.uptime()
    };

    // Aqui separamos o modelo do resto dos dados
    const { model, ...restData } = req.body;

    const checkpointData: CheckpointData = {
      timestamp: new Date().toISOString(),
      systemInfo,
      gameState: restData,
      csvData: req.body.csvData
    };

    // Agora passamos o modelo separadamente
    const filename = await checkpointManager.saveCheckpoint(model as LayersModel, checkpointData);

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