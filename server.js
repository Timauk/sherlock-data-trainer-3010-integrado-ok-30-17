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

// Habilita CORS e JSON parsing
app.use(cors());
app.use(express.json());

// Cria pasta de checkpoints se não existir
const checkpointsDir = path.join(__dirname, 'checkpoints');
if (!fs.existsSync(checkpointsDir)) {
  fs.mkdirSync(checkpointsDir);
}

// Salvar checkpoint com dados detalhados
app.post('/api/checkpoint', (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `checkpoint-${timestamp}.json`;
  const filepath = path.join(checkpointsDir, filename);

  // Adiciona informações extras ao checkpoint
  const checkpointData = {
    ...req.body,
    saveTime: timestamp,
    systemInfo: {
      totalMemory: process.memoryUsage().heapTotal,
      freeMemory: process.memoryUsage().heapUsed,
      uptime: process.uptime()
    },
    checkpointType: 'auto',
    checkpointNumber: fs.readdirSync(checkpointsDir).length + 1
  };

  fs.writeFileSync(filepath, JSON.stringify(checkpointData, null, 2));
  console.log(`Checkpoint salvo: ${filename}`);
  res.json({ message: 'Checkpoint salvo com sucesso', filename });
});

// Carregar último checkpoint
app.get('/api/checkpoint/latest', (req, res) => {
  try {
    const files = fs.readdirSync(checkpointsDir);
    const checkpoints = files.filter(f => f.startsWith('checkpoint-'));
    
    if (checkpoints.length === 0) {
      return res.status(404).json({ message: 'Nenhum checkpoint encontrado' });
    }

    // Pega o arquivo mais recente
    const latestFile = checkpoints.sort().reverse()[0];
    const data = fs.readFileSync(path.join(checkpointsDir, latestFile));
    
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar checkpoint', error: error.message });
  }
});

// Listar todos os checkpoints
app.get('/api/checkpoints', (req, res) => {
  try {
    const files = fs.readdirSync(checkpointsDir);
    const checkpoints = files
      .filter(f => f.startsWith('checkpoint-'))
      .map(filename => {
        const filepath = path.join(checkpointsDir, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          created: stats.birthtime,
          size: stats.size
        };
      });
    
    res.json(checkpoints);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar checkpoints', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Checkpoints sendo salvos em: ${checkpointsDir}`);
});