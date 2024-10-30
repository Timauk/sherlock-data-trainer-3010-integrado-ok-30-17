export interface FeatureImportance {
  feature: string;
  importance: number;
  correlation: number;
}

export const analyzeFeatureImportance = (
  numbers: number[][],
  targets: number[]
): FeatureImportance[] => {
  const features = extractFeatures(numbers);
  const importance: FeatureImportance[] = [];

  Object.entries(features).forEach(([feature, values]) => {
    const correlation = calculateCorrelation(values, targets);
    const varianceImportance = calculateVarianceImportance(values);
    
    importance.push({
      feature,
      importance: varianceImportance,
      correlation: Math.abs(correlation)
    });
  });

  return importance.sort((a, b) => b.importance - a.importance);
};

const extractFeatures = (numbers: number[][]): { [key: string]: number[] } => {
  return {
    sum: numbers.map(game => game.reduce((a, b) => a + b, 0)),
    mean: numbers.map(game => game.reduce((a, b) => a + b, 0) / game.length),
    variance: numbers.map(game => {
      const mean = game.reduce((a, b) => a + b, 0) / game.length;
      return game.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / game.length;
    }),
    maxGap: numbers.map(game => {
      const sorted = [...game].sort((a, b) => a - b);
      let maxGap = 0;
      for (let i = 1; i < sorted.length; i++) {
        maxGap = Math.max(maxGap, sorted[i] - sorted[i-1]);
      }
      return maxGap;
    }),
    evenCount: numbers.map(game => game.filter(n => n % 2 === 0).length),
    uniqueCount: numbers.map(game => new Set(game).size)
  };
};

const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  return (n * sumXY - sumX * sumY) / 
         (Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)));
};

const calculateVarianceImportance = (values: number[]): number => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return variance / mean; // Coefficient of variation
};