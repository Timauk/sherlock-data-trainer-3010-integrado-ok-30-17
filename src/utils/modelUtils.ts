import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logging/systemLogger';

export const updateModelWithNewData = async (
  model: tf.LayersModel,
  trainingData: number[][],
  addLog: (message: string) => void,
  showToast?: (title: string, description: string) => void
) => {
  try {
    const inputTensor = tf.tensor2d(trainingData);
    await model.fit(inputTensor, inputTensor, {
      epochs: 1,
      batchSize: 32,
      verbose: 1
    });
    
    inputTensor.dispose();
    addLog("Modelo atualizado com novos dados");
    
    if (showToast) {
      showToast(
        "Modelo Atualizado",
        "O modelo foi atualizado com sucesso usando os novos dados"
      );
    }
  } catch (error) {
    systemLogger.log('system', `Erro ao atualizar modelo: ${error}`);
    throw error;
  }
};