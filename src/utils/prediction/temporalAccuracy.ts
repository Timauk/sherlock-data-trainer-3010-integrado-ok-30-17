interface TemporalAccuracyData {
  timestamp: number;
  accuracy: number;
  predictions: number;
}

class TemporalAccuracyTracker {
  private static instance: TemporalAccuracyTracker;
  private accuracyData: TemporalAccuracyData[] = [];
  private readonly maxDataPoints = 1000;

  private constructor() {}

  static getInstance(): TemporalAccuracyTracker {
    if (!TemporalAccuracyTracker.instance) {
      TemporalAccuracyTracker.instance = new TemporalAccuracyTracker();
    }
    return TemporalAccuracyTracker.instance;
  }

  recordAccuracy(matches: number, totalPredictions: number): void {
    const accuracy = matches / totalPredictions;
    
    this.accuracyData.push({
      timestamp: Date.now(),
      accuracy,
      predictions: totalPredictions
    });

    if (this.accuracyData.length > this.maxDataPoints) {
      this.accuracyData = this.accuracyData.slice(-this.maxDataPoints);
    }
  }

  getAccuracyTrend(timeWindowHours: number = 24): {
    hourly: number[];
    daily: number[];
    weekly: number[];
  } {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;

    const hourlyData = this.aggregateData(now - dayMs, hourMs);
    const dailyData = this.aggregateData(now - weekMs, dayMs);
    const weeklyData = this.aggregateData(now - (4 * weekMs), weekMs);

    return {
      hourly: hourlyData,
      daily: dailyData,
      weekly: weeklyData
    };
  }

  private aggregateData(startTime: number, interval: number): number[] {
    const relevantData = this.accuracyData.filter(d => d.timestamp >= startTime);
    const intervals: number[] = [];

    for (let time = startTime; time <= Date.now(); time += interval) {
      const periodData = relevantData.filter(
        d => d.timestamp >= time && d.timestamp < time + interval
      );

      if (periodData.length > 0) {
        const avgAccuracy = periodData.reduce((sum, d) => sum + d.accuracy, 0) / periodData.length;
        intervals.push(avgAccuracy);
      } else {
        intervals.push(0);
      }
    }

    return intervals;
  }
}

export const temporalAccuracyTracker = TemporalAccuracyTracker.getInstance();