import { Player } from '@/types/gameTypes';

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastGameAccuracy: number; // Nova métrica específica para último concurso
}

export const performCrossValidation = (
  predictions: number[][],
  actualResults: number[][],
  folds: number = 5
): ValidationMetrics[] => {
  const foldSize = Math.floor(predictions.length / folds);
  const metrics: ValidationMetrics[] = [];

  for (let i = 0; i < folds; i++) {
    const testStart = i * foldSize;
    const testEnd = testStart + foldSize;
    
    const testPredictions = predictions.slice(testStart, testEnd);
    const testActual = actualResults.slice(testStart, testEnd);
    
    // Foco especial no último concurso de cada fold
    const lastGameMetrics = calculateLastGameMetrics(
      testPredictions[testPredictions.length - 1],
      testActual[testActual.length - 1]
    );

    metrics.push({
      ...calculateMetrics(testPredictions, testActual),
      lastGameAccuracy: lastGameMetrics
    });
  }

  return metrics;
};

const calculateLastGameMetrics = (prediction: number[], actual: number[]): number => {
  const matches = prediction.filter(num => actual.includes(num)).length;
  return matches / actual.length;
};

const calculateMetrics = (predictions: number[][], actual: number[][]): ValidationMetrics => {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  predictions.forEach((pred, idx) => {
    const actualSet = new Set(actual[idx]);
    pred.forEach(num => {
      if (actualSet.has(num)) {
        truePositives++;
      } else {
        falsePositives++;
      }
    });
    actual[idx].forEach(num => {
      if (!pred.includes(num)) {
        falseNegatives++;
      }
    });
  });

  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const accuracy = truePositives / (truePositives + falsePositives + falseNegatives) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    lastGameAccuracy: 0 // Será substituído pelo valor real
  };
};

export const validateLastGamePrediction = (
  prediction: number[],
  actual: number[]
): ValidationMetrics => {
  const matches = prediction.filter(num => actual.includes(num)).length;
  const accuracy = matches / actual.length;
  
  return {
    accuracy,
    precision: matches / prediction.length,
    recall: matches / actual.length,
    f1Score: 2 * (matches / prediction.length) * (matches / actual.length) / 
             ((matches / prediction.length) + (matches / actual.length)),
    lastGameAccuracy: accuracy
  };
};