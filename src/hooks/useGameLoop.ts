import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { systemLogger } from '@/utils/logging/systemLogger';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';

export const useGameLoop = (initialState = {
  isPlaying: false,
  generation: 0,
  frequencyData: {} as Record<string, number[]>
}) => {
  const [state, setState] = useState(initialState);
  const { toast } = useToast();

  const updateFrequencyData = useCallback((newData: Record<string, number[]>) => {
    setState(prev => ({
      ...prev,
      frequencyData: newData
    }));
  }, []);

  useEffect(() => {
    if (state.isPlaying) {
      const interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          generation: prev.generation + 1
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.isPlaying]);

  return {
    state,
    updateFrequencyData,
    setState
  };
};