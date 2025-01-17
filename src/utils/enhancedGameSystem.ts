import { Player } from '@/types/gameTypes';

export class EnhancedGameSystem {
  private static instance: EnhancedGameSystem;
  private metrics: GameMetrics = {
    accuracy: 0,
    confidence: 0,
    processingSpeed: 0,
    memoryUsage: 0
  };

  private constructor() {}

  public static getInstance(): EnhancedGameSystem {
    if (!EnhancedGameSystem.instance) {
      EnhancedGameSystem.instance = new EnhancedGameSystem();
    }
    return EnhancedGameSystem.instance;
  }

  public updateMetrics(metrics: Partial<GameMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };
  }

  public getMetrics(): GameMetrics {
    return this.metrics;
  }

  public processGameState(players: Player[]): void {
    const scores = players.map(player => player.score);
    const maxScore = Math.max(...scores);
    
    this.updateMetrics({
      accuracy: maxScore / 100,
      confidence: scores.length > 0 ? 0.8 : 0
    });
  }
}

interface GameMetrics {
  accuracy: number;
  confidence: number;
  processingSpeed: number;
  memoryUsage: number;
}

export const enhancedGameSystem = EnhancedGameSystem.getInstance();