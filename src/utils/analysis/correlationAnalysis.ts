export interface CorrelationAnalysis {
  numberCorrelations: Map<number, number[]>;
  sequentialPatterns: number[][];
  timeBasedPatterns: {
    dayOfWeek: number[];
    monthOfYear: number[];
  };
}

export const analyzeCorrelations = (
  numbers: number[][],
  dates: Date[]
): CorrelationAnalysis => {
  const numberCorrelations = analyzeNumberCorrelations(numbers);
  const sequentialPatterns = findSequentialPatterns(numbers);
  const timeBasedPatterns = analyzeTimeBasedPatterns(numbers, dates);

  return {
    numberCorrelations,
    sequentialPatterns,
    timeBasedPatterns
  };
};

const analyzeNumberCorrelations = (numbers: number[][]): Map<number, number[]> => {
  const correlations = new Map<number, number[]>();

  numbers.forEach(game => {
    game.forEach(num1 => {
      game.forEach(num2 => {
        if (num1 !== num2) {
          if (!correlations.has(num1)) {
            correlations.set(num1, []);
          }
          const currentCorrelations = correlations.get(num1);
          if (currentCorrelations) {
            currentCorrelations.push(num2);
          }
        }
      });
    });
  });

  return correlations;
};

const findSequentialPatterns = (numbers: number[][]): number[][] => {
  const patterns: number[][] = [];
  const minPatternLength = 3;

  for (let i = 0; i < numbers.length - minPatternLength; i++) {
    const sequence: number[] = [];
    for (let j = 0; j < minPatternLength; j++) {
      sequence.push(...numbers[i + j]);
    }
    
    const uniqueSequence = Array.from(new Set(sequence));
    if (uniqueSequence.length <= minPatternLength * 5) {
      patterns.push(uniqueSequence);
    }
  }

  return patterns;
};

const analyzeTimeBasedPatterns = (
  numbers: number[][],
  dates: Date[]
): { dayOfWeek: number[], monthOfYear: number[] } => {
  const dayFrequency = Array(7).fill(0);
  const monthFrequency = Array(12).fill(0);

  dates.forEach((date, idx) => {
    const day = date.getDay();
    const month = date.getMonth();
    
    numbers[idx].forEach(() => {
      dayFrequency[day]++;
      monthFrequency[month]++;
    });
  });

  return {
    dayOfWeek: dayFrequency,
    monthOfYear: monthFrequency
  };
};