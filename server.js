import express from 'express';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import * as tf from '@tensorflow/tfjs-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(compression());

const checkpointCache = new Map();
const MAX_CACHE_SIZE = 10;

let globalModel = null;

// Função para criar ou carregar modelo
async function getOrCreateModel() {
  if (!globalModel) {
    globalModel = tf.sequential();
    globalModel.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [17] }));
    globalModel.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    globalModel.add(tf.layers.dense({ units: 15, activation: 'sigmoid' }));
    globalModel.compile({ 
      optimizer: 'adam', 
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }
  return globalModel;
}

// Nova rota para treinamento
app.post('/api/train', async (req, res) => {
  try {
    const { trainingData } = req.body;
    const model = await getOrCreateModel();
    
    const xs = tf.tensor2d(trainingData.map(d => d.slice(0, -15)));
    const ys = tf.tensor2d(trainingData.map(d => d.slice(-15)));
    
    const result = await model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2
    });
    
    res.json({
      loss: result.history.loss[result.history.loss.length - 1],
      accuracy: result.history.acc[result.history.acc.length - 1]
    });
    
    xs.dispose();
    ys.dispose();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nova rota para predições
app.post('/api/predict', async (req, res) => {
  try {
    const { inputData } = req.body;
    const model = await getOrCreateModel();
    
    const inputTensor = tf.tensor2d([inputData]);
    const prediction = model.predict(inputTensor);
    const result = Array.from(await (prediction as tf.Tensor).data());
    
    const confidence = calculateConfidence(result);
    
    inputTensor.dispose();
    (prediction as tf.Tensor).dispose();
    
    res.json({ prediction: result, confidence });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateConfidence(predictions: number[]): number {
  const certainty = predictions.reduce((acc, pred) => {
    const distance = Math.abs(pred - 0.5);
    return acc + (distance / 0.5);
  }, 0);
  
  return (certainty / predictions.length) * 100;
}

const cleanOldCheckpoints = (checkpointsDir) => {
  const files = fs.readdirSync(checkpointsDir)
    .filter(f => f.startsWith('checkpoint-'))
    .sort()
    .reverse();

  if (files.length > 50) {
    files.slice(50).forEach(file => {
      fs.unlinkSync(path.join(checkpointsDir, file));
    });
  }
};

app.post('/api/checkpoint', (req, res) => {
  const checkpointsDir = req.body.path || path.join(__dirname, 'checkpoints');
  
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

app.get('/api/checkpoint/latest', (req, res) => {
  try {
    const checkpointsDir = path.join(__dirname, 'checkpoints');
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

app.get('/api/checkpoints', (req, res) => {
  try {
    const checkpointsDir = path.join(__dirname, 'checkpoints');
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
});
