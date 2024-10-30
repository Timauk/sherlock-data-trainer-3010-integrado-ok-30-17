export interface OutlierAnalysis {
  outliers: number[];
  scores: number[];
  threshold: number;
}

export const detectOutliers = (numbers: number[][]): OutlierAnalysis => {
  // Calculate Z-scores for each number
  const flattened = numbers.flat();
  const mean = flattened.reduce((a, b) => a + b, 0) / flattened.length;
  const stdDev = Math.sqrt(
    flattened.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / flattened.length
  );

  const scores = flattened.map(num => Math.abs((num - mean) / stdDev));
  const threshold = 2.5; // Standard statistical threshold for outliers

  const outliers = flattened.filter((_, index) => scores[index] > threshold);

  return {
    outliers,
    scores,
    threshold
  };
};

export const removeOutliers = (numbers: number[][]): number[][] => {
  const { outliers } = detectOutliers(numbers);
  const outlierSet = new Set(outliers);

  return numbers.map(game =>
    game.filter(num => !outlierSet.has(num))
  ).filter(game => game.length >= 10); // Keep only games with enough remaining numbers
};