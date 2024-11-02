import express from 'express';
import { cacheMiddleware } from '../src/utils/performance/serverCache';

const router = express.Router();

async function fetchLatestLotofacil() {
  try {
    const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest');
    if (!response.ok) {
      throw new Error('Falha ao buscar dados da Lotofacil');
    }
    return response.json();
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    throw error;
  }
}

router.get('/latest', cacheMiddleware, async (req, res) => {
  try {
    const data = await fetchLatestLotofacil();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/update', async (req, res) => {
  try {
    const data = await fetchLatestLotofacil();
    res.json({ 
      success: true, 
      lastConcurso: data.concurso,
      message: 'Dados atualizados com sucesso'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as lotofacilRouter };