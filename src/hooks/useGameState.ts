import { useState } from 'react';
import { Player, EvolutionDataEntry } from '@/types/gameTypes';

export const useGameState = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState<number>(1);
  const [gameCount, setGameCount] = useState<number>(0);
  const [evolutionData, setEvolutionData] = useState<EvolutionDataEntry[]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState<number>(0);
  const [isInfiniteMode, setIsInfiniteMode] = useState<boolean>(false);
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
    boardNumbers,
    setBoardNumbers,
    concursoNumber,
    setConcursoNumber,
    isInfiniteMode,
    setIsInfiniteMode,
    trainingData,
    setTrainingData,
  };
};