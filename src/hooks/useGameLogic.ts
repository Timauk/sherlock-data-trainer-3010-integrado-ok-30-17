import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { updateModel, saveModel, loadModel } from '../utils/continuousLearning';
import { useToast } from "@/hooks/use-toast";
import { usePlayerLogic } from './usePlayerLogic';
import { usePredictionLogic } from './usePredictionLogic';

export const useGameLogic = (csvData: number[][], initialModel: tf.LayersModel | null) => {
  const [generation, setGeneration] = useState(1);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<{ input: number[], output: number[], weights: number[][] } | null>(null);
  const [modelMetrics, setModelMetrics] = useState({ accuracy: 0, randomAccuracy: 0, totalPredictions: 0 });
  const [logs, setLogs] = useState<{ message: string; matches?: number }[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(initialModel);
  const { toast } = useToast();

  const playerLogic = usePlayerLogic();
  const { makePrediction } = usePredictionLogic(trainedModel, concursoNumber);

  const addLog = useCallback((message: string, matches?: number) => {
    setLogs(prevLogs => [...prevLogs, { message, matches }]);
  }, []);

  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel) {
      addLog("Erro: Dados CSV não carregados ou modelo não carregado.");
      return;
    }

    const currentBoardNumbers = csvData[concursoNumber % csvData.length];
    setBoardNumbers(currentBoardNumbers);

    let totalMatches = 0;
    let totalRandomMatches = 0;
    let newTrainingData: number[][] = [];
    let newLabels: number[][] = [];

    const playerPredictions = playerLogic.players.map(player => makePrediction(currentBoardNumbers, player.weights));
    const matches = playerPredictions.map(prediction => 
      prediction.filter(num => currentBoardNumbers.includes(num)).length
    );

    totalMatches = matches.reduce((sum, count) => sum + count, 0);
    totalRandomMatches = playerLogic.players.length * 3; // Assuming average 3 matches for random predictions

    playerLogic.updatePlayerScores(matches);

    matches.forEach((matchCount, index) => {
      if (matchCount >= 13) {
        addLog(`Jogador ${playerLogic.players[index].id} acertou ${matchCount} números!`, matchCount);
        newTrainingData.push([...currentBoardNumbers, concursoNumber / 3184, Date.now() / (1000 * 60 * 60 * 24 * 365)]);
        newLabels.push(playerPredictions[index].map(n => n / 25));
      }
    });

    setEvolutionData(prev => [
      ...prev,
      ...playerLogic.players.map(player => ({
        generation,
        playerId: player.id,
        score: player.score
      }))
    ]);

    // Update model metrics
    setModelMetrics(prev => ({
      accuracy: (prev.accuracy * prev.totalPredictions + totalMatches / (15 * playerLogic.players.length)) / (prev.totalPredictions + 1),
      randomAccuracy: (prev.randomAccuracy * prev.totalPredictions + totalRandomMatches / (15 * playerLogic.players.length)) / (prev.totalPredictions + 1),
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
  }, [playerLogic, csvData, concursoNumber, generation, trainedModel, addLog, makePrediction, toast]);

  const evolveGeneration = useCallback(() => {
    setGeneration(prev => prev + 1);
    // Implement evolution logic here if needed
  }, []);

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
      playerLogic.initializePlayers();
      addLog("Jogo pronto para iniciar. Clique em 'Iniciar' para começar.");
    }
  }, [csvData, trainedModel, playerLogic, addLog]);

  return {
    players: playerLogic.players,
    generation,
    evolutionData,
    boardNumbers,
    concursoNumber,
    isInfiniteMode,
    setIsInfiniteMode,
    initializePlayers: playerLogic.initializePlayers,
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