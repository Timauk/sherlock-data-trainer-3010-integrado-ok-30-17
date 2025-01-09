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

  systemLogger.log('prediction', 'Iniciando previsão', {
    inputDataLength: inputData.length,
    weightsLength: playerWeights.length,
    concurso: concursoNumber
  });

  try {
    // Validação de dimensões
    const inputShape = trainedModel.inputs[0].shape;
    systemLogger.log('prediction', 'Shape do modelo', { inputShape });
    
    if (inputData.length !== 15) {
      throw new Error(`Formato de entrada inválido. Esperado: 15, Recebido: ${inputData.length}`);
    }

    // Normalização dos dados com variação por jogador
    const normalizedInput = inputData.map((n, idx) => {
      const playerInfluence = (playerWeights[idx % playerWeights.length] / 1000);
      const baseNormalized = n / 25; // Normaliza para [0,1]
      const variation = (Math.random() - 0.5) * 0.2 * playerInfluence; // Aumentei a variação
      return Math.max(0, Math.min(1, baseNormalized + variation));
    });

    systemLogger.log('prediction', 'Dados normalizados', { normalizedInput });

    // Preparação do tensor
    const inputTensor = tf.tensor2d([normalizedInput]);
    
    // Execução da predição
    const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
    const rawPredictions = Array.from(await predictions.data());
    
    systemLogger.log('prediction', 'Predições brutas', { rawPredictions });

    // Limpeza de memória
    tf.dispose([inputTensor, predictions]);

    // Atualização da visualização
    setNeuralNetworkVisualization({
      input: normalizedInput,
      output: rawPredictions,
      weights: trainedModel.getWeights().map(w => Array.from(w.dataSync()))
    });

    // Geração de números únicos com influência dos pesos
    const availableNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
    const weightedPredictions = availableNumbers.map(num => {
      const index = num - 1;
      const weight = playerWeights[index % playerWeights.length] / 1000;
      const baseProb = rawPredictions[index % rawPredictions.length];
      const randomFactor = Math.random() * 0.3; // Fator aleatório para mais variação
      return {
        number: num,
        probability: baseProb * (1 + weight) + randomFactor
      };
    });

    // Ordenação e seleção dos números
    const finalPrediction = weightedPredictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(item => item.number)
      .sort((a, b) => a - b);

    systemLogger.log('prediction', 'Predição final', { 
      finalPrediction,
      playerWeightsUsed: playerWeights.slice(0, 5), // Mostra apenas os primeiros 5 pesos
      probabilityRange: {
        min: Math.min(...weightedPredictions.map(p => p.probability)),
        max: Math.max(...weightedPredictions.map(p => p.probability))
      }
    });

    // Validação final
    const uniqueNumbers = new Set(finalPrediction);
    if (uniqueNumbers.size !== 15 || finalPrediction.length !== 15) {
      systemLogger.log('prediction', 'Erro: números duplicados ou quantidade incorreta', {
        uniqueCount: uniqueNumbers.size,
        predictionLength: finalPrediction.length
      });
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

    return finalPrediction;

  } catch (error) {
    systemLogger.log('system', 'Erro durante a predição', { 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      inputData,
      playerWeightsLength: playerWeights.length
    });
    return [];
  }
}