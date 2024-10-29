interface PredictionFeedback {
  timestamp: number;
  prediction: number[];
  actual: number[];
  matches: number;
  confidence: number;
}

class FeedbackSystem {
  private static instance: FeedbackSystem;
  private feedback: PredictionFeedback[] = [];
  private readonly maxStoredFeedback = 1000;

  private constructor() {}

  static getInstance(): FeedbackSystem {
    if (!FeedbackSystem.instance) {
      FeedbackSystem.instance = new FeedbackSystem();
    }
    return FeedbackSystem.instance;
  }

  addFeedback(prediction: number[], actual: number[], confidence: number): void {
    const matches = prediction.filter(num => actual.includes(num)).length;
    
    this.feedback.push({
      timestamp: Date.now(),
      prediction,
      actual,
      matches,
      confidence
    });

    if (this.feedback.length > this.maxStoredFeedback) {
      this.feedback = this.feedback.slice(-this.maxStoredFeedback);
    }
  }

  getAccuracyTrend(timeWindowHours: number = 24): number[] {
    const timeThreshold = Date.now() - (timeWindowHours * 60 * 60 * 1000);
    return this.feedback
      .filter(f => f.timestamp > timeThreshold)
      .map(f => f.matches / 15);
  }

  getConfidenceCorrelation(): number {
    if (this.feedback.length < 2) return 0;
    
    const confidences = this.feedback.map(f => f.confidence);
    const accuracies = this.feedback.map(f => f.matches / 15);
    
    return calculateCorrelation(confidences, accuracies);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sum1 = x.reduce((a, b) => a + b);
    const sum2 = y.reduce((a, b) => a + b);
    const sum1Sq = x.reduce((a, b) => a + b * b);
    const sum2Sq = y.reduce((a, b) => a + b * b);
    const pSum = x.map((x, i) => x * y[i]).reduce((a, b) => a + b);
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    return num / den;
  }
}

export const feedbackSystem = FeedbackSystem.getInstance();