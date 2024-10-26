import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { Player, ModelVisualization } from '../types/gameTypes';
import { cloneChampion, updateModelWithChampionKnowledge } from '../utils/playerEvolution';
import { calculateReward, logReward } from '../utils/rewardSystem';
import { makePrediction } from '../utils/predictionUtils';
import { selectBestPlayers } from '../utils/evolutionSystem';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [gameCount, setGameCount] = useState(0);
  const [championData, setChampionData] = useState<{player: Player, trainingData: number[][]}>();
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [updateInterval, setUpdateInterval] = useState(10);
  const { toast } = useToast();

  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<ModelVisualization | null>(null);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
  });
  const [logs, setLogs] = useState<{ message: string; matches?: number }[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [frequencyData, setFrequencyData] = useState<{ [key: string]: number[] }>({});

  const addLog = useCallback((message: string, matches?: number) => {
    setLogs(prevLogs => [...prevLogs, { message, matches }]);
  }, []);

  const evolveGeneration = useCallback(async () => {
    const bestPlayers = selectBestPlayers(players);
    setGameCount(prev => prev + 1);

    // A cada 1000 jogos, clona o campeão e atualiza o modelo
    if (gameCount % 1000 === 0 && bestPlayers.length > 0) {
      const champion = bestPlayers[0];
      const clones = cloneChampion(champion, players.length);
      setPlayers(clones);
      
      if (trainedModel && championData) {
        try {
          const updatedModel = await updateModelWithChampionKnowledge(
            trainedModel,
            champion,
            championData.trainingData
          );
          
          // Atualiza o modelo com o conhecimento do campeão
          toast({
            title: "Modelo Atualizado",
            description: `Conhecimento do Campeão (Score: ${champion.score}) incorporado ao modelo`,
          });
          
          // Armazena os dados do novo campeão
          setChampionData({
            player: champion,
            trainingData: trainingData
          });
        } catch (error) {
          console.error("Erro ao atualizar modelo com conhecimento do campeão:", error);
        }
      }
    } else {
      // Evolução normal da geração
      const newGeneration = bestPlayers.map(player => ({
        ...player,
        generation: generation + 1
      }));
      
      setPlayers(newGeneration);
    }

    setGeneration(prev => prev + 1);
    
    // Log messages and toast notifications
    if (bestPlayers.length > 0) {
      addLog(`Melhor jogador da geração ${generation}: Score ${bestPlayers[0].score}`);
      toast({
        title: "Nova Geração",
        description: `Melhor fitness: ${bestPlayers[0].fitness.toFixed(2)}`,
      });
    }
  }, [players, generation, trainedModel, gameCount, championData, toast, trainingData]);

  const initializePlayers = useCallback(() => {
    const newPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.floor(Math.random() * 1001)),
      fitness: 0,
      generation: 1
    }));
    setPlayers(newPlayers);
  }, []);

  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel) return;

    const currentBoardNumbers = csvData[concursoNumber % csvData.length];
    setBoardNumbers(currentBoardNumbers);
    
    setNumbers(prev => [...prev, currentBoardNumbers].slice(-100));
    setDates(prev => [...prev, new Date()].slice(-100));

    let totalMatches = 0;
    let totalRandomMatches = 0;

    const playerPredictions = await Promise.all(
      players.map(player => 
        makePrediction(
          trainedModel, 
          currentBoardNumbers, 
          player.weights, 
          concursoNumber,
          setNeuralNetworkVisualization
        )
      )
    );

    const updatedPlayers = players.map((player, index) => {
      const predictions = playerPredictions[index];
      const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
      const randomPredictions = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
      const randomMatches = randomPredictions.filter(num => currentBoardNumbers.includes(num)).length;
      
      totalMatches += matches;
      totalRandomMatches += randomMatches;

      const reward = calculateReward(matches);
      
      if (matches >= 11) {
        const logMessage = logReward(matches, player.id);
        addLog(logMessage, matches);
      }

      return {
        ...player,
        score: player.score + reward,
        predictions,
        fitness: matches
      };
    });

    setPlayers(updatedPlayers);
    setEvolutionData(prev => [
      ...prev,
      ...updatedPlayers.map(player => ({
        generation,
        playerId: player.id,
        score: player.score
      }))
    ]);

    // Collect training data
    setTrainingData(prev => [...prev, [...currentBoardNumbers, ...updatedPlayers[0].predictions]]);

    // Update model metrics
    setModelMetrics(prev => ({
      accuracy: (prev.accuracy * prev.totalPredictions + totalMatches / (15 * players.length)) / (prev.totalPredictions + 1),
      randomAccuracy: (prev.randomAccuracy * prev.totalPredictions + totalRandomMatches / (15 * players.length)) / (prev.totalPredictions + 1),
      totalPredictions: prev.totalPredictions + 1,
    }));

    setConcursoNumber(prev => prev + 1);

    // Update model if necessary
    if (concursoNumber % updateInterval === 0 && trainingData.length > 0) {
      updateModelWithNewData();
    }
  }, [players, csvData, concursoNumber, generation, trainedModel, addLog]);

  const updateModelWithNewData = useCallback(async () => {
    if (!trainedModel || trainingData.length === 0) return;

    try {
      const updatedModel = await updateModel(trainedModel, trainingData);
      // We can't directly set the trainedModel state here as it's passed as a prop
      // Instead, we'll need to handle this update in the parent component
      addLog(`Modelo atualizado com ${trainingData.length} novos registros.`);
      setTrainingData([]); // Clear training data after update
    } catch (error) {
      addLog(`Erro ao atualizar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [trainedModel, trainingData, addLog]);

  const updateFrequencyData = useCallback((newFrequencyData: { [key: string]: number[] }) => {
    setFrequencyData(newFrequencyData);
    
    // Update training data with frequency information
    if (trainedModel && players.length > 0) {
      const frequencyFeatures = Object.values(newFrequencyData).flat();
      setTrainingData(prev => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry) {
          return [...prev.slice(0, -1), [...lastEntry, ...frequencyFeatures]];
        }
        return prev;
      });
    }
  }, [trainedModel, players]);

  useEffect(() => {
    initializePlayers();
  }, [initializePlayers]);

  useEffect(() => {
    // Set update interval based on CSV data length
    setUpdateInterval(Math.max(10, Math.floor(csvData.length / 10)));
  }, [csvData]);

  const toggleInfiniteMode = useCallback(() => {
    setIsInfiniteMode(prev => !prev);
    addLog(`Modo infinito ${isInfiniteMode ? 'desativado' : 'ativado'}.`);
  }, [isInfiniteMode, addLog]);

  return {
    players,
    generation,
    gameCount,
    championData,
    boardNumbers,
    concursoNumber,
    isInfiniteMode,
    neuralNetworkVisualization,
    modelMetrics,
    logs,
    initializePlayers,
    gameLoop,
    evolveGeneration,
    addLog,
    toggleInfiniteMode,
    dates,
    numbers,
    updateFrequencyData,
  };
};
