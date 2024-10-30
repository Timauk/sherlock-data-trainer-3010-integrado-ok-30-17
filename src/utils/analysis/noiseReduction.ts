export interface NoiseReductionResult {
  cleanedData: number[][];
  noiseLevel: number;
  confidence: number;
}

export const reduceNoise = (numbers: number[][]): NoiseReductionResult => {
  const movingAverageWindow = 5;
  const cleanedData: number[][] = [];
  let totalNoise = 0;

  for (let i = 0; i < numbers.length; i++) {
    const windowStart = Math.max(0, i - Math.floor(movingAverageWindow / 2));
    const windowEnd = Math.min(numbers.length, i + Math.floor(movingAverageWindow / 2) + 1);
    const window = numbers.slice(windowStart, windowEnd);

    // Calculate frequency-based smoothing
    const frequencies: { [key: number]: number } = {};
    window.flat().forEach(num => {
      frequencies[num] = (frequencies[num] || 0) + 1;
    });

    // Apply smoothing to current game
    const smoothedGame = numbers[i].map(num => {
      const freq = frequencies[num] || 0;
      const noise = 1 - (freq / window.length);
      totalNoise += noise;
      return num;
    });

    cleanedData.push(smoothedGame);
  }

  const averageNoise = totalNoise / (numbers.length * numbers[0].length);
  const confidence = 1 - averageNoise;

  return {
    cleanedData,
    noiseLevel: averageNoise,
    confidence
  };
};