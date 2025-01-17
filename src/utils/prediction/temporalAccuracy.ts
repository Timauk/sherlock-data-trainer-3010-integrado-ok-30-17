export class TemporalAccuracyTracker {
  private static instance: TemporalAccuracyTracker;
  private accuracyHistory: number[] = [];
  
  private constructor() {}
  
  public static getInstance(): TemporalAccuracyTracker {
    if (!TemporalAccuracyTracker.instance) {
      TemporalAccuracyTracker.instance = new TemporalAccuracyTracker();
    }
    return TemporalAccuracyTracker.instance;
  }

  public trackAccuracy(accuracy: number): void {
    this.accuracyHistory.push(accuracy);
    if (this.accuracyHistory.length > 100) {
      this.accuracyHistory.shift();
    }
  }

  public getAverageAccuracy(): number {
    if (this.accuracyHistory.length === 0) return 0;
    const sum = this.accuracyHistory.reduce((a, b) => a + b, 0);
    return sum / this.accuracyHistory.length;
  }
}

export const temporalAccuracyTracker = TemporalAccuracyTracker.getInstance();