import { getDay } from 'date-fns';
import { getLunarPhase } from '../lunarCalculations';

type WeekDayLunarPattern = {
  [key: string]: {
    [key: string]: number[];
  };
};

export const analyzeWeekDayLunarPatterns = (dates: Date[], numbers: number[][]): WeekDayLunarPattern => {
  const patterns: WeekDayLunarPattern = {
    'Domingo': { Nova: [], Crescente: [], Cheia: [], Minguante: [] },
    'Segunda': { Nova: [], Crescente: [], Cheia: [], Minguante: [] },
    'Terça': { Nova: [], Crescente: [], Cheia: [], Minguante: [] },
    'Quarta': { Nova: [], Crescente: [], Cheia: [], Minguante: [] },
    'Quinta': { Nova: [], Crescente: [], Cheia: [], Minguante: [] },
    'Sexta': { Nova: [], Crescente: [], Cheia: [], Minguante: [] },
    'Sábado': { Nova: [], Crescente: [], Cheia: [], Minguante: [] }
  };

  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  dates.forEach((date, index) => {
    const weekDay = weekDays[getDay(date)];
    const lunarPhase = getLunarPhase(date);
    const numbers_drawn = numbers[index];
    
    if (!patterns[weekDay][lunarPhase]) {
      patterns[weekDay][lunarPhase] = [];
    }
    patterns[weekDay][lunarPhase].push(...numbers_drawn);
  });

  return patterns;
};

export const analyzeBiweeklyLunarPatterns = (dates: Date[], numbers: number[][]) => {
  const biweeklyPatterns: {
    firstHalf: WeekDayLunarPattern;
    secondHalf: WeekDayLunarPattern;
  } = {
    firstHalf: {},
    secondHalf: {}
  };

  dates.forEach((date, index) => {
    const dayOfMonth = date.getDate();
    const isFirstHalf = dayOfMonth <= 15;
    const weekDay = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][getDay(date)];
    const lunarPhase = getLunarPhase(date);
    
    const targetPattern = isFirstHalf ? biweeklyPatterns.firstHalf : biweeklyPatterns.secondHalf;
    
    if (!targetPattern[weekDay]) {
      targetPattern[weekDay] = {};
    }
    if (!targetPattern[weekDay][lunarPhase]) {
      targetPattern[weekDay][lunarPhase] = [];
    }
    
    targetPattern[weekDay][lunarPhase].push(...numbers[index]);
  });

  return biweeklyPatterns;
};

export const calculateLunarWeekDayWeight = (
  weekDay: number,
  lunarPhase: string,
  patterns: WeekDayLunarPattern
): number => {
  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const weekDayName = weekDays[weekDay];
  
  if (!patterns[weekDayName] || !patterns[weekDayName][lunarPhase]) {
    return 1.0;
  }

  const frequency = patterns[weekDayName][lunarPhase].length;
  const maxFrequency = Math.max(...Object.values(patterns[weekDayName]).map(arr => arr.length));
  
  return 0.8 + (frequency / maxFrequency) * 0.4;
};