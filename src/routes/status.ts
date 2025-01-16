import express from 'express';
import { logger } from '../utils/logging/logger';

const router = express.Router();

router.get('/', (_req, res) => {
  try {
    const statusInfo = {
      status: 'online',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };
    
    logger.info(statusInfo, 'Status check');
    res.json(statusInfo);
  } catch (error) {
    logger.error(error, 'Erro ao obter status do servidor');
    res.status(500).json({ 
      status: 'error',
      message: 'Erro interno ao obter status do servidor'
    });
  }
});

export { router as statusRouter };