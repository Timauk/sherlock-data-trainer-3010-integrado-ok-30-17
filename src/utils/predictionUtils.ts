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
  
  systemLogger.log('prediction', 'Iniciando predição', {
    inputDataLength: inputData.length,
    playerWeightsLength: playerWeights.length,
    concursoNumber
  });
  
  const startTime = performance.now();
  
  try {
    // Normalização dos dados de entrada
    const normalizedInput = inputData.map(n => n / 25);
    systemLogger.log('prediction', 'Dados normalizados', { normalizedInput });

    // Preparação do tensor de entrada
    const inputTensor = tf.tensor2d([normalizedInput]);
    systemLogger.log('prediction', 'Tensor criado', {
      shape: inputTensor.shape,
      dataType: inputTensor.dtype
    });
    
    // Execução da predição
    const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await predictions.data());
    
    systemLogger.log('prediction', 'Predições obtidas', { result });
    
    // Limpeza de memória
    inputTensor.dispose();
    predictions.dispose();
    
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

    const endTime = performance.now();
    performanceMonitor.recordMetrics(result[0], endTime - startTime);
    
    systemLogger.log('prediction', 'Predição final', { finalPrediction });
    return finalPrediction;

  } catch (error) {
    systemLogger.log('system', 'Erro durante a predição', { error });
    return [];
  }
}