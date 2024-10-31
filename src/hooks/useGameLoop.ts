import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player, ModelVisualization } from '@/types/gameTypes';
import { makePrediction } from '@/utils/predictionUtils';
import { updateModelWithNewData } from '@/utils/modelUtils';
import { calculateReward } from '@/utils/rewardSystem';

export const useGameLoop = (
  players: Player[],
  setPlayers: (players: Player[]) => void,
  csvData: number[][],
  trainedModel: tf.LayersModel | null,
  concursoNumber: number,
  setEvolutionData: (data: any) => void,
  generation: number,
  addLog: (message: string) => void,
  updateInterval: number,
  trainingData: number[][],
  setTrainingData: React.Dispatch<React.SetStateAction<number[][]>>,
  setNumbers: React.Dispatch<React.SetStateAction<number[][]>>,
  setDates: React.Dispatch<React.SetStateAction<Date[]>>,
  setNeuralNetworkVisualization: (vis: ModelVisualization | null) => void,
  setBoardNumbers: (numbers: number[]) => void,
  setModelMetrics: (metrics: any) => void,
  setConcursoNumber: (num: number) => void,
  setGameCount: React.Dispatch<React.SetStateAction<number>>,
  showToast?: (title: string, description: string) => void
) => {
  return useCallback(async () => {
    if (!csvData?.length || !trainedModel || !players?.length) {
      addLog("Missing required data for game loop");
      return;
    }

    const currentIndex = concursoNumber % csvData.length;
    const currentBoardNumbers = csvData[currentIndex];

    if (!currentBoardNumbers) {
      addLog("Invalid board numbers");
      return;
    }

    setConcursoNumber(concursoNumber + 1);
    setGameCount(prev => prev + 1);
    setBoardNumbers(currentBoardNumbers);

    const currentDate = new Date();
    
    setNumbers(currentNumbers => {
      if (!currentNumbers) return [currentBoardNumbers];
      return [...currentNumbers, currentBoardNumbers].slice(-100);
    });
    
    setDates(currentDates => {
      if (!currentDates) return [currentDate];
      return [...currentDates, currentDate].slice(-100);
    });

    try {
      const playerPredictions = await Promise.all(
        players.map(async player => {
          return await makePrediction(
            trainedModel,
            currentBoardNumbers,
            player.weights,
            concursoNumber,
            setNeuralNetworkVisualization
          );
        })
      );

      let totalMatches = 0;
      let randomMatches = 0;

      const updatedPlayers = players.map((player, index) => {
        const predictions = playerPredictions[index] || [];
        const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
        totalMatches += matches;

        const randomPrediction = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
        const randomMatch = randomPrediction.filter(num => currentBoardNumbers.includes(num)).length;
        randomMatches += randomMatch;

        const reward = calculateReward(matches);

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
        totalPredictions: players.length * (concursoNumber + 1)
      });

      setPlayers(updatedPlayers);
      setEvolutionData(prev => [
        ...(prev || []),
        ...updatedPlayers.map(player => ({
          generation,
          playerId: player.id,
          score: player.score,
          fitness: player.fitness
        }))
      ]);

      if (concursoNumber % Math.min(updateInterval, 50) === 0 && trainingData?.length > 0) {
        await updateModelWithNewData(trainedModel, trainingData, addLog, showToast);
        setTrainingData([]);
      }

    } catch (error) {
      addLog(`Error in game loop: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error("Game loop error:", error);
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
    showToast
  ]);
};