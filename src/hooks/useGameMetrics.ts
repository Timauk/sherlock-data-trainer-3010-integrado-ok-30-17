import { useState } from 'react';
import { ValidationMetrics } from '@/utils/aiValidation';
import { TimeSeriesAnalysis, CorrelationAnalysis } from '@/utils/predictiveAnalysis';

export const useGameMetrics = () => {
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
  });
  const [validationMetrics, setValidationMetrics] = useState<ValidationMetrics | null>(null);
  const [timeSeriesAnalysis, setTimeSeriesAnalysis] = useState<TimeSeriesAnalysis | null>(null);
  const [correlationAnalysis, setCorrelationAnalysis] = useState<CorrelationAnalysis | null>(null);

  return {
    modelMetrics,
    setModelMetrics,
    validationMetrics,
    setValidationMetrics,
    timeSeriesAnalysis,
    setTimeSeriesAnalysis,
    correlationAnalysis,
    setCorrelationAnalysis,
  };
};