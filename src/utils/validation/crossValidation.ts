import { Player } from '@/types/gameTypes';

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
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
    
    metrics.push(calculateMetrics(testPredictions, testActual));
  }

  return metrics;
};

const calculateMetrics = (predictions: number[][], actual: number[][]): ValidationMetrics => {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  predictions.forEach((pred, idx) => {
    if (!actual[idx]) return;
    
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
    f1Score
  };
};