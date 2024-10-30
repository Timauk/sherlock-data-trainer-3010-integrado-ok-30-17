import { differenceInDays } from 'date-fns';

export interface PatternAnalysis {
  repeatingSequences: number[][];
  hotNumbers: number[];
  coldNumbers: number[];
  trends: {
    increasing: number[];
    decreasing: number[];
  };
}

export const analyzePatterns = (numbers: number[][]): PatternAnalysis => {
  const sequences = findRepeatingSequences(numbers);
  const { hot, cold } = analyzeHotColdNumbers(numbers);
  const trends = analyzeTrends(numbers);

  return {
    repeatingSequences: sequences,
    hotNumbers: hot,
    coldNumbers: cold,
    trends
  };
};

const findRepeatingSequences = (numbers: number[][]): number[][] => {
  const sequences: number[][] = [];
  const minSequenceLength = 3;

  for (let i = 0; i < numbers.length - minSequenceLength; i++) {
    for (let j = i + 1; j < numbers.length - minSequenceLength + 1; j++) {
      const sequence = findCommonSequence(numbers[i], numbers[j]);
      if (sequence.length >= minSequenceLength) {
        sequences.push(sequence);
      }
    }
  }

  return sequences;
};

const findCommonSequence = (arr1: number[], arr2: number[]): number[] => {
  const sequence: number[] = [];
  let i = 0, j = 0;

  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] === arr2[j]) {
      sequence.push(arr1[i]);
      i++;
      j++;
    } else if (arr1[i] < arr2[j]) {
      i++;
    } else {
      j++;
    }
  }

  return sequence;
};

const analyzeHotColdNumbers = (numbers: number[][]): { hot: number[], cold: number[] } => {
  const frequency: { [key: number]: number } = {};
  const recentGames = numbers.slice(-30);

  recentGames.forEach(game => {
    game.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1;
    });
  });

  const entries = Object.entries(frequency).map(([num, freq]) => ({
    number: parseInt(num),
    frequency: freq
  }));

  const sortedEntries = entries.sort((a, b) => b.frequency - a.frequency);
  const hot = sortedEntries.slice(0, 5).map(e => e.number);
  const cold = sortedEntries.slice(-5).map(e => e.number);

  return { hot, cold };
};

const analyzeTrends = (numbers: number[][]): { increasing: number[], decreasing: number[] } => {
  const trends = {
    increasing: [] as number[],
    decreasing: [] as number[]
  };

  const recentGames = numbers.slice(-10);
  const frequency: { [key: number]: number[] } = {};

  recentGames.forEach((game, idx) => {
    game.forEach(num => {
      if (!frequency[num]) frequency[num] = [];
      frequency[num].push(idx);
    });
  });

  Object.entries(frequency).forEach(([num, occurrences]) => {
    const number = parseInt(num);
    const trend = calculateTrend(occurrences);
    
    if (trend > 0.5) {
      trends.increasing.push(number);
    } else if (trend < -0.5) {
      trends.decreasing.push(number);
    }
  });

  return trends;
};

const calculateTrend = (occurrences: number[]): number => {
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