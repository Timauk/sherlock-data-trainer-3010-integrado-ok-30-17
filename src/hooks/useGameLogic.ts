import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { updateModel, saveModel, loadModel } from '../utils/continuousLearning';
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: number;
  score: number;
  predictions: number[];
  weights: number[];
}

interface ModelMetrics {
  accuracy: number;
  randomAccuracy: number;
  totalPredictions: number;
}

export const useGameLogic = (csvData: number[][], initialModel: tf.LayersModel | null) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<{ input: number[], output: number[], weights: number[][] } | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics>({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
  });
  const [logs, setLogs] = useState<{ message: string; matches?: number }[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(initialModel);
  const { toast } = useToast();

  const addLog = useCallback((message: string, matches?: number) => {
    setLogs(prevLogs => [...prevLogs, { message, matches }]);
  }, []);

  const initializePlayers = useCallback(() => {
    const newPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.floor(Math.random() * 1001))
    }));
    setPlayers(newPlayers);
  }, []);

  const makePrediction = useCallback((inputData: number[], playerWeights: number[]): number[] => {
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
  }, [trainedModel, concursoNumber]);

  const gameLoop = useCallback(async () => {
    if (csvData.length === 0) {
      addLog("Erro: Dados CSV não carregados.");
      return;
    }
    if (!trainedModel) {
      addLog("Erro: Modelo não carregado.");
      return;
    }

    const currentBoardNumbers = csvData[concursoNumber % csvData.length];
    setBoardNumbers(currentBoardNumbers);

    let totalMatches = 0;
    let totalRandomMatches = 0;
    let newTrainingData: number[][] = [];
    let newLabels: number[][] = [];

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
        // Add successful predictions to training data
        newTrainingData.push([...currentBoardNumbers, concursoNumber / 3184, Date.now() / (1000 * 60 * 60 * 24 * 365)]);
        newLabels.push(playerPredictions.map(n => n / 25));
      }

      return {
        ...player,
        score: player.score + reward,
        predictions: playerPredictions
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

    // Update model metrics
    setModelMetrics(prev => ({
      accuracy: (prev.accuracy * prev.totalPredictions + totalMatches / (15 * players.length)) / (prev.totalPredictions + 1),
      randomAccuracy: (prev.randomAccuracy * prev.totalPredictions + totalRandomMatches / (15 * players.length)) / (prev.totalPredictions + 1),
      totalPredictions: prev.totalPredictions + 1,
    }));

    // Continuous learning
    if (newTrainingData.length > 0) {
      const updatedModel = await updateModel(trainedModel, newTrainingData, newLabels);
      setTrainedModel(updatedModel);
      addLog("Modelo atualizado com novos dados de treinamento");
    }

    // Save model periodically (e.g., every 10 rounds)
    if (concursoNumber % 10 === 0) {
      await saveModel(trainedModel);
      toast({
        title: "Modelo Salvo",
        description: "O modelo foi salvo com sucesso para uso futuro.",
      });
    }

    setConcursoNumber(prev => prev + 1);
  }, [players, csvData, concursoNumber, generation, trainedModel, addLog, makePrediction, toast]);

  const evolveGeneration = useCallback(() => {
    setGeneration(prev => prev + 1);
    // Implement evolution logic here if needed
  }, []);

  const calculateDynamicReward = (matches: number): number => {
    return matches > 12 ? Math.pow(2, matches - 12) : -Math.pow(2, 12 - matches);
  };

  useEffect(() => {
    const initializeModel = async () => {
      if (!trainedModel) {
        const newModel = tf.sequential({
          layers: [
            tf.layers.dense({ inputShape: [17], units: 64, activation: 'relu' }),
            tf.layers.dense({ units: 32, activation: 'relu' }),
            tf.layers.dense({ units: 15, activation: 'sigmoid' })
          ]
        });
        newModel.compile({
          optimizer: 'adam',
          loss: 'meanSquaredError',
          metrics: ['accuracy']
        });
        setTrainedModel(newModel);
      }
    };
    initializeModel();
  }, [trainedModel]);

  useEffect(() => {
    const loadSavedModel = async () => {
      const savedModel = await loadModel();
      if (savedModel) {
        setTrainedModel(savedModel);
        toast({
          title: "Modelo Carregado",
          description: "Um modelo salvo anteriormente foi carregado com sucesso.",
        });
      } else {
        addLog("Nenhum modelo salvo encontrado. Utilize a opção de carregar modelo.");
      }
    };
    loadSavedModel();
  }, [toast, addLog]);

  useEffect(() => {
    if (csvData.length > 0 && trainedModel) {
      initializePlayers();
      addLog("Jogo pronto para iniciar. Clique em 'Iniciar' para começar.");
    }
  }, [csvData, trainedModel, initializePlayers, addLog]);

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
    trainedModel,
    setTrainedModel
  };
};
