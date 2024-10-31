import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/components/ui/use-toast";
import { useGameState } from './useGameState';
import { Player, ModelVisualization, ModelMetrics } from '@/types/gameTypes';
import { learningQualityMonitor } from '@/utils/monitoring/learningQualityMonitor';
import { traditionalPlayer } from '@/utils/traditionalPlayerLogic';
import { performCrossValidation } from '@/utils/validation/crossValidation';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/lunarCalculations';
import { makePrediction } from '@/utils/predictionUtils';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { temporalAccuracyTracker } from '@/utils/prediction/temporalAccuracy';
import { calculateReward, logReward } from '@/utils/rewardSystem';
import { updateModelWithNewData } from '@/utils/modelUtils';
import { cloneChampion, updateModelWithChampionKnowledge } from '@/utils/playerEvolution';
import { selectBestPlayers } from '@/utils/evolutionSystem';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const { toast } = useToast();
  const gameState = useGameState();
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<ModelVisualization | null>(null);
  const [logs, setLogs] = useState<{ message: string; matches?: number }[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [frequencyData, setFrequencyData] = useState<{ [key: string]: number[] }>({});
  const [updateInterval, setUpdateInterval] = useState(10);
  const [isManualMode, setIsManualMode] = useState(false);
  const [championData, setChampionData] = useState<{
    player: Player;
    trainingData: number[][];
  }>();

  const addLog = useCallback((message: string, matches?: number) => {
    setLogs(prevLogs => [...prevLogs, { message, matches }]);
  }, []);

  const initializePlayers = useCallback(() => {
    const newPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.floor(Math.random() * 1001)),
      fitness: 0,
      generation: 1
    }));
    gameState.setPlayers(newPlayers);
  }, [gameState]);

  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel) return;

    gameState.setConcursoNumber(prev => prev + 1);
    gameState.setGameCount(prev => prev + 1);

    const currentBoardNumbers = csvData[gameState.concursoNumber % csvData.length];
    gameState.setBoardNumbers(currentBoardNumbers);

    const validationMetrics = performCrossValidation(
      [gameState.players[0].predictions],
      csvData.slice(Math.max(0, gameState.concursoNumber - 10), gameState.concursoNumber)
    );

    const currentDate = new Date();
    const lunarPhase = getLunarPhase(currentDate);
    const lunarPatterns = analyzeLunarPatterns([currentDate], [currentBoardNumbers]);
    
    setNumbers(currentNumbers => {
      const newNumbers = [...currentNumbers, currentBoardNumbers].slice(-100);
      return newNumbers;
    });
    
    setDates(currentDates => [...currentDates, currentDate].slice(-100));

    const traditionalPrediction = traditionalPlayer.makePlay(currentBoardNumbers);
    if (traditionalPrediction) {
      const traditionalMatches = Array.isArray(traditionalPrediction[0]) 
        ? (traditionalPrediction[0] as number[]).filter(num => currentBoardNumbers.includes(num)).length
        : (traditionalPrediction as number[]).filter(num => currentBoardNumbers.includes(num)).length;
      
      gameState.setTraditionalPlayerStats(prev => ({
        score: prev.score + traditionalMatches,
        matches: prev.matches + traditionalMatches,
        predictions: traditionalPrediction
      }));

      const avgAiScore = gameState.players.reduce((sum, p) => sum + p.score, 0) / gameState.players.length;
      if (gameState.traditionalPlayerStats.score > avgAiScore * 1.2) {
        toast({
          title: "Atenção!",
          description: "O jogador tradicional está superando a média dos jogadores IA!",
          variant: "destructive"
        });
      }
    }

    const playerPredictions = await Promise.all(
      gameState.players.map(async player => {
        const prediction = await makePrediction(
          trainedModel, 
          currentBoardNumbers, 
          player.weights, 
          gameState.concursoNumber,
          setNeuralNetworkVisualization,
          { lunarPhase, lunarPatterns },
          { numbers: [[...currentBoardNumbers]], dates: [currentDate] }
        );

        const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
        const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
        predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

        return prediction;
      })
    );

    let totalMatches = 0;
    let randomMatches = 0;
    let currentGameMatches = 0;
    let currentGameRandomMatches = 0;
    const totalPredictions = gameState.players.length * (gameState.concursoNumber + 1);

    const updatedPlayers = gameState.players.map((player, index) => {
      const predictions = playerPredictions[index];
      const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
      totalMatches += matches;
      currentGameMatches += matches;
      
      const randomPrediction = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
      const randomMatch = randomPrediction.filter(num => currentBoardNumbers.includes(num)).length;
      randomMatches += randomMatch;
      currentGameRandomMatches += randomMatch;

      temporalAccuracyTracker.recordAccuracy(matches, 15);

      const reward = calculateReward(matches);
      
      if (matches >= 11) {
        const logMessage = logReward(matches, player.id);
        addLog(logMessage, matches);
        
        if (matches >= 13) {
          toast({
            title: "Desempenho Excepcional!",
            description: `Jogador ${player.id} acertou ${matches} números!`
          });
        }
      }

      return {
        ...player,
        score: player.score + reward,
        predictions,
        fitness: matches
      };
    });

    gameState.setModelMetrics({
      accuracy: totalMatches / (gameState.players.length * 15),
      randomAccuracy: randomMatches / (gameState.players.length * 15),
      totalPredictions: totalPredictions,
      perGameAccuracy: currentGameMatches / (gameState.players.length * 15),
      perGameRandomAccuracy: currentGameRandomMatches / (gameState.players.length * 15)
    });

    gameState.setPlayers(updatedPlayers);
    gameState.setEvolutionData(prev => [
      ...prev,
      ...updatedPlayers.map(player => ({
        generation: gameState.generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    const enhancedTrainingData = [
      ...currentBoardNumbers, 
      ...updatedPlayers[0].predictions,
      lunarPhase === 'Cheia' ? 1 : 0,
      lunarPhase === 'Nova' ? 1 : 0,
      lunarPhase === 'Crescente' ? 1 : 0,
      lunarPhase === 'Minguante' ? 1 : 0
    ];

    gameState.setTrainingData(currentTrainingData => 
      [...currentTrainingData, enhancedTrainingData]);

    if (gameState.concursoNumber % Math.min(updateInterval, 50) === 0 && gameState.trainingData.length > 0) {
      await updateModelWithNewData(trainedModel, gameState.trainingData, addLog, toast);
      gameState.setTrainingData([]);
    }

  }, [
    csvData,
    trainedModel,
    gameState,
    toast,
    setNeuralNetworkVisualization
  ]);

  const evolveGeneration = useCallback(async () => {
    const bestPlayers = selectBestPlayers(gameState.players);
    gameState.setGameCount(prev => prev + 1);

    const formatPredictions = (player: Player): number[][] => {
      if (!player.predictions.length) return [];
      return player.predictions.map(pred => 
        Array.isArray(pred) ? pred : [pred]
      );
    };

    const learningAnalysis = bestPlayers.map(player => 
      learningQualityMonitor.analyzePlayerLearning(
        player,
        numbers,
        formatPredictions(player)
      )
    );

    const compromisedLearning = learningAnalysis.filter(a => !a.isLearningEffective).length;
    if (compromisedLearning > bestPlayers.length * 0.5) {
      toast({
        title: "Alerta de Aprendizado",
        description: `${compromisedLearning} jogadores podem estar com aprendizado comprometido.`,
        variant: "destructive"
      });
    }

    if (gameState.gameCount % 1000 === 0 && bestPlayers.length > 0) {
      const champion = bestPlayers[0];
      
      const championAnalysis = learningQualityMonitor.analyzePlayerLearning(
        champion,
        numbers,
        formatPredictions(champion)
      );

      if (championAnalysis.isLearningEffective) {
        const clones = cloneChampion(champion, gameState.players.length);
        gameState.setPlayers(clones);
        
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
              trainingData: gameState.trainingData
            });
          } catch (error) {
            console.error("Erro ao atualizar modelo com conhecimento do campeão:", error);
          }
        }
      } else {
        toast({
          title: "Alerta de Qualidade",
          description: "Campeão atual pode não estar aprendendo efetivamente. Mantendo geração anterior.",
          variant: "destructive"
        });
      }
    } else {
      const newGeneration = bestPlayers.map(player => ({
        ...player,
        generation: gameState.generation + 1
      }));
      
      gameState.setPlayers(newGeneration);
    }

    gameState.setGeneration(prev => prev + 1);
    
    gameState.setEvolutionData(prev => [
      ...prev,
      ...gameState.players.map(player => ({
        generation: gameState.generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    if (bestPlayers.length > 0) {
      addLog(`Melhor jogador da geração ${gameState.generation}: Score ${bestPlayers[0].score}`);
      toast({
        title: "Nova Geração",
        description: `Melhor fitness: ${bestPlayers[0].fitness.toFixed(2)}`,
      });
    }
  }, [gameState, toast, championData, numbers, trainedModel]);

  const updateFrequencyData = useCallback((newFrequencyData: { [key: string]: number[] }) => {
    setFrequencyData(newFrequencyData);
    
    if (trainedModel && gameState.players.length > 0) {
      const frequencyFeatures = Object.values(newFrequencyData).flat();
      gameState.setTrainingData(currentTrainingData => {
        const lastEntry = currentTrainingData[currentTrainingData.length - 1];
        if (lastEntry) {
          return [...currentTrainingData.slice(0, -1), [...lastEntry, ...frequencyFeatures]];
        }
        return currentTrainingData;
      });
    }
  }, [trainedModel, gameState]);

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

  const clonePlayer = useCallback((player: Player) => {
    const clones = cloneChampion(player, 1);
    gameState.setPlayers(prevPlayers => [...prevPlayers, ...clones]);
    
    toast({
      title: "Jogador Clonado",
      description: `Um novo clone do Jogador #${player.id} foi criado.`
    });
  }, [gameState, toast]);

  return {
    players: gameState.players,
    generation: gameState.generation,
    evolutionData: gameState.evolutionData,
    neuralNetworkVisualization,
    modelMetrics: gameState.modelMetrics,
    logs,
    gameLoop,
    evolveGeneration,
    initializePlayers,
    addLog,
    toggleInfiniteMode: useCallback(() => gameState.setIsInfiniteMode(prev => !prev), [gameState]),
    dates,
    numbers,
    updateFrequencyData,
    isInfiniteMode: gameState.isInfiniteMode,
    boardNumbers: gameState.boardNumbers,
    concursoNumber: gameState.concursoNumber,
    trainedModel,
    gameCount: gameState.gameCount,
    isManualMode,
    toggleManualMode,
    clonePlayer,
    traditionalPlayerStats: gameState.traditionalPlayerStats
  };
};
