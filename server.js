import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';
import NodeCache from 'node-cache';
import * as tf from '@tensorflow/tfjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
import { modelRouter } from './routes/model.js';
import { checkpointRouter } from './routes/checkpoint.js';
import { statusRouter } from './routes/status.js';
import { lotofacilRouter } from './routes/lotofacil.js';

app.use('/api/model', modelRouter);
app.use('/api/checkpoint', checkpointRouter);
app.use('/api/status', statusRouter);
app.use('/api/lotofacil', lotofacilRouter);

// Rota principal
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    endpoints: {
      '/api/model': 'Gerenciamento do modelo de IA',
      '/api/checkpoint': 'Gerenciamento de checkpoints',
      '/api/status': 'Status do servidor',
      '/api/lotofacil': 'Gerenciamento dos dados da Lotofacil'
    }
  });
});

// Rota para verificar se o servidor está online
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Cria a pasta checkpoints se não existir
import fs from 'fs';
const checkpointsDir = path.join(__dirname, 'checkpoints');
if (!fs.existsSync(checkpointsDir)) {
  fs.mkdirSync(checkpointsDir, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Diretório de checkpoints: ${checkpointsDir}`);
});
