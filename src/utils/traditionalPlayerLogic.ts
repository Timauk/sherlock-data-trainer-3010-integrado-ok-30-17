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
    
    for (let i = 0; i < 10; i++) {
      const numbersFromLast = lastGame.slice(0, 14 - i);
      const notInPenultimate = lastGame.filter(n => !penultimateGame.includes(n));
      const additionalNumbers = notInPenultimate.slice(0, i + 1);
      
      const game = [...new Set([...numbersFromLast, ...additionalNumbers])];
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
      { high: 7, medium: 5, low: 3 },
      { high: 6, medium: 6, low: 3 },
      { high: 5, medium: 7, low: 3 },
      { high: 8, medium: 4, low: 3 },
      { high: 7, medium: 6, low: 2 },
      { high: 6, medium: 6, low: 3 },
      { high: 7, medium: 5, low: 3 },
      { high: 6, medium: 7, low: 2 },
      { high: 8, medium: 5, low: 2 },
      { high: 5, medium: 5, low: 5 }  // Last game more random
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

  public makePlay(currentGame: number[]): number[] | null {
    if (this.gameCount < 10) {
      this.lastResults.push(currentGame);
      this.gameCount++;
      return null;  // Don't play in first 10 rounds
    }

    this.lastResults.push(currentGame);
    if (this.lastResults.length > 10) {
      this.lastResults = this.lastResults.slice(-10);
    }

    const frequencyGroups = this.getFrequencyGroups(this.lastResults);
    const lastGame = this.lastResults[this.lastResults.length - 1];
    const penultimateGame = this.lastResults[this.lastResults.length - 2];

    const firstTenGames = this.generateFirstTenGames(lastGame, penultimateGame);
    const frequencyGames = this.generateFrequencyBasedGames(frequencyGroups);

    // Return one game at a time, cycling through all 20 games
    const gameIndex = (this.gameCount - 10) % 20;
    const selectedGame = gameIndex < 10 ? 
      firstTenGames[gameIndex] : 
      frequencyGames[gameIndex - 10];

    this.gameCount++;
    return selectedGame;
  }

  public getGameCount(): number {
    return this.gameCount;
  }

  public reset(): void {
    this.gameCount = 0;
    this.lastResults = [];
  }
}

export const traditionalPlayer = TraditionalPlayer.getInstance();