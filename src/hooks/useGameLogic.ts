import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/components/ui/use-toast";
import { useGameInitialization } from './useGameInitialization';
import { useGameLoop } from './useGameLoop';
import { useGameInitializationEffects } from './useGameInitializationEffects';
import { updateModelWithNewData } from '@/utils/modelUtils';
import { cloneChampion, updateModelWithChampionKnowledge } from '@/utils/playerEvolution';
import { selectBestPlayers } from '@/utils/evolutionSystem';
import { ModelVisualization, Player } from '@/types/gameTypes';
import { learningQualityMonitor } from '@/utils/monitoring/learningQualityMonitor';
import { traditionalPlayer } from '@/utils/traditionalPlayerLogic';
import { performCrossValidation } from '@/utils/validation/crossValidation';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/lunarCalculations';
import { makePrediction } from '@/utils/predictionUtils';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { temporalAccuracyTracker } from '@/utils/prediction/temporalAccuracy';
import { calculateReward, logReward } from '@/utils/rewardSystem';

interface ModelMetrics {
  accuracy: number;
  randomAccuracy: number;
  totalPredictions: number;
  perGameAccuracy?: number;
  perGameRandomAccuracy?: number;
}

interface TraditionalPlayerStats {
  score: number;
  matches: number;
  predictions: number[];
}

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
  const [traditionalPlayerStats, setTraditionalPlayerStats] = useState<TraditionalPlayerStats>({
    score: 0,
    matches: 0,
    predictions: []
  });
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<ModelVisualization | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics>({
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

  const addLog = useCallback((message: string, matches?: number) => {
    setLogs(prevLogs => [...prevLogs, { message, matches }]);
  }, []);

  useGameInitializationEffects(initializePlayers, csvData, setUpdateInterval);

  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel) return;

    setConcursoNumber(prev => prev + 1);
    setGameCount(prev => prev + 1);

    const currentBoardNumbers = csvData[concursoNumber % csvData.length];
    setBoardNumbers(currentBoardNumbers);

    const validationMetrics = performCrossValidation(
      [players[0].predictions],
      csvData.slice(Math.max(0, concursoNumber - 10), concursoNumber)
    );

    const currentDate = new Date();
    const lunarPhase = getLunarPhase(currentDate);
    const lunarPatterns = analyzeLunarPatterns([currentDate], [currentBoardNumbers]);
    
    setNumbers(currentNumbers => {
      const newNumbers = [...currentNumbers, currentBoardNumbers].slice(-100);
      return newNumbers;
    });
    
    setDates(currentDates => [...currentDates, currentDate].slice(-100));

    // Get traditional player's prediction
    const traditionalPrediction = traditionalPlayer.makePlay(currentBoardNumbers);
    if (traditionalPrediction) {
      const traditionalMatches = traditionalPrediction.filter(num => 
        currentBoardNumbers.includes(num)).length;
      
      setTraditionalPlayerStats(prev => ({
        score: prev.score + traditionalMatches,
        matches: prev.matches + traditionalMatches,
        predictions: traditionalPrediction
      }));

      // Compare with AI players and show alert if traditional player is performing better
      const avgAiScore = players.reduce((sum, p) => sum + p.score, 0) / players.length;
      if (traditionalPlayerStats.score > avgAiScore * 1.2) {
        toast({
          title: "Atenção!",
          description: "O jogador tradicional está superando a média dos jogadores IA!",
          variant: "warning"
        });
      }
    }

    const playerPredictions = await Promise.all(
      players.map(async player => {
        const prediction = await makePrediction(
          trainedModel, 
          currentBoardNumbers, 
          player.weights, 
          concursoNumber,
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
    const totalPredictions = players.length * (concursoNumber + 1);

    const updatedPlayers = players.map((player, index) => {
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

    setModelMetrics({
      accuracy: totalMatches / (players.length * 15),
      randomAccuracy: randomMatches / (players.length * 15),
      totalPredictions: totalPredictions,
      perGameAccuracy: currentGameMatches / (players.length * 15),
      perGameRandomAccuracy: currentGameRandomMatches / (players.length * 15)
    });

    setPlayers(updatedPlayers);
    setEvolutionData(prev => [
      ...prev,
      ...updatedPlayers.map(player => ({
        generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    const enhancedTrainingData = [...currentBoardNumbers, 
      ...updatedPlayers[0].predictions,
      lunarPhase === 'Cheia' ? 1 : 0,
      lunarPhase === 'Nova' ? 1 : 0,
      lunarPhase === 'Crescente' ? 1 : 0,
      lunarPhase === 'Minguante' ? 1 : 0
    ];

    setTrainingData(currentTrainingData => 
      [...currentTrainingData, enhancedTrainingData]);

    if (concursoNumber % Math.min(updateInterval, 50) === 0 && trainingData.length > 0) {
      await updateModelWithNewData(trainedModel, trainingData, addLog, showToast);
      setTrainingData([]);
    }
  }, [
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
    setBoardNumbers,
    setNeuralNetworkVisualization,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    toast
  ]);

  const evolveGeneration = useCallback(async () => {
    const bestPlayers = selectBestPlayers(players);
    setGameCount(prev => prev + 1);

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

    if (gameCount % 1000 === 0 && bestPlayers.length > 0) {
      const champion = bestPlayers[0];
      
      const championAnalysis = learningQualityMonitor.analyzePlayerLearning(
        champion,
        numbers,
        formatPredictions(champion)
      );

      if (championAnalysis.isLearningEffective) {
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
        toast({
          title: "Alerta de Qualidade",
          description: "Campeão atual pode não estar aprendendo efetivamente. Mantendo geração anterior.",
          variant: "destructive"
        });
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
  }, [players, generation, trainedModel, gameCount, championData, toast, trainingData, numbers]);

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
  }, []);

  const clonePlayer = useCallback((player: Player) => {
    const clones = cloneChampion(player, 1);
    setPlayers(prevPlayers => [...prevPlayers, ...clones]);
    
    toast({
      title: "Jogador Clonado",
      description: `Um novo clone do Jogador #${player.id} foi criado.`
    });
  }, []);

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
    toggleInfiniteMode: useCallback(() => setIsInfiniteMode(prev => !prev), []),
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
    clonePlayer,
    traditionalPlayerStats
  };
};