import { systemLogger } from '../logging/systemLogger';

interface Pattern {
  sequence: number[];
  frequency: number;
  confidence: number;
}

class DeepPatternAnalyzer {
  private patterns: Pattern[] = [];
  private readonly minPatternLength = 2;
  private readonly maxPatternLength = 6;

  analyzePatterns(data: number[][]): Pattern[] {
    this.patterns = [];
    
    for (let length = this.minPatternLength; length <= this.maxPatternLength; length++) {
      this.findPatternsOfLength(data, length);
    }

    return this.patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private findPatternsOfLength(data: number[][], length: number): void {
    const sequences: { [key: string]: number } = {};
    
    data.forEach(row => {
      for (let i = 0; i <= row.length - length; i++) {
        const sequence = row.slice(i, i + length);
        const key = sequence.join(',');
        sequences[key] = (sequences[key] || 0) + 1;
      }
    });

    Object.entries(sequences).forEach(([key, frequency]) => {
      const sequence = key.split(',').map(Number);
      const confidence = frequency / data.length;
      
      if (confidence > 0.1) {
        this.patterns.push({
          sequence,
          frequency,
          confidence
        });
      }
    });
  }

  getPredictions(): number[] {
    const highConfidencePatterns = this.patterns
      .filter(p => p.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence);

    if (highConfidencePatterns.length === 0) {
      return [];
    }

    return highConfidencePatterns[0].sequence;
  }

  getPatternMetrics(): { totalPatterns: number; averageConfidence: number } {
    const totalPatterns = this.patterns.length;
    const averageConfidence = this.patterns.reduce((acc, p) => acc + p.confidence, 0) / totalPatterns;

    return {
      totalPatterns,
      averageConfidence
    };
  }
}

export const deepPatternAnalyzer = new DeepPatternAnalyzer();