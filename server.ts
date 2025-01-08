import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';
import NodeCache from 'node-cache';
import * as tf from '@tensorflow/tfjs';
import fs from 'fs';

// Import logger after defining __dirname
import { logger } from './src/utils/logging/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist'))); 

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

// API root route
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    endpoints: {
      '/api/model': 'AI Model Management',
      '/api/checkpoint': 'Checkpoint Management',
      '/api/status': 'Server Status'
    }
  });
});

// Root route handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Health check route
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

// Error middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error({
    err,
    method: req.method,
    url: req.url,
    body: req.body
  }, 'Error occurred');
  
  res.status(500).json({
    error: 'Internal server error',
    message: err instanceof Error ? err.message : 'Unknown error'
  });
};

app.use(errorHandler);

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