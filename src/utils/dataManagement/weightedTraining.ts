import * as tf from '@tensorflow/tfjs';

export const calculateDataWeights = (dates: Date[]): number[] => {
  const now = new Date();
  const maxAge = Math.max(...dates.map(date => now.getTime() - date.getTime()));
  
  return dates.map(date => {
    const age = now.getTime() - date.getTime();
    return 0.5 + (0.5 * (1 - age / maxAge));
  });
};

export const periodicModelRetraining = async (
  model: tf.LayersModel,
  historicalData: number[][],
  dates: Date[],
  addLog: (message: string) => void
): Promise<tf.LayersModel> => {
  try {
    const weights = calculateDataWeights(dates);
    
    const xs = tf.tensor2d(historicalData.map(data => data.slice(0, -15)));
    const ys = tf.tensor2d(historicalData.map(data => data.slice(-15)));
    const sampleWeights = tf.tensor1d(weights);

    await model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      sampleWeight: sampleWeights,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (logs) {
            addLog(`Retreinamento - Época ${epoch + 1}: Loss = ${logs['loss'].toFixed(4)}`);
          }
        }
      }
    });

    xs.dispose();
    ys.dispose();
    sampleWeights.dispose();

    return model;
  } catch (error) {
    console.error('Erro no retreinamento:', error);
    throw error;
  }
};

export const setupPeriodicRetraining = (
  model: tf.LayersModel,
  historicalData: number[][],
  dates: Date[],
  addLog: (message: string) => void,
  intervalHours: number = 24
) => {
  const interval = intervalHours * 60 * 60 * 1000;
  
  return setInterval(async () => {
    try {
      await periodicModelRetraining(model, historicalData, dates, addLog);
      addLog('Retreinamento periódico concluído com sucesso');
    } catch (error) {
      addLog(`Erro no retreinamento periódico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, interval);
};