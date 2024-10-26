import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { updateModel } from '../utils/aiModel';
import { useToast } from "@/hooks/use-toast"

interface Player {
  id: number;
  score: number;
  predictions: number[];
  weights: number[];
  fitness: number;
  generation: number;
}

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [updateInterval, setUpdateInterval] = useState(10);
  const { toast } = useToast();

  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<{
    input: number[];
    output: number[];
    weights: number[][];
  } | null>(null);

  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
  });

  const [logs, setLogs] = useState<{ message: string; matches?: number }[]>([]);

  const addLog = useCallback((message: string, matches?: number) => {
    setLogs(prevLogs => [...prevLogs, { message, matches }]);
  }, []);

  const calculateDynamicReward = (matches: number): number => {
    const baseReward = matches > 12 ? Math.pow(2, matches - 12) : -Math.pow(2, 12 - matches);
    const consistencyBonus = matches >= 11 ? matches * 0.5 : 0; // Bônus por consistência
    return baseReward + consistencyBonus;
  };

  const selectBestPlayers = () => {
    // Ordena jogadores por fitness e seleciona os top 50%
    const sortedPlayers = [...players].sort((a, b) => b.fitness - a.fitness);
    const topHalf = sortedPlayers.slice(0, Math.ceil(players.length / 2));
    
    // Registra o melhor jogador da geração
    if (topHalf.length > 0) {
      addLog(`Melhor jogador da geração ${generation}: Score ${topHalf[0].score}`);
      toast({
        title: "Nova Geração",
        description: `Melhor fitness: ${topHalf[0].fitness.toFixed(2)}`,
      });
    }
    
    return topHalf;
  };

  const createOffspring = (parent1: Player, parent2: Player): Player => {
    // Crossover dos pesos
    const childWeights = parent1.weights.map((weight, index) => {
      return Math.random() > 0.5 ? weight : parent2.weights[index];
    });

    // Mutação
    const mutatedWeights = childWeights.map(weight => {
      return Math.random() < 0.1 ? weight + (Math.random() - 0.5) * 0.1 : weight;
    });

    return {
      id: Math.random(),
      score: 0,
      predictions: [],
      weights: mutatedWeights,
      fitness: 0,
      generation: generation + 1
    };
  };

  const evolveGeneration = useCallback(() => {
    const bestPlayers = selectBestPlayers();
    const newGeneration: Player[] = [];

    // Elitismo: mantém os melhores jogadores
    newGeneration.push(...bestPlayers.slice(0, 2));

    // Cria nova geração através de crossover e mutação
    while (newGeneration.length < players.length) {
      const parent1 = bestPlayers[Math.floor(Math.random() * bestPlayers.length)];
      const parent2 = bestPlayers[Math.floor(Math.random() * bestPlayers.length)];
      const offspring = createOffspring(parent1, parent2);
      newGeneration.push(offspring);
    }

    setGeneration(prev => prev + 1);
    setPlayers(newGeneration);
    
    // Atualiza o modelo com os dados dos melhores jogadores
    if (trainedModel) {
      const bestPlayerData = bestPlayers[0].predictions;
      setTrainingData(prev => [...prev, bestPlayerData]);
    }
  }, [players, generation, trainedModel]);

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

  const makePrediction = (inputData: number[], playerWeights: number[]): number[] => {
    if (!trainedModel) return [];
    
    const normalizedConcursoNumber = concursoNumber / 3184;
    const normalizedDataSorteio = Date.now() / (1000 * 60 * 60 * 24 * 365);
    const input = [...inputData, normalizedConcursoNumber, normalizedDataSorteio];
    
    const weightedInput = input.map((value, index) => value * (playerWeights[index] / 1000));
    const inputTensor = tf.tensor2d([weightedInput], [1, 17]);
    
    const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
    const result = Array.from(predictions.dataSync());
    
    inputTensor.dispose();
    predictions.dispose();
    
    setNeuralNetworkVisualization({ input: weightedInput, output: result, weights: trainedModel.getWeights().map(w => Array.from(w.dataSync())) });
    
    // Ensure 15 unique numbers
    const uniqueNumbers = new Set<number>();
    while (uniqueNumbers.size < 15) {
      const num = Math.floor(Math.random() * 25) + 1;
      uniqueNumbers.add(num);
    }
    return Array.from(uniqueNumbers);
  };

  const gameLoop = useCallback(() => {
    if (csvData.length === 0 || !trainedModel) return;

    const currentBoardNumbers = csvData[concursoNumber % csvData.length];
    setBoardNumbers(currentBoardNumbers);

    let totalMatches = 0;
    let totalRandomMatches = 0;

    const updatedPlayers = players.map(player => {
      const playerPredictions = makePrediction(currentBoardNumbers, player.weights);
      const matches = playerPredictions.filter(num => currentBoardNumbers.includes(num)).length;
      const randomPredictions = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
      const randomMatches = randomPredictions.filter(num => currentBoardNumbers.includes(num)).length;
      
      totalMatches += matches;
      totalRandomMatches += randomMatches;

      const reward = calculateDynamicReward(matches);

      if (matches >= 13) {
        addLog(`Jogador ${player.id} acertou ${matches} números!`, matches);
      }

      return {
        ...player,
        score: player.score + reward,
        predictions: playerPredictions,
        fitness: matches // Atualiza a fitness com base nos acertos
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
  }, [players, csvData, concursoNumber, generation, trainedModel, addLog, updateInterval]);

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
    evolutionData,
    boardNumbers,
    concursoNumber,
    isInfiniteMode,
    setIsInfiniteMode,
    initializePlayers,
    gameLoop,
    evolveGeneration,
    neuralNetworkVisualization,
    modelMetrics,
    logs,
    addLog,
    toggleInfiniteMode
  };
};
