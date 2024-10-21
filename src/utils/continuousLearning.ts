import * as tf from '@tensorflow/tfjs';

export const updateModel = async (model: tf.LayersModel, newData: number[][], labels: number[][]) => {
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
    const model = await tf.loadLayersModel('indexeddb://sherlok-model');
    console.log('Modelo carregado com sucesso');
    return model;
  } catch (error) {
    console.error('Erro ao carregar o modelo:', error);
    return null;
  }
};