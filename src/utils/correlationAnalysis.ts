import { analysisCache } from './cacheSystem';

export interface CorrelationAnalysis {
  matrix: number[][];
  significantPairs: Array<{
    numbers: [number, number];
    correlation: number;
  }>;
}

const calculateCorrelation = (
  numbers: number[][],
  num1: number,
  num2: number
): number => {
  type BinaryValue = 0 | 1;
  
  const occurrences1: BinaryValue[] = numbers.map(draw => 
    draw.includes(num1) ? 1 as BinaryValue : 0 as BinaryValue
  );
  const occurrences2: BinaryValue[] = numbers.map(draw => 
    draw.includes(num2) ? 1 as BinaryValue : 0 as BinaryValue
  );

  const mean1 = occurrences1.reduce((a, b) => a + b, 0) / occurrences1.length;
  const mean2 = occurrences2.reduce((a, b) => a + b, 0) / occurrences2.length;

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < occurrences1.length; i++) {
    const diff1 = occurrences1[i] - mean1;
    const diff2 = occurrences2[i] - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  return numerator / Math.sqrt(denominator1 * denominator2);
};

export const analyzeCorrelations = async (
  numbers: number[][],
  threshold: number = 0.7
): Promise<CorrelationAnalysis> => {
  const cacheKey = `correlations-${threshold}-${numbers.length}`;
  const cached = await analysisCache.get(cacheKey);
  if (cached) return cached;

  const flatNumbers = numbers.flat();
  const uniqueNumbers = Array.from(new Set(flatNumbers));
  const matrix: number[][] = [];
  const significantPairs: Array<{
    numbers: [number, number];
    correlation: number;
  }> = [];

  for (let i = 0; i < uniqueNumbers.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < uniqueNumbers.length; j++) {
      const correlation = calculateCorrelation(
        numbers,
        uniqueNumbers[i],
        uniqueNumbers[j]
      );
      matrix[i][j] = correlation;

      if (i < j && Math.abs(correlation) > threshold) {
        significantPairs.push({
          numbers: [uniqueNumbers[i], uniqueNumbers[j]],
          correlation
        });
      }
    }
  }

  const result = { matrix, significantPairs };
  await analysisCache.set(cacheKey, result);
  return result;
};