import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useGameState } from './useGameState';
import { useGameToast } from './useGameToast';
import { useGameLoop } from './useGameLoop';
import { useGameEvolution } from './useGameEvolution';
import { Player, ModelVisualization } from '@/types/gameTypes';
import { cloneChampion } from '@/utils/playerEvolution';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const gameState = useGameState();
  const showToast = useGameToast();
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<ModelVisualization | null>(null);
  const [logs, setLogs] = useState<{ message: string; matches?: number }[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [frequencyData, setFrequencyData] = useState<{ [key: string]: number[] }>({});
  const [updateInterval, setUpdateInterval] = useState(10);
  const [isManualMode, setIsManualMode] = useState(false);

  const addLog = useCallback((message: string, matches?: number) => {
    setLogs(prevLogs => [...prevLogs, { message, matches }]);
  }, []);

  const gameLoop = useGameLoop(
    gameState.players,
    gameState.setPlayers,
    csvData,
    trainedModel,
    gameState.concursoNumber,
    gameState.setEvolutionData,
    gameState.generation,
    addLog,
    updateInterval,
    gameState.trainingData,
    gameState.setTrainingData,
    setNumbers,
    setDates,
    setNeuralNetworkVisualization,
    gameState.setBoardNumbers,
    gameState.setModelMetrics,
    gameState.setConcursoNumber,
    gameState.setGameCount,
    showToast
  );

  const evolveGeneration = useGameEvolution(gameState, trainedModel, numbers, showToast, addLog);

  const toggleManualMode = useCallback(() => {
    setIsManualMode(prev => {
      const newMode = !prev;
      showToast(
        newMode ? "Modo Manual Ativado" : "Modo Manual Desativado",
        newMode ? 
          "A clonagem automática está desativada. Suas alterações serão mantidas." : 
          "A clonagem automática está ativada novamente."
      );
      return newMode;
    });
  }, [showToast]);

  const clonePlayerCallback = useCallback((player: Player) => {
    const clones = cloneChampion(player, 1);
    gameState.setPlayers(prevPlayers => [...prevPlayers, ...clones]);
    showToast("Jogador Clonado", `Um novo clone do Jogador #${player.id} foi criado.`);
  }, [gameState, showToast]);

  return {
    players: gameState.players,
    generation: gameState.generation,
    evolutionData: gameState.evolutionData,
    neuralNetworkVisualization,
    modelMetrics: gameState.modelMetrics,
    logs,
    gameLoop,
    evolveGeneration,
    initializePlayers: useCallback(() => {
      const newPlayers = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        score: 0,
        predictions: [],
        weights: Array.from({ length: 17 }, () => Math.floor(Math.random() * 1001)),
        fitness: 0,
        generation: 1
      }));
      gameState.setPlayers(newPlayers);
    }, [gameState]),
    addLog,
    toggleInfiniteMode: useCallback(() => gameState.setIsInfiniteMode(prev => !prev), [gameState]),
    dates,
    numbers,
    updateFrequencyData: setFrequencyData,
    isInfiniteMode: gameState.isInfiniteMode,
    boardNumbers: gameState.boardNumbers,
    concursoNumber: gameState.concursoNumber,
    trainedModel,
    gameCount: gameState.gameCount,
    isManualMode,
    toggleManualMode,
    clonePlayer: clonePlayerCallback,
    traditionalPlayerStats: gameState.traditionalPlayerStats
  };
};