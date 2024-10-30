import express from 'express';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import * as tf from '@tensorflow/tfjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(compression());

// Separate model logic into its own route handler
import { modelRouter } from './routes/model.js';
app.use('/api/model', modelRouter);

// Separate checkpoint logic into its own route handler
import { checkpointRouter } from './routes/checkpoint.js';
app.use('/api/checkpoint', checkpointRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});