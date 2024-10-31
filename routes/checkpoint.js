import express from 'express';
import { checkpointManager } from '../src/utils/storage/checkpointManager.js';

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
      gameState: {
        players: (req.body.players || []).slice(-1000),
        evolutionData: (req.body.evolutionData || []).slice(-1000),
        generation: req.body.generation || 0,
        modelState: req.body.modelState || null,
        trainingHistory: (req.body.trainingHistory || []).slice(-1000),
        frequencyAnalysis: req.body.frequencyAnalysis || {},
        lunarAnalysis: req.body.lunarAnalysis || {},
        predictions: (req.body.predictions || []).slice(-100),
        scores: (req.body.scores || []).slice(-1000),
        championData: req.body.championData || null,
        boardNumbers: (req.body.boardNumbers || []).slice(-100),
        concursoNumber: req.body.concursoNumber || 0,
        gameCount: req.body.gameCount || 0,
        isInfiniteMode: req.body.isInfiniteMode || false,
        isManualMode: req.body.isManualMode || false,
        logs: (req.body.logs || []).slice(-100)
      }
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