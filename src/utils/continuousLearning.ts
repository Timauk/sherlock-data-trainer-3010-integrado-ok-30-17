import * as tf from '@tensorflow/tfjs';

export const updateModel = async (model: tf.LayersModel, newData: number[][], labels: number[][]) => {
  // Ensure the model is compiled
  if (!model.compiled) {
    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });
  }

  const xs = tf.tensor2d(newData);
  const ys = tf.tensor2d(labels);

  await model.fit(xs, ys, {
    epochs: 1,
    batchSize: 32,
  });

  xs.dispose();
  ys.dispose();

  return model;
};

export const saveModel = async (model: tf.LayersModel) => {
  try {
    await model.save('indexeddb://sherlok-model');
    console.log('Modelo salvo com sucesso');
  } catch (error) {
    console.error('Erro ao salvar o modelo:', error);
  }
};

export const loadModel = async (): Promise<tf.LayersModel | null> => {
  try {
    const models = await tf.io.listModels();
    if (!models['indexeddb://sherlok-model']) {
      console.log('No saved model found');
      return null;
    }
    
    const model = await tf.loadLayersModel('indexeddb://sherlok-model');
    // Ensure the loaded model is compiled
    if (!model.optimizer) {
      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['accuracy']
      });
    }
    console.log('Modelo carregado com sucesso');
    return model;
  } catch (error) {
    console.error('Erro ao carregar o modelo:', error);
    // If there's an error loading the model, clear the corrupted data
    await tf.io.removeModel('indexeddb://sherlok-model');
    console.log('Corrupted model data cleared');
    return null;
  }
};