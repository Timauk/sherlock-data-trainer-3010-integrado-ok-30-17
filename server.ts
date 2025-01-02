import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';
import NodeCache from 'node-cache';
import * as tf from '@tensorflow/tfjs';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import logger after defining __dirname
import { logger } from './src/utils/logging/logger.js';

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip
  }, 'Incoming request');
  next();
});

// Routes
import { modelRouter } from './src/routes/model.js';
import { checkpointRouter } from './src/routes/checkpoint.js';
import { statusRouter } from './src/routes/status.js';

app.use('/api/model', modelRouter);
app.use('/api/checkpoint', checkpointRouter);
app.use('/api/status', statusRouter);

// Rota principal
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    endpoints: {
      '/api/model': 'Gerenciamento do modelo de IA',
      '/api/checkpoint': 'Gerenciamento de checkpoints',
      '/api/status': 'Status do servidor'
    }
  });
});

// Rota para verificar se o servidor está online
app.get('/health', (req, res) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  logger.info(healthInfo, 'Health check');
  res.json(healthInfo);
});

// Middleware de erro
app.use((err, req, res, next) => {
  logger.error({
    err,
    method: req.method,
    url: req.url,
    body: req.body
  }, 'Error occurred');
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Create checkpoints and logs directories if they don't exist
const checkpointsDir = path.join(__dirname, 'checkpoints');
const logsDir = path.join(__dirname, 'logs');

[checkpointsDir, logsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
  logger.info(`Checkpoints directory: ${checkpointsDir}`);
  logger.info(`Logs directory: ${logsDir}`);
});
