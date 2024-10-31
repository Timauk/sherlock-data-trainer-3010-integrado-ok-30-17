import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/components/ui/use-toast";
import { useGameInitialization } from './useGameInitialization';
import { useGameLoop } from './useGameLoop';
import { ModelVisualization, Player } from '@/types/gameTypes';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const { toast } = useToast();
  const { players, setPlayers, initializePlayers } = useGameInitialization();
  const [generation, setGeneration] = useState(1);
  const [gameCount, setGameCount] = useState(0);
  const [evolutionData, setEvolutionData] = useState<Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>>([]);
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<ModelVisualization | null>(null);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
  });
  const [logs, setLogs] = useState<{ message: string; matches?: number }[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [updateInterval] = useState(10);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);

  const addLog = useCallback((message: string, matches?: number) => {
    setLogs(prevLogs => [...prevLogs, { message, matches }]);
  }, []);

  const gameLoop = useGameLoop(
    players,
    setPlayers,
    csvData,
    trainedModel,
    concursoNumber,
    setEvolutionData,
    generation,
    addLog,
    updateInterval,
    trainingData,
    setTrainingData,
    setNumbers,
    setDates,
    setNeuralNetworkVisualization,
    setBoardNumbers,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    (title, description) => toast({ title, description })
  );

  useEffect(() => {
    initializePlayers();
  }, [initializePlayers]);

  const toggleInfiniteMode = useCallback(() => {
    setIsInfiniteMode(prev => !prev);
  }, []);

  const toggleManualMode = useCallback(() => {
    setIsManualMode(prev => !prev);
  }, []);

  return {
    players,
    generation,
    evolutionData,
    neuralNetworkVisualization,
    modelMetrics,
    logs,
    gameLoop,
    addLog,
    toggleInfiniteMode,
    dates,
    numbers,
    isInfiniteMode,
    boardNumbers,
    concursoNumber,
    trainedModel,
    gameCount,
    isManualMode,
    toggleManualMode,
  };
};