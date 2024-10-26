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
  setTrainingData: (data: number[][]) => void,
  setNumbers: (numbers: number[][]) => void,
  setDates: (dates: Date[]) => void,
  setNeuralNetworkVisualization: (vis: ModelVisualization | null) => void,
  setBoardNumbers: (numbers: number[]) => void
) => {
  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel) return;

    const currentBoardNumbers = csvData[concursoNumber % csvData.length];
    setBoardNumbers(currentBoardNumbers);
    setNumbers(prev => [...prev, currentBoardNumbers].slice(-100) as number[][]);
    setDates(prev => [...prev, new Date()].slice(-100) as Date[]);

    const playerPredictions = await Promise.all(
      players.map(player => 
        makePrediction(trainedModel, currentBoardNumbers, player.weights, concursoNumber, setNeuralNetworkVisualization)
      )
    );

    const updatedPlayers = players.map((player, index) => {
      const predictions = playerPredictions[index];
      const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
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
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    setTrainingData(prev => [...prev, [...currentBoardNumbers, ...updatedPlayers[0].predictions]] as number[][]);

    if (concursoNumber % updateInterval === 0 && trainingData.length > 0) {
      await updateModelWithNewData(trainedModel, trainingData, addLog);
      setTrainingData([]);
    }
  }, [players, csvData, concursoNumber, generation, trainedModel, addLog, updateInterval]);

  return gameLoop;
};