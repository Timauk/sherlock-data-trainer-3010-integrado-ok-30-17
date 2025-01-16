import express from 'express';
import { systemLogger } from '../utils/logging/systemLogger';

const router = express.Router();

router.get('/', (_, res) => {
  try {
    systemLogger.log('system', 'Status check realizado com sucesso');
    res.status(200).json({ status: 'online' });
  } catch (error) {
    systemLogger.log('system', 'Erro ao verificar status', { error });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;