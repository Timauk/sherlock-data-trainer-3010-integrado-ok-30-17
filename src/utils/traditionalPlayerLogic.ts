import { Player } from '@/types/gameTypes';

interface FrequencyGroups {
  high: number[];
  medium: number[];
  low: number[];
}

export class TraditionalPlayer {
  private static instance: TraditionalPlayer;
  private gameCount: number = 0;
  private lastResults: number[][] = [];
  private currentGames: number[][] = [];
  
  private constructor() {}
  
  static getInstance(): TraditionalPlayer {
    if (!TraditionalPlayer.instance) {
      TraditionalPlayer.instance = new TraditionalPlayer();
    }
    return TraditionalPlayer.instance;
  }

  private getFrequencyGroups(numbers: number[][]): FrequencyGroups {
    const frequency: { [key: number]: number } = {};
    for (let i = 1; i <= 25; i++) {
      frequency[i] = 0;
    }

    numbers.forEach(game => {
      game.forEach(num => {
        frequency[num]++;
      });
    });

    const sorted = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .map(([num]) => parseInt(num));

    const third = Math.floor(sorted.length / 3);
    
    return {
      high: sorted.slice(0, third),
      medium: sorted.slice(third, third * 2),
      low: sorted.slice(third * 2)
    };
  }

  private generateFirstTenGames(lastGame: number[], penultimateGame: number[]): number[][] {
    const games: number[][] = [];
    
    // Generate first 10 games based on last and penultimate games
    for (let i = 0; i < 10; i++) {
      const numbersToKeep = 15 - i - 1; // Start with 14 numbers and decrease
      const numbersFromLast = lastGame.slice(0, numbersToKeep);
      
      // Get numbers that didn't appear in penultimate game
      const notInPenultimate = lastGame.filter(n => !penultimateGame.includes(n));
      const additionalCount = i + 1; // Increases from 1 to 10
      const additionalNumbers = notInPenultimate.slice(0, Math.min(additionalCount, notInPenultimate.length));
      
      const game = [...new Set([...numbersFromLast, ...additionalNumbers])];
      
      // If we still need more numbers, add random ones
      while (game.length < 15) {
        const randomNum = Math.floor(Math.random() * 25) + 1;
        if (!game.includes(randomNum)) {
          game.push(randomNum);
        }
      }
      
      games.push(game.sort((a, b) => a - b));
    }
    
    return games;
  }

  private generateFrequencyBasedGames(frequencyGroups: FrequencyGroups): number[][] {
    const configurations = [
      { high: 7, medium: 5, low: 3 },  // Game 1
      { high: 6, medium: 6, low: 3 },  // Game 2
      { high: 5, medium: 7, low: 3 },  // Game 3
      { high: 8, medium: 4, low: 3 },  // Game 4
      { high: 7, medium: 6, low: 2 },  // Game 5
      { high: 6, medium: 6, low: 3 },  // Game 6
      { high: 7, medium: 5, low: 3 },  // Game 7
      { high: 6, medium: 7, low: 2 },  // Game 8
      { high: 8, medium: 5, low: 2 },  // Game 9
      { high: 5, medium: 5, low: 5 }   // Game 10 (balanced random)
    ];

    return configurations.map(config => {
      const game: number[] = [];
      
      const pickRandom = (arr: number[], count: number) => {
        const result: number[] = [];
        const copy = [...arr];
        while (result.length < count && copy.length > 0) {
          const index = Math.floor(Math.random() * copy.length);
          result.push(copy[index]);
          copy.splice(index, 1);
        }
        return result;
      };

      game.push(...pickRandom(frequencyGroups.high, config.high));
      game.push(...pickRandom(frequencyGroups.medium, config.medium));
      game.push(...pickRandom(frequencyGroups.low, config.low));

      return game.sort((a, b) => a - b);
    });
  }

  private generateAllGames(lastGame: number[], penultimateGame: number[], frequencyGroups: FrequencyGroups): number[][] {
    const firstTenGames = this.generateFirstTenGames(lastGame, penultimateGame);
    const frequencyGames = this.generateFrequencyBasedGames(frequencyGroups);
    
    return [...firstTenGames, ...frequencyGames];
  }

  public makePlay(currentGame: number[]): number[] | number[][] {
    if (this.gameCount < 10) {
      this.lastResults.push(currentGame);
      this.gameCount++;
      return [];  // Don't play in first 10 rounds
    }

    this.lastResults.push(currentGame);
    if (this.lastResults.length > 10) {
      this.lastResults = this.lastResults.slice(-10);
    }

    const frequencyGroups = this.getFrequencyGroups(this.lastResults);
    const lastGame = this.lastResults[this.lastResults.length - 1];
    const penultimateGame = this.lastResults[this.lastResults.length - 2];

    // Generate all 20 games at once
    this.currentGames = this.generateAllGames(lastGame, penultimateGame, frequencyGroups);
    this.gameCount++;
    
    // Return all 20 games
    return this.currentGames;
  }

  public getCurrentGames(): number[][] {
    return this.currentGames;
  }

  public getGameCount(): number {
    return this.gameCount;
  }

  public reset(): void {
    this.gameCount = 0;
    this.lastResults = [];
    this.currentGames = [];
  }
}

export const traditionalPlayer = TraditionalPlayer.getInstance();