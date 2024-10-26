import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player, ModelVisualization } from '@/types/gameTypes';
import { makePrediction } from '@/utils/predictionUtils';
import { updateModelWithNewData } from '@/utils/modelUtils';
import { calculateReward, logReward } from '@/utils/rewardSystem';

export const useGameLoop = (
  players: Player[],
  setPlayers: (players: Player[]) => void,
  csvData: number[][],
  trainedModel: tf.LayersModel | null,
  concursoNumber: number,
  setEvolutionData: (data: any) => void,
  generation: number,
  addLog: (message: string, matches?: number) => void,
  updateInterval: number,
  trainingData: number[][],
  setTrainingData: React.Dispatch<React.SetStateAction<number[][]>>,
  setNumbers: React.Dispatch<React.SetStateAction<number[][]>>,
  setDates: React.Dispatch<React.SetStateAction<Date[]>>,
  setNeuralNetworkVisualization: (vis: ModelVisualization | null) => void,
  setBoardNumbers: (numbers: number[]) => void,
  setModelMetrics: (metrics: { accuracy: number; randomAccuracy: number; totalPredictions: number }) => void,
  setConcursoNumber: (num: number) => void,
  showToast?: (title: string, description: string) => void
) => {
  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel) return;

    // Increment concurso number
    setConcursoNumber(concursoNumber + 1);

    const currentBoardNumbers = csvData[concursoNumber % csvData.length];
    setBoardNumbers(currentBoardNumbers);
    setNumbers(currentNumbers => [...currentNumbers, currentBoardNumbers].slice(-100));
    setDates(currentDates => [...currentDates, new Date()].slice(-100));

    const playerPredictions = await Promise.all(
      players.map(player => 
        makePrediction(trainedModel, currentBoardNumbers, player.weights, concursoNumber, setNeuralNetworkVisualization)
      )
    );

    let totalMatches = 0;
    let randomMatches = 0;
    const totalPredictions = players.length * (concursoNumber + 1); // Accumulate total predictions

    const updatedPlayers = players.map((player, index) => {
      const predictions = playerPredictions[index];
      const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
      totalMatches += matches;
      
      // Generate random prediction for comparison
      const randomPrediction = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
      const randomMatch = randomPrediction.filter(num => currentBoardNumbers.includes(num)).length;
      randomMatches += randomMatch;

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

    // Update metrics with accumulated total predictions
    setModelMetrics({
      accuracy: totalMatches / (players.length * 15),
      randomAccuracy: randomMatches / (players.length * 15),
      totalPredictions: totalPredictions
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

    setTrainingData(currentTrainingData => [...currentTrainingData, [...currentBoardNumbers, ...updatedPlayers[0].predictions]]);

    if (concursoNumber % updateInterval === 0 && trainingData.length > 0) {
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
    showToast
  ]);

  return gameLoop;
};