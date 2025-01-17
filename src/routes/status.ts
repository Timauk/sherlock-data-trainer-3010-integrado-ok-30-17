import express from 'express';
import { systemLogger } from '../utils/logging/systemLogger';

const router = express.Router();

router.get('/', (_req, res) => {
  try {
    const statusInfo = {
      status: 'online',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.version
    };
    
    systemLogger.log('system', 'Status check realizado com sucesso', statusInfo);
    res.status(200).json(statusInfo);
  } catch (error) {
    systemLogger.log('system', 'Erro ao verificar status', { error });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;