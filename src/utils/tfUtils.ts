import * as tf from '@tensorflow/tfjs';

export const predictNumbers = async (trainedModel: tf.LayersModel, inputData: number[]): Promise<tf.Tensor> => {
  const inputTensor = tf.tensor2d([inputData]);
  const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
  inputTensor.dispose();
  return predictions;
};