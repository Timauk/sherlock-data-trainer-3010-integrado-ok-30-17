export class TimeSeriesAnalysis {
  constructor(private historicalData: number[][]) {}

  analyzeNumbers(): number[] {
    if (!this.historicalData.length) {
      return [];
    }

    const frequencies = this.calculateFrequencies();
    const trends = this.analyzeTrends();
    
    return this.generatePredictions(frequencies, trends);
  }

  private calculateFrequencies(): Map<number, number> {
    const frequencies = new Map<number, number>();
    
    this.historicalData.forEach(numbers => {
      numbers.forEach(num => {
        frequencies.set(num, (frequencies.get(num) || 0) + 1);
      });
    });
    
    return frequencies;
  }

  private analyzeTrends(): number[] {
    const recentGames = this.historicalData.slice(-10);
    const trends: number[] = [];
    
    recentGames.forEach(numbers => {
      const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      trends.push(avg);
    });
    
    return trends;
  }

  private generatePredictions(
    frequencies: Map<number, number>,
    trends: number[]
  ): number[] {
    const weightedNumbers = Array.from({ length: 25 }, (_, i) => i + 1)
      .map(num => ({
        number: num,
        weight: (frequencies.get(num) || 0) / this.historicalData.length +
                this.calculateTrendWeight(num, trends)
      }));

    return weightedNumbers
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15)
      .map(n => n.number)
      .sort((a, b) => a - b);
  }

  private calculateTrendWeight(num: number, trends: number[]): number {
    const trendAvg = trends.reduce((a, b) => a + b, 0) / trends.length;
    return Math.abs(num - trendAvg) / 25;
  }
}