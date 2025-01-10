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

  console.log('Dados de entrada brutos:', inputData);
  console.log('Pesos do jogador:', playerWeights);
  
  try {
    // Validação de dimensões
    const inputShape = trainedModel.inputs[0].shape;
    console.log('Shape esperado do modelo:', inputShape);
    
    if (inputData.length !== 15) {
      throw new Error(`Formato de entrada inválido. Esperado: 15, Recebido: ${inputData.length}`);
    }

    // Normalização dos dados de entrada com variação por jogador
    const normalizedInput = inputData.map((n, idx) => {
      // Adiciona variação baseada nos pesos do jogador
      const playerInfluence = (playerWeights[idx % playerWeights.length] / 1000);
      const baseNormalized = n / 25;
      const variation = (Math.random() - 0.5) * 0.1 * playerInfluence;
      const normalized = Math.max(0, Math.min(1, baseNormalized + variation));
      
      if (normalized < 0 || normalized > 1) {
        console.warn('Valor normalizado fora do intervalo [0,1]:', normalized);
        return baseNormalized;
      }
      return normalized;
    });

    console.log('Dados normalizados com influência do jogador:', normalizedInput);

    // Preparação do tensor de entrada
    const inputTensor = tf.tensor2d([normalizedInput]);
    console.log('Dimensões do tensor de entrada:', inputTensor.shape);
    
    // Execução da predição com influência dos pesos do jogador
    const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
    const rawPredictions = Array.from(await predictions.data());
    
    console.log('Predições brutas:', rawPredictions);
    
    // Limpeza de memória
    tf.dispose([inputTensor, predictions]);
    
    // Atualização da visualização
    setNeuralNetworkVisualization({
      input: normalizedInput,
      output: rawPredictions,
      weights: trainedModel.getWeights().map(w => Array.from(w.dataSync()))
    });
    
    // Denormalização e seleção dos números com influência do jogador
    const weightedPredictions = rawPredictions.map((prob, index) => ({
      number: index + 1,
      probability: prob * (1 + (playerWeights[index % playerWeights.length] / 1000))
    }));

    // Ordenação e seleção dos 15 números mais prováveis
    const finalPrediction = weightedPredictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(item => item.number)
      .sort((a, b) => a - b);

    console.log('Predição final com influência do jogador:', finalPrediction);

    // Validação final
    if (finalPrediction.length !== 15) {
      throw new Error('Número incorreto de predições geradas');
    }

    // Verificação de números únicos
    const uniqueNumbers = new Set(finalPrediction);
    if (uniqueNumbers.size !== 15) {
      console.warn('Predição contém números duplicados, gerando nova predição...');
      return makePrediction(
        trainedModel,
        inputData,
        playerWeights,
        concursoNumber,
        setNeuralNetworkVisualization,
        lunarData,
        historicalData
      );
    }

    // Monitoramento de performance
    const endTime = performance.now();
    performanceMonitor.recordMetrics(rawPredictions[0], endTime - performance.now());

    return finalPrediction;

  } catch (error) {
    systemLogger.log('system', 'Erro durante a predição', { error });
    console.error('Erro detalhado:', error);
    return [];
  }
}