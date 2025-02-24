import { useState, useEffect } from 'react';

export const useGameLoop = (initialState = {
  isPlaying: false,
  generation: 0,
  frequencyData: {} as Record<string, number[]>
}) => {
  const [state, setState] = useState(initialState);

  const updateFrequencyData = (newData: Record<string, number[]>) => {
    setState(prev => ({
      ...prev,
      frequencyData: newData
    }));
  };

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