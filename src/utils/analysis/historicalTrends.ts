export interface TrendAnalysis {
  longTermTrends: {
    increasing: number[];
    decreasing: number[];
    stable: number[];
  };
  seasonalPatterns: {
    monthly: number[];
    quarterly: number[];
    yearly: number[];
  };
  cyclicalPatterns: number[][];
  volatility: number[];
}

export const analyzeTrends = (
  numbers: number[][],
  dates: Date[]
): TrendAnalysis => {
  return {
    longTermTrends: analyzeLongTermTrends(numbers),
    seasonalPatterns: analyzeSeasonalPatterns(numbers, dates),
    cyclicalPatterns: analyzeCyclicalPatterns(numbers),
    volatility: calculateVolatility(numbers)
  };
};

const analyzeLongTermTrends = (numbers: number[][]): {
  increasing: number[];
  decreasing: number[];
  stable: number[];
} => {
  const trends = {
    increasing: [] as number[],
    decreasing: [] as number[],
    stable: [] as number[]
  };

  const windowSize = Math.min(50, Math.floor(numbers.length / 2));
  const recentNumbers = numbers.slice(-windowSize);
  const frequency: { [key: number]: number[] } = {};

  recentNumbers.forEach((game, idx) => {
    game.forEach(num => {
      if (!frequency[num]) frequency[num] = [];
      frequency[num].push(idx);
    });
  });

  Object.entries(frequency).forEach(([num, occurrences]) => {
    const number = parseInt(num);
    const trend = calculateTrendStrength(occurrences);
    
    if (trend > 0.3) {
      trends.increasing.push(number);
    } else if (trend < -0.3) {
      trends.decreasing.push(number);
    } else {
      trends.stable.push(number);
    }
  });

  return trends;
};

const calculateTrendStrength = (occurrences: number[]): number => {
  if (occurrences.length < 2) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = occurrences.length;

  occurrences.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
};

const analyzeSeasonalPatterns = (
  numbers: number[][],
  dates: Date[]
): { monthly: number[]; quarterly: number[]; yearly: number[] } => {
  const monthly = Array(12).fill(0);
  const quarterly = Array(4).fill(0);
  const yearly = Array(Math.min(10, Math.floor(numbers.length / 365))).fill(0);

  dates.forEach((date, idx) => {
    const month = date.getMonth();
    const quarter = Math.floor(month / 3);
    const year = date.getFullYear() - dates[0].getFullYear();

    if (year < yearly.length) {
      numbers[idx].forEach(num => {
        monthly[month]++;
        quarterly[quarter]++;
        yearly[year]++;
      });
    }
  });

  return {
    monthly,
    quarterly,
    yearly
  };
};

const analyzeCyclicalPatterns = (numbers: number[][]): number[][] => {
  const patterns: number[][] = [];
  const windowSizes = [5, 10, 20];

  windowSizes.forEach(size => {
    const pattern = findCyclicalPattern(numbers, size);
    if (pattern.length > 0) {
      patterns.push(pattern);
    }
  });

  return patterns;
};

const findCyclicalPattern = (numbers: number[][], windowSize: number): number[] => {
  const pattern: number[] = [];
  const frequency: { [key: string]: number } = {};

  for (let i = 0; i <= numbers.length - windowSize; i++) {
    const window = numbers.slice(i, i + windowSize);
    const key = window.map(nums => nums.join(',')).join('|');
    frequency[key] = (frequency[key] || 0) + 1;
  }

  const mostFrequent = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)[0];

  if (mostFrequent && mostFrequent[1] > 1) {
    pattern.push(...mostFrequent[0]
      .split('|')[0]
      .split(',')
      .map(Number));
  }

  return pattern;
};

const calculateVolatility = (numbers: number[][]): number[] => {
  const volatility: number[] = [];
  const windowSize = 10;

  for (let i = windowSize; i < numbers.length; i++) {
    const window = numbers.slice(i - windowSize, i);
    const changes = window.map((nums, idx) => {
      if (idx === 0) return 0;
      const prevNums = new Set(window[idx - 1]);
      return nums.filter(n => !prevNums.has(n)).length;
    });

    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    volatility.push(avgChange);
  }

  return volatility;
};