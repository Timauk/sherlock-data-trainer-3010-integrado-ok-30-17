import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' })); // Aumentado para comportar mais dados

const checkpointsDir = path.join(__dirname, 'checkpoints');
if (!fs.existsSync(checkpointsDir)) {
  fs.mkdirSync(checkpointsDir);
}

app.post('/api/checkpoint', (req, res) => {
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
      players: req.body.players || [],
      evolutionData: req.body.evolutionData || [],
      generation: req.body.generation || 0,
      modelState: req.body.modelState || null,
      trainingHistory: req.body.trainingHistory || [],
      frequencyAnalysis: req.body.frequencyAnalysis || {},
      lunarAnalysis: req.body.lunarAnalysis || {},
      predictions: req.body.predictions || [],
      scores: req.body.scores || [],
      championData: req.body.championData || null,
      boardNumbers: req.body.boardNumbers || [],
      concursoNumber: req.body.concursoNumber || 0,
      gameCount: req.body.gameCount || 0,
      isInfiniteMode: req.body.isInfiniteMode || false,
      isManualMode: req.body.isManualMode || false,
      logs: req.body.logs || []
    },
    checkpointType: req.body.checkpointType || 'auto',
    checkpointNumber: fs.readdirSync(checkpointsDir).length + 1
  };

  fs.writeFileSync(filepath, JSON.stringify(checkpointData, null, 2));
  console.log(`Checkpoint completo salvo: ${filename}`);
  
  res.json({ 
    message: 'Checkpoint salvo com sucesso', 
    filename,
    savedData: Object.keys(checkpointData.gameState)
  });
});

app.get('/api/checkpoint/latest', (req, res) => {
  try {
    const files = fs.readdirSync(checkpointsDir)
      .filter(f => f.startsWith('checkpoint-'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      return res.status(404).json({ message: 'Nenhum checkpoint encontrado' });
    }

    const latestFile = files[0];
    const data = fs.readFileSync(path.join(checkpointsDir, latestFile));
    
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao carregar checkpoint', 
      error: error.message 
    });
  }
});

app.get('/api/checkpoints', (req, res) => {
  try {
    const files = fs.readdirSync(checkpointsDir);
    const checkpoints = files
      .filter(f => f.startsWith('checkpoint-'))
      .map(filename => {
        const filepath = path.join(checkpointsDir, filename);
        const stats = fs.statSync(filepath);
        const data = JSON.parse(fs.readFileSync(filepath));
        return {
          filename,
          created: stats.birthtime,
          size: stats.size,
          generation: data.gameState?.generation || 0,
          players: data.gameState?.players?.length || 0,
          hasModelState: !!data.gameState?.modelState
        };
      });
    
    res.json(checkpoints);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao listar checkpoints', 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Checkpoints sendo salvos em: ${checkpointsDir}`);
});