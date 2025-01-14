import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';
import NodeCache from 'node-cache';
import * as tf from '@tensorflow/tfjs';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { logger } from './src/utils/logging/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
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

// API root route
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    endpoints: {
      '/api/model': 'Gerenciamento do modelo de IA',
      '/api/checkpoint': 'Gerenciamento de checkpoints',
      '/api/status': 'Status do servidor'
    }
  });
});

// Serve index.html for all other routes
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  logger.info(healthInfo, 'Health check');
  res.json(healthInfo);
});

// Error handler middleware with proper types
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({
    err,
    method: req.method,
    url: req.url,
    body: req.body
  }, 'Error occurred');
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err instanceof Error ? err.message : 'Unknown error'
  });
};

app.use(errorHandler);

// Create directories if they don't exist
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