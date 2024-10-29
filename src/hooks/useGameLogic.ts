import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null, playerCount: number = 10) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [gameCount, setGameCount] = useState(0);
  const [evolutionData, setEvolutionData] = useState<Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [logs, setLogs] = useState<Array<{ message: string; matches?: number }>>([]);
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState(null);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
    perGameAccuracy: 0,
    perGameRandomAccuracy: 0
  });

  const gameLoop = useCallback(async () => {
    if (!trainedModel || csvData.length === 0) return;

    const currentBoardNumbers = csvData[concursoNumber % csvData.length];
    setBoardNumbers(currentBoardNumbers);

    const predictions = await Promise.all(
      players.map(async (player) => {
        // Create input tensor with shape [1,17]
        const normalizedConcurso = concursoNumber / csvData.length;
        const normalizedTime = Date.now() / (1000 * 60 * 60 * 24 * 365);
        const inputData = [...currentBoardNumbers, normalizedConcurso, normalizedTime];
        const inputTensor = tf.tensor2d([inputData], [1, 17]);
        
        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());
        inputTensor.dispose();
        prediction.dispose();
        return result.map(n => Math.round(n * 24) + 1);
      })
    );

    const updatedPlayers = players.map((player, index) => {
      const playerPredictions = predictions[index];
      const matches = playerPredictions.filter(num => currentBoardNumbers.includes(num)).length;
      const reward = Math.pow(2, matches - 10);
      
      return {
        ...player,
        score: player.score + (reward > 0 ? reward : 0),
        predictions: playerPredictions,
        fitness: matches
      };
    });

    setPlayers(updatedPlayers);
    setConcursoNumber(prev => prev + 1);
    setGameCount(prev => prev + 1);

    const totalMatches = updatedPlayers.reduce((sum, player) => 
      sum + player.predictions.filter(num => currentBoardNumbers.includes(num)).length, 0);

    setModelMetrics(prev => ({
      ...prev,
      accuracy: totalMatches / (players.length * 15),
      totalPredictions: prev.totalPredictions + players.length
    }));

    setEvolutionData(prev => [
      ...prev,
      ...updatedPlayers.map(player => ({
        generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);
  }, [players, csvData, trainedModel, concursoNumber, generation]);

  const initializePlayers = useCallback((count: number = playerCount) => {
    const newPlayers = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.floor(Math.random() * 1001)),
      fitness: 0,
      generation: 1
    }));
    setPlayers(newPlayers);
  }, [playerCount]);

  const evolveGeneration = useCallback(() => {
    setGeneration(prev => prev + 1);
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const eliteCount = Math.max(1, Math.floor(players.length * 0.1));
    const elite = sortedPlayers.slice(0, eliteCount);

    const newPlayers = elite.map(player => ({
      ...player,
      score: 0,
      predictions: [],
      generation: generation + 1
    }));

    while (newPlayers.length < players.length) {
      const parent = elite[Math.floor(Math.random() * eliteCount)];
      const child = {
        ...parent,
        id: newPlayers.length + 1,
        score: 0,
        predictions: [],
        weights: parent.weights.map(w => 
          w * (1 + (Math.random() - 0.5) * 0.1)
        ),
        generation: generation + 1
      };
      newPlayers.push(child);
    }

    setPlayers(newPlayers);
  }, [players, generation]);

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
    logs,
    addLog: (message: string, matches?: number) => 
      setLogs(prev => [...prev, { message, matches }]),
    numbers,
    setNumbers,
    dates,
    setDates,
    neuralNetworkVisualization,
    setNeuralNetworkVisualization,
    modelMetrics,
    setModelMetrics,
    initializePlayers,
    gameLoop,
    evolveGeneration,
    isManualMode: false,
    trainedModel
  };
};