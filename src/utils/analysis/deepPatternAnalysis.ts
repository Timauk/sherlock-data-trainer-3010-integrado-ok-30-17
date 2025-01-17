import { Player } from '@/types/gameTypes';

export class DeepPatternAnalyzer {
  analyzePatterns(players: Player[]): number[] {
    return players.map(p => p.score);
  }

  detectAnomalies(data: number[]): number[] {
    return data.filter(value => value > 0);
  }
}

export const deepPatternAnalyzer = new DeepPatternAnalyzer();