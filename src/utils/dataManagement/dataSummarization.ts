import { differenceInDays } from 'date-fns';

export interface DataSummary {
  period: string;
  frequencies: { [key: number]: number };
  patterns: {
    consecutive: number;
    evenOdd: number;
    sumRange: number[];
  };
  seasonalTrends: {
    monthly: number[];
    weekly: number[];
  };
}

export const summarizeHistoricalData = (
  numbers: number[][],
  dates: Date[]
): DataSummary[] => {
  const summaries: DataSummary[] = [];
  const periodLength = 50; // Agrupa dados em períodos de 50 jogos

  for (let i = 0; i < numbers.length; i += periodLength) {
    const periodNumbers = numbers.slice(i, i + periodLength);
    const periodDates = dates.slice(i, i + periodLength);

    const frequencies: { [key: number]: number } = {};
    let consecutive = 0;
    let evenCount = 0;
    const sumRange: number[] = [];

    periodNumbers.forEach(draw => {
      // Contagem de frequências
      draw.forEach(num => {
        frequencies[num] = (frequencies[num] || 0) + 1;
      });

      // Análise de consecutivos
      for (let j = 1; j < draw.length; j++) {
        if (draw[j] === draw[j-1] + 1) consecutive++;
      }

      // Contagem par/ímpar
      evenCount += draw.filter(n => n % 2 === 0).length;

      // Soma total
      sumRange.push(draw.reduce((a, b) => a + b, 0));
    });

    // Análise sazonal
    const monthlyTrends = Array(12).fill(0);
    const weeklyTrends = Array(7).fill(0);

    periodDates.forEach((date, idx) => {
      monthlyTrends[date.getMonth()]++;
      weeklyTrends[date.getDay()]++;
    });

    summaries.push({
      period: `${periodDates[0].toISOString()} - ${periodDates[periodDates.length-1].toISOString()}`,
      frequencies,
      patterns: {
        consecutive,
        evenOdd: evenCount / (periodNumbers.length * 15),
        sumRange
      },
      seasonalTrends: {
        monthly: monthlyTrends,
        weekly: weeklyTrends
      }
    });
  }

  return summaries;
};