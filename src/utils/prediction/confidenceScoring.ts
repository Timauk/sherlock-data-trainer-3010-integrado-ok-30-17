import { Player } from '@/types/gameTypes';

export interface ConfidenceScore {
  score: number;
  factors: {
    historicalAccuracy: number;
    patternStrength: number;
    temporalRelevance: number;
  };
}

export const calculateConfidenceScore = (
  prediction: number[],
  player: Player,
  historicalData: number[][]
): ConfidenceScore => {
  const historicalAccuracy = calculateHistoricalAccuracy(player);
  const patternStrength = analyzePatternStrength(prediction, historicalData);
  const temporalRelevance = calculateTemporalRelevance(player.predictions);

  const score = (
    historicalAccuracy * 0.4 +
    patternStrength * 0.4 +
    temporalRelevance * 0.2
  );

  return {
    score,
    factors: {
      historicalAccuracy,
      patternStrength,
      temporalRelevance
    }
  };
};

const calculateHistoricalAccuracy = (player: Player): number => {
  if (!player.predictions.length) return 0;
  return player.score / player.predictions.length;
};

const analyzePatternStrength = (prediction: number[], historicalData: number[][]): number => {
  const frequencyMap = new Map<number, number>();
  historicalData.forEach(numbers => {
    numbers.forEach(num => {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
    });
  });

  const totalGames = historicalData.length;
  return prediction.reduce((acc, num) => {
    const frequency = frequencyMap.get(num) || 0;
    return acc + (frequency / totalGames);
  }, 0) / prediction.length;
};

const calculateTemporalRelevance = (predictions: number[][]): number => {
  if (predictions.length < 2) return 0;
  const recentPredictions = predictions.slice(-5);
  const uniqueNumbers = new Set(recentPredictions.flat());
  return uniqueNumbers.size / (25 * 0.6);
};