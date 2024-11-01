import express from 'express';
import { cacheMiddleware } from '../src/utils/performance/serverCache';

const router = express.Router();

async function fetchLatestLotofacil() {
  const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest');
  if (!response.ok) {
    throw new Error('Falha ao buscar dados da Lotofacil');
  }
  return response.json();
}

router.get('/latest', cacheMiddleware, async (req, res) => {
  try {
    const data = await fetchLatestLotofacil();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/update', async (req, res) => {
  try {
    const data = await fetchLatestLotofacil();
    // Aqui você pode adicionar lógica adicional para salvar no banco
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