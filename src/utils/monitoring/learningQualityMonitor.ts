import { Player } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';

interface LearningMetrics {
  randomnessScore: number;
  patternRecognitionScore: number;
  predictionQuality: number;
  isLearningEffective: boolean;
}

class LearningQualityMonitor {
  private static instance: LearningQualityMonitor;
  private readonly randomThreshold = 0.4; // 40% de similaridade com random é o máximo aceitável
  private readonly qualityThreshold = 0.6; // Mínimo de 60% de qualidade nas previsões

  private constructor() {}

  static getInstance(): LearningQualityMonitor {
    if (!LearningQualityMonitor.instance) {
      LearningQualityMonitor.instance = new LearningQualityMonitor();
    }
    return LearningQualityMonitor.instance;
  }

  analyzePlayerLearning(
    player: Player,
    historicalData: number[][],
    recentPredictions: number[][]
  ): LearningMetrics {
    const randomnessScore = this.calculateRandomnessScore(recentPredictions);
    const patternScore = this.analyzePatternRecognition(player, historicalData);
    const predictionQuality = this.calculatePredictionQuality(player);

    const isLearningEffective = this.evaluateLearningEffectiveness(
      randomnessScore,
      patternScore,
      predictionQuality
    );

    if (!isLearningEffective) {
      systemLogger.log('player', `Alerta: Jogador ${player.id} pode estar com aprendizado comprometido`, {
        randomnessScore,
        patternScore,
        predictionQuality
      });
    }

    return {
      randomnessScore,
      patternRecognitionScore: patternScore,
      predictionQuality,
      isLearningEffective
    };
  }

  private calculateRandomnessScore(predictions: number[][]): number {
    if (!predictions.length) return 1;

    // Verifica quão diferentes são as previsões entre si
    let similarityCount = 0;
    for (let i = 0; i < predictions.length - 1; i++) {
      const currentPred = new Set(predictions[i]);
      const nextPred = predictions[i + 1];
      const matches = nextPred.filter(num => currentPred.has(num)).length;
      similarityCount += matches / 15;
    }

    // Retorna um score onde 1 é totalmente aleatório e 0 é totalmente padronizado
    return similarityCount / (predictions.length - 1 || 1);
  }

  private analyzePatternRecognition(player: Player, historicalData: number[][]): number {
    if (!player.predictions.length || !historicalData.length) return 0;

    // Analisa se as previsões seguem padrões dos dados históricos
    const historicalPatterns = this.extractPatterns(historicalData);
    const predictionPatterns = this.extractPatterns([player.predictions[player.predictions.length - 1]]);

    return this.comparePatterns(historicalPatterns, predictionPatterns);
  }

  private extractPatterns(numbers: number[][]): Set<string> {
    const patterns = new Set<string>();
    
    numbers.forEach(game => {
      // Padrões de números consecutivos
      for (let i = 0; i < game.length - 1; i++) {
        if (game[i + 1] - game[i] === 1) {
          patterns.add(`consecutive_${game[i]}_${game[i + 1]}`);
        }
      }

      // Padrões de paridade
      const evenCount = game.filter(n => n % 2 === 0).length;
      patterns.add(`evenOdd_${evenCount}`);

      // Padrões de soma
      const sum = game.reduce((a, b) => a + b, 0);
      patterns.add(`sum_${Math.floor(sum / 50) * 50}`);
    });

    return patterns;
  }

  private comparePatterns(historical: Set<string>, prediction: Set<string>): number {
    if (prediction.size === 0) return 0;
    
    let matches = 0;
    prediction.forEach(pattern => {
      if (historical.has(pattern)) matches++;
    });

    return matches / prediction.size;
  }

  private calculatePredictionQuality(player: Player): number {
    if (!player.predictions.length) return 0;

    // Usa o histórico de fitness do jogador para avaliar a qualidade
    const recentFitness = player.fitness;
    const baselineQuality = 0.2; // 20% é o mínimo esperado por chance
    
    return Math.max(0, (recentFitness - baselineQuality) / (1 - baselineQuality));
  }

  private evaluateLearningEffectiveness(
    randomness: number,
    patternRecognition: number,
    quality: number
  ): boolean {
    // Critérios para determinar se o aprendizado é efetivo
    const isNotTooRandom = randomness <= this.randomThreshold;
    const hasPatternRecognition = patternRecognition >= this.qualityThreshold;
    const hasQuality = quality >= this.qualityThreshold;

    return isNotTooRandom && (hasPatternRecognition || hasQuality);
  }
}

export const learningQualityMonitor = LearningQualityMonitor.getInstance();