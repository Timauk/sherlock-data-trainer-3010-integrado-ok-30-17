export interface StatisticalModel {
  mean: number[];
  standardDeviation: number[];
  variance: number[];
  skewness: number[];
  kurtosis: number[];
}

export const calculateStatistics = (numbers: number[][]): StatisticalModel => {
  const transposed = transposeMatrix(numbers);
  
  return {
    mean: calculateMean(transposed),
    standardDeviation: calculateStandardDeviation(transposed),
    variance: calculateVariance(transposed),
    skewness: calculateSkewness(transposed),
    kurtosis: calculateKurtosis(transposed)
  };
};

const transposeMatrix = (matrix: number[][]): number[][] => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j];
    }
  }

  return result;
};

const calculateMean = (numbers: number[][]): number[] => {
  return numbers.map(row => {
    const sum = row.reduce((acc, val) => acc + val, 0);
    return sum / row.length;
  });
};

const calculateVariance = (numbers: number[][]): number[] => {
  const means = calculateMean(numbers);
  
  return numbers.map((row, i) => {
    const squaredDiffs = row.map(val => Math.pow(val - means[i], 2));
    return squaredDiffs.reduce((acc, val) => acc + val, 0) / row.length;
  });
};

const calculateStandardDeviation = (numbers: number[][]): number[] => {
  const variances = calculateVariance(numbers);
  return variances.map(variance => Math.sqrt(variance));
};

const calculateSkewness = (numbers: number[][]): number[] => {
  const means = calculateMean(numbers);
  const stdDevs = calculateStandardDeviation(numbers);

  return numbers.map((row, i) => {
    const n = row.length;
    const cubedDiffs = row.map(val => 
      Math.pow((val - means[i]) / stdDevs[i], 3)
    );
    return (n / ((n - 1) * (n - 2))) * 
           cubedDiffs.reduce((acc, val) => acc + val, 0);
  });
};

const calculateKurtosis = (numbers: number[][]): number[] => {
  const means = calculateMean(numbers);
  const stdDevs = calculateStandardDeviation(numbers);

  return numbers.map((row, i) => {
    const n = row.length;
    const fourthMoment = row.map(val => 
      Math.pow((val - means[i]) / stdDevs[i], 4)
    ).reduce((acc, val) => acc + val, 0) / n;
    return fourthMoment - 3;
  });
};