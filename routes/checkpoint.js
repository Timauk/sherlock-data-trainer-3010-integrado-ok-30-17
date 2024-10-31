import express from 'express';
import { checkpointManager } from './utils/checkpointManager.js';

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

    res.json({ 
      message: 'Checkpoint salvo com sucesso', 
      filename 
    });
  } catch (error) {
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
      return res.status(404).json({ message: 'Nenhum checkpoint encontrado' });
    }
    
    res.json(checkpoint);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao carregar checkpoint', 
      error: error.message 
    });
  }
});

export { router as checkpointRouter };