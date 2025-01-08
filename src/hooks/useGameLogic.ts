import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/components/ui/use-toast";
import { useGameInitialization } from './useGameInitialization';
import { useGameLoop } from './useGameLoop';
import { updateModelWithNewData } from '@/utils/modelUtils';
import { cloneChampion, updateModelWithChampionKnowledge } from '@/utils/playerEvolution';
import { selectBestPlayers } from '@/utils/evolutionSystem';
import { ModelVisualization, Player, ChampionData, EvolutionDataEntry } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | undefined) => {
  const { toast } = useToast();
  const { players, setPlayers, initializePlayers } = useGameInitialization();
  const [generation, setGeneration] = useState<number>(1);
  const [gameCount, setGameCount] = useState<number>(0);
  const [championData, setChampionData] = useState<ChampionData | undefined>();
  const [evolutionData, setEvolutionData] = useState<EvolutionDataEntry[]>([]);
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<ModelVisualization | null>(null);
  const [modelMetrics, setModelMetrics] = useState<{
    accuracy: number;
    randomAccuracy: number;
    totalPredictions: number;
  }>({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
  });
  const [dates, setDates] = useState<Date[]>([]);
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [frequencyData, setFrequencyData] = useState<Record<string, number[]>>({});
  const [updateInterval, setUpdateInterval] = useState<number>(10);
  const [isInfiniteMode, setIsInfiniteMode] = useState<boolean>(false);
  const [concursoNumber, setConcursoNumber] = useState<number>(0);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  const addLog = useCallback((message: string, matches?: number) => {
    const logType = matches ? 'prediction' : 'action';
    systemLogger.log(logType, message, { matches });
  }, []);

  const gameLoop = useGameLoop(
    players,
    setPlayers,
    csvData,
    trainedModel || null, // Aqui fazemos a conversão explícita para null quando undefined
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

  const evolveGeneration = useCallback(async () => {
    if (!trainedModel) {
      systemLogger.log('system', 'Não é possível evoluir sem um modelo treinado');
      return;
    }

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
          
          systemLogger.log('player', `Conhecimento do Campeão (Score: ${champion.score}) incorporado ao modelo`);
          
          setChampionData({
            player: champion,
            trainingData: trainingData
          });
        } catch (error) {
          systemLogger.log('system', `Erro ao atualizar modelo com conhecimento do campeão: ${error}`);
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
      systemLogger.log('player', `Melhor jogador da geração ${generation}: Score ${bestPlayers[0].score}`);
    }
  }, [players, generation, trainedModel, gameCount, championData, trainingData]);

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
      systemLogger.log('action', newMode ? 
        "Modo Manual Ativado - Clonagem automática desativada" : 
        "Modo Manual Desativado - Clonagem automática reativada"
      );
      return newMode;
    });
  }, []);

  const clonePlayer = useCallback((player: Player) => {
    if (!player) {
      systemLogger.log('system', 'Tentativa de clonar jogador inválido');
      return;
    }
    const clones = cloneChampion(player, 1);
    setPlayers(prevPlayers => [...prevPlayers, ...clones]);
    systemLogger.log('player', `Novo clone do Jogador #${player.id} criado`);
  }, []);

  useEffect(() => {
    initializePlayers();
  }, [initializePlayers]);

  useEffect(() => {
    if (csvData.length > 0) {
      setUpdateInterval(Math.max(10, Math.floor(csvData.length / 10)));
    }
  }, [csvData]);

  return {
    players,
    generation,
    evolutionData,
    neuralNetworkVisualization,
    modelMetrics,
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
    clonePlayer,
  };
};