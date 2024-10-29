import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  crossValidationScore: number;
}

export const validateModel = async (
  model: tf.LayersModel,
  validationData: number[][],
  validationLabels: number[][]
): Promise<ValidationMetrics> => {
  const xs = tf.tensor2d(validationData);
  const ys = tf.tensor2d(validationLabels);

  // Realizar predições
  const predictions = model.predict(xs) as tf.Tensor;
  
  // Calcular métricas
  const accuracy = await calculateAccuracy(predictions, ys);
  const precision = await calculatePrecision(predictions, ys);
  const recall = await calculateRecall(predictions, ys);
  
  // Cross-validation
  const crossValidationScore = await performCrossValidation(model, validationData, validationLabels);

  // Visualizar métricas
  await tfvis.show.modelSummary({name: 'Model Validation'}, model);

  // Limpar tensores
  xs.dispose();
  ys.dispose();
  predictions.dispose();

  return {
    accuracy,
    precision,
    recall,
    crossValidationScore
  };
};

const calculateAccuracy = async (predictions: tf.Tensor, labels: tf.Tensor): Promise<number> => {
  const predArray = await predictions.array() as number[][];
  const labelArray = await labels.array() as number[][];
  
  let correct = 0;
  let total = 0;
  
  for (let i = 0; i < predArray.length; i++) {
    for (let j = 0; j < predArray[i].length; j++) {
      if (Math.round(predArray[i][j]) === labelArray[i][j]) {
        correct++;
      }
      total++;
    }
  }
  
  return correct / total;
};

const calculatePrecision = async (predictions: tf.Tensor, labels: tf.Tensor): Promise<number> => {
  const predArray = await predictions.array() as number[][];
  const labelArray = await labels.array() as number[][];
  
  let truePositives = 0;
  let falsePositives = 0;
  
  for (let i = 0; i < predArray.length; i++) {
    for (let j = 0; j < predArray[i].length; j++) {
      const predictedValue = Math.round(predArray[i][j]) as 0 | 1;
      const actualValue = labelArray[i][j] as 0 | 1;
      
      if (predictedValue === 1) {
        if (actualValue === 1) {
          truePositives++;
        } else {
          falsePositives++;
        }
      }
    }
  }
  
  return truePositives / (truePositives + falsePositives);
};

const calculateRecall = async (predictions: tf.Tensor, labels: tf.Tensor): Promise<number> => {
  const predArray = await predictions.array() as number[][];
  const labelArray = await labels.array() as number[][];
  
  let truePositives = 0;
  let falseNegatives = 0;
  
  for (let i = 0; i < predArray.length; i++) {
    for (let j = 0; j < predArray[i].length; j++) {
      const predictedValue = Math.round(predArray[i][j]) as 0 | 1;
      const actualValue = labelArray[i][j] as 0 | 1;
      
      if (actualValue === 1) {
        if (predictedValue === 1) {
          truePositives++;
        } else {
          falseNegatives++;
        }
      }
    }
  }
  
  return truePositives / (truePositives + falseNegatives);
};

const performCrossValidation = async (
  model: tf.LayersModel,
  data: number[][],
  labels: number[][]
): Promise<number> => {
  const folds = 5;
  const foldSize = Math.floor(data.length / folds);
  let totalScore = 0;
  
  for (let i = 0; i < folds; i++) {
    const validationStart = i * foldSize;
    const validationEnd = validationStart + foldSize;
    
    const validationData = data.slice(validationStart, validationEnd);
    const validationLabels = labels.slice(validationStart, validationEnd);
    
    const trainingData = [
      ...data.slice(0, validationStart),
      ...data.slice(validationEnd)
    ];
    const trainingLabels = [
      ...labels.slice(0, validationStart),
      ...labels.slice(validationEnd)
    ];
    
    await model.fit(
      tf.tensor2d(trainingData),
      tf.tensor2d(trainingLabels),
      { epochs: 1 }
    );
    
    const score = await calculateAccuracy(
      model.predict(tf.tensor2d(validationData)) as tf.Tensor,
      tf.tensor2d(validationLabels)
    );
    
    totalScore += score;
  }
  
  return totalScore / folds;
};