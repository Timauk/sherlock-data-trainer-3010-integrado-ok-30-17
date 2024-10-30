import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const checkpointCache = new Map();
const MAX_CACHE_SIZE = 10;

function cleanOldCheckpoints(checkpointsDir) {
  const files = fs.readdirSync(checkpointsDir)
    .filter(f => f.startsWith('checkpoint-'))
    .sort()
    .reverse();

  if (files.length > 50) {
    files.slice(50).forEach(file => {
      fs.unlinkSync(path.join(checkpointsDir, file));
    });
  }
}

router.post('/', (req, res) => {
  const checkpointsDir = req.body.path || path.join(__dirname, '..', 'checkpoints');
  
  if (!fs.existsSync(checkpointsDir)) {
    try {
      fs.mkdirSync(checkpointsDir, { recursive: true });
    } catch (error) {
      return res.status(500).json({
        message: 'Erro ao criar diretório',
        error: error.message
      });
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `checkpoint-${timestamp}.json`;
  const filepath = path.join(checkpointsDir, filename);

  const checkpointData = {
    timestamp,
    saveTime: timestamp,
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
    },
    checkpointType: req.body.checkpointType || 'auto',
    checkpointNumber: fs.readdirSync(checkpointsDir).length + 1
  };

  checkpointCache.set(filename, checkpointData);
  if (checkpointCache.size > MAX_CACHE_SIZE) {
    const oldestKey = Array.from(checkpointCache.keys())[0];
    checkpointCache.delete(oldestKey);
  }

  fs.writeFileSync(filepath, JSON.stringify(checkpointData, null, 2));
  cleanOldCheckpoints(checkpointsDir);

  res.json({ 
    message: 'Checkpoint salvo com sucesso', 
    filename,
    savedData: Object.keys(checkpointData.gameState)
  });
});

router.get('/latest', (req, res) => {
  try {
    const checkpointsDir = path.join(__dirname, '..', 'checkpoints');
    const files = fs.readdirSync(checkpointsDir)
      .filter(f => f.startsWith('checkpoint-'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      return res.status(404).json({ message: 'Nenhum checkpoint encontrado' });
    }

    const latestFile = files[0];
    
    if (checkpointCache.has(latestFile)) {
      return res.json(checkpointCache.get(latestFile));
    }

    const data = fs.readFileSync(path.join(checkpointsDir, latestFile));
    const checkpoint = JSON.parse(data);
    
    checkpointCache.set(latestFile, checkpoint);
    
    res.json(checkpoint);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao carregar checkpoint', 
      error: error.message 
    });
  }
});

export { router as checkpointRouter };