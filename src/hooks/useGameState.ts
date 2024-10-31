import { useState } from 'react';
import { GameState, Player, ModelMetrics, TraditionalPlayerStats } from '@/types/gameTypes';

export const useGameState = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [gameCount, setGameCount] = useState(0);
  const [evolutionData, setEvolutionData] = useState<GameState['evolutionData']>([]);
  const [traditionalPlayerStats, setTraditionalPlayerStats] = useState<TraditionalPlayerStats>({
    score: 0,
    matches: 0,
    predictions: []
  });
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics>({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0
  });
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [trainingData, setTrainingData] = useState<number[][]>([]);

  return {
    players,
    setPlayers,
    generation,
    setGeneration,
    gameCount,
    setGameCount,
    evolutionData,
    setEvolutionData,
    traditionalPlayerStats,
    setTraditionalPlayerStats,
    modelMetrics,
    setModelMetrics,
    boardNumbers,
    setBoardNumbers,
    concursoNumber,
    setConcursoNumber,
    isInfiniteMode,
    setIsInfiniteMode,
    trainingData,
    setTrainingData
  };
};