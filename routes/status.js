import express from 'express';
const router = express.Router();

router.get('/', (_req, res) => {
  try {
    res.json({ 
      status: 'online',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage()
    });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erro interno ao obter status do servidor'
    });
  }
});

export { router as statusRouter };