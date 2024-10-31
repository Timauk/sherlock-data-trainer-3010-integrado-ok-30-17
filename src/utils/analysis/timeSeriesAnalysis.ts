interface ArimaConfig {
  p: number; // ordem do componente AR
  d: number; // ordem de diferenciação
  q: number; // ordem do componente MA
}

export class TimeSeriesAnalysis {
  private data: number[][];
  private config: ArimaConfig;

  constructor(data: number[][], config: ArimaConfig = { p: 1, d: 1, q: 1 }) {
    this.data = data;
    this.config = config;
  }

  // Calcula diferenças para tornar a série estacionária
  private difference(series: number[], order: number = 1): number[] {
    if (order === 0) return series;
    
    const diffed = [];
    for (let i = 1; i < series.length; i++) {
      diffed.push(series[i] - series[i - 1]);
    }
    
    return this.difference(diffed, order - 1);
  }

  // Calcula autocorrelação para um lag específico
  private autocorrelation(series: number[], lag: number): number {
    const n = series.length;
    const mean = series.reduce((a, b) => a + b) / n;
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
      numerator += (series[i] - mean) * (series[i + lag] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(series[i] - mean, 2);
    }

    return numerator / denominator;
  }

  // Implementa o modelo AR (AutoRegressivo)
  private autoregressive(series: number[]): number[] {
    const predictions: number[] = [];
    const p = this.config.p;
    
    for (let i = p; i < series.length; i++) {
      let prediction = 0;
      for (let j = 1; j <= p; j++) {
        prediction += series[i - j] * this.autocorrelation(series, j);
      }
      predictions.push(prediction);
    }
    
    return predictions;
  }

  // Analisa padrões temporais nos números
  public analyzeNumbers(): number[] {
    // Transforma matriz de números em série temporal
    const timeSeries = this.data.map(draw => 
      draw.reduce((acc, num) => acc + num, 0) / draw.length
    );

    // Aplica diferenciação conforme configurado
    const stationarySeries = this.difference(timeSeries, this.config.d);

    // Aplica modelo AR
    const predictions = this.autoregressive(stationarySeries);

    // Retorna os 15 números mais prováveis baseado na análise
    return this.transformPredictionsToNumbers(predictions);
  }

  // Transforma previsões em números jogáveis
  private transformPredictionsToNumbers(predictions: number[]): number[] {
    const frequencyMap = new Map<number, number>();
    
    // Analisa frequência dos números nos dados originais
    this.data.forEach(draw => {
      draw.forEach(num => {
        frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
      });
    });

    // Combina frequência histórica com previsões ARIMA
    const weightedNumbers = Array.from({ length: 25 }, (_, i) => i + 1)
      .map(num => ({
        number: num,
        weight: (frequencyMap.get(num) || 0) / this.data.length +
                predictions[predictions.length - 1] * Math.random()
      }));

    // Retorna os 15 números com maior peso
    return weightedNumbers
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15)
      .map(n => n.number)
      .sort((a, b) => a - b);
  }
}