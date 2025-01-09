import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '../types/gameTypes';
import { systemLogger } from './logging/systemLogger';
import { getLunarPhase } from './lunarCalculations';
import { TimeSeriesAnalysis } from './analysis/timeSeriesAnalysis';
import { performanceMonitor } from './performance/performanceMonitor';

interface LunarData {
  lunarPhase: string;
  lunarPatterns: Record<string, number[]>;
}

export async function makePrediction(
  trainedModel: tf.LayersModel | null,
  inputData: number[],
  playerWeights: number[],
  concursoNumber: number,
  setNeuralNetworkVisualization: (vis: ModelVisualization) => void,
  lunarData?: LunarData,
  historicalData?: { numbers: number[][], dates: Date[] }
): Promise<number[]> {
  if (!trainedModel) {
    systemLogger.log('system', 'Modelo neural não carregado!');
    return [];
  }

  if (!historicalData) {
    systemLogger.log('system', 'Dados históricos não disponíveis!');
    return [];
  }
  
  console.log('Dados de entrada brutos:', inputData);
  console.log('Pesos do jogador:', playerWeights);
  
  try {
    // Validação de dimensões
    const inputShape = trainedModel.inputs[0].shape;
    console.log('Shape esperado do modelo:', inputShape);
    
    if (inputData.length !== 15) {
      throw new Error(`Formato de entrada inválido. Esperado: 15, Recebido: ${inputData.length}`);
    }

    // Normalização dos dados de entrada (garantindo valores entre 0 e 1)
    const normalizedInput = inputData.map(n => {
      const normalized = n / 25;
      if (normalized < 0 || normalized > 1) {
        console.warn('Valor normalizado fora do intervalo [0,1]:', normalized);
      }
      return normalized;
    });

    console.log('Dados normalizados:', normalizedInput);

    // Preparação do tensor de entrada
    const inputTensor = tf.tensor2d([normalizedInput]);
    console.log('Dimensões do tensor de entrada:', inputTensor.shape);
    
    // Execução da predição
    const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await predictions.data());
    
    console.log('Predições brutas:', result);
    
    // Limpeza de memória
    tf.dispose([inputTensor, predictions]);
    
    // Atualização da visualização
    setNeuralNetworkVisualization({
      input: normalizedInput,
      output: result,
      weights: trainedModel.getWeights().map(w => Array.from(w.dataSync()))
    });
    
    // Denormalização e seleção dos números
    const finalPrediction = result
      .map((prob, index) => ({ number: index + 1, probability: prob }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(item => item.number)
      .sort((a, b) => a - b);

    console.log('Predição final:', finalPrediction);

    // Monitoramento de performance
    const endTime = performance.now();
    performanceMonitor.recordMetrics(result[0], endTime - performance.now());
    
    // Validação final
    if (finalPrediction.length !== 15) {
      throw new Error('Número incorreto de predições geradas');
    }

    return finalPrediction;

  } catch (error) {
    systemLogger.log('system', 'Erro durante a predição', { error });
    console.error('Erro detalhado:', error);
    return [];
  }
}