import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/components/ui/use-toast";
import { useGameInitialization } from './useGameInitialization';
import { useGameLoop } from './useGameLoop';
import { updateModelWithNewData } from '@/utils/modelUtils';
import { cloneChampion, updateModelWithChampionKnowledge } from '@/utils/playerEvolution';
import { selectBestPlayers } from '@/utils/evolutionSystem';
import { ModelVisualization, Player } from '@/types/gameTypes';
import { validateModel, ValidationMetrics } from '@/utils/aiValidation';
import { predictionCache } from '@/utils/cacheSystem';
import { analyzeTimeSeries, analyzeCorrelations, TimeSeriesAnalysis, CorrelationAnalysis } from '@/utils/predictiveAnalysis';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const { toast } = useToast();
  const { players, setPlayers, initializePlayers } = useGameInitialization();
  const [generation, setGeneration] = useState(1);
  const [gameCount, setGameCount] = useState(0);
  const [championData, setChampionData] = useState<{
    player: Player;
    trainingData: number[][];
  }>();
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
  const [frequencyData, setFrequencyData] = useState<{ [key: string]: number[] }>({});
  const [updateInterval, setUpdateInterval] = useState(10);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [validationMetrics, setValidationMetrics] = useState<ValidationMetrics | null>(null);
  const [timeSeriesAnalysis, setTimeSeriesAnalysis] = useState<TimeSeriesAnalysis | null>(null);
  const [correlationAnalysis, setCorrelationAnalysis] = useState<CorrelationAnalysis | null>(null);

  const addLog = useCallback((message: string, matches?: number) => {
    setLogs(prevLogs => [...prevLogs, { message, matches }]);
  }, []);

  const validateCurrentModel = useCallback(async () => {
    if (!trainedModel || !csvData.length) return;

    try {
      const metrics = await validateModel(
        trainedModel,
        csvData.slice(0, -10),
        csvData.slice(-10)
      );
      setValidationMetrics(metrics);
      
      toast({
        title: "Validação do Modelo",
        description: `Acurácia: ${(metrics.accuracy * 100).toFixed(2)}%`,
      });
    } catch (error) {
      console.error("Erro na validação:", error);
      toast({
        title: "Erro na Validação",
        description: "Não foi possível validar o modelo",
        variant: "destructive"
      });
    }
  }, [trainedModel, csvData, toast]);

  const updatePredictiveAnalysis = useCallback(async () => {
    if (!numbers.length) return;

    try {
      const timeSeriesResults = await analyzeTimeSeries(numbers);
      setTimeSeriesAnalysis(timeSeriesResults);

      const correlationResults = await analyzeCorrelations(numbers);
      setCorrelationAnalysis(correlationResults);

      toast({
        title: "Análises Atualizadas",
        description: "Análises preditivas foram atualizadas com sucesso",
      });
    } catch (error) {
      console.error("Erro nas análises:", error);
      toast({
        title: "Erro nas Análises",
        description: "Não foi possível atualizar as análises preditivas",
        variant: "destructive"
      });
    }
  }, [numbers, toast]);

  const gameLoop = useCallback(async () => {
    if (!csvData.length || !trainedModel) return;

    const cacheKey = `prediction-${concursoNumber}`;
    const cachedPrediction = await predictionCache.get(cacheKey);

    if (cachedPrediction) {
      setBoardNumbers(cachedPrediction);
      addLog("Usando previsão em cache");
    } else {
      const currentBoardNumbers = csvData[concursoNumber % csvData.length];
      setBoardNumbers(currentBoardNumbers);
      await predictionCache.set(cacheKey, currentBoardNumbers);
    }

    if (gameCount % 10 === 0) {
      await updatePredictiveAnalysis();
    }

    if (gameCount % 100 === 0) {
      await validateCurrentModel();
    }

    setGameCount(prev => prev + 1);
  }, [
    csvData,
    trainedModel,
    concursoNumber,
    gameCount,
    addLog,
    updatePredictiveAnalysis,
    validateCurrentModel,
    setBoardNumbers
  ]);

  const evolveGeneration = useCallback(async () => {
    const bestPlayers = selectBestPlayers(players);
    setGameCount(prev => prev + 1);

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
          
          toast({
            title: "Modelo Atualizado",
            description: `Conhecimento do Campeão (Score: ${champion.score}) incorporado ao modelo`,
          });
          
          setChampionData({
            player: champion,
            trainingData: trainingData
          });
        } catch (error) {
          console.error("Erro ao atualizar modelo com conhecimento do campeão:", error);
        }
      }
    } else {
      const newGeneration = bestPlayers.map(player => ({
        ...player,
        generation: generation + 1
      }));
      
      setPlayers(newGeneration);
    }

    setGeneration(prev => prev + 1);
    
    setEvolutionData(prev => [
      ...prev,
      ...players.map(player => ({
        generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    if (bestPlayers.length > 0) {
      addLog(`Melhor jogador da geração ${generation}: Score ${bestPlayers[0].score}`);
      toast({
        title: "Nova Geração",
        description: `Melhor fitness: ${bestPlayers[0].fitness.toFixed(2)}`,
      });
    }
  }, [players, generation, trainedModel, gameCount, championData, toast, trainingData, setPlayers, addLog]);

  const updateFrequencyData = useCallback((newFrequencyData: { [key: string]: number[] }) => {
    setFrequencyData(newFrequencyData);
    
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

  const toggleManualMode = useCallback(() => {
    setIsManualMode(prev => {
      const newMode = !prev;
      toast({
        title: newMode ? "Modo Manual Ativado" : "Modo Manual Desativado",
        description: newMode ? 
          "A clonagem automática está desativada. Suas alterações serão mantidas." : 
          "A clonagem automática está ativada novamente.",
      });
      return newMode;
    });
  }, [toast]);

  useEffect(() => {
    initializePlayers();
  }, [initializePlayers]);

  useEffect(() => {
    setUpdateInterval(Math.max(10, Math.floor(csvData.length / 10)));
  }, [csvData]);

  return {
    players,
    generation,
    evolutionData,
    neuralNetworkVisualization,
    modelMetrics,
    logs,
    initializePlayers,
    gameLoop,
    evolveGeneration,
    addLog,
    toggleInfiniteMode: useCallback(() => {
      setIsInfiniteMode(prev => !prev);
    }, []),
    dates,
    numbers,
    updateFrequencyData,
    isInfiniteMode,
    boardNumbers,
    concursoNumber,
    trainedModel,
    gameCount,
    isManualMode,
    toggleManualMode,
    validationMetrics,
    timeSeriesAnalysis,
    correlationAnalysis,
    validateCurrentModel,
    updatePredictiveAnalysis,
  };
};
