import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player, ModelVisualization } from '@/types/gameTypes';
import { makePrediction } from '@/utils/predictionUtils';
import { updateModelWithNewData } from '@/utils/modelUtils';
import { calculateReward, logReward } from '@/utils/rewardSystem';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/lunarCalculations';

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
  setModelMetrics: (metrics: { 
    accuracy: number; 
    randomAccuracy: number; 
    totalPredictions: number;
    perGameAccuracy: number;
    perGameRandomAccuracy: number;
  }) => void,
  setConcursoNumber: (num: number) => void,
  showToast?: (title: string, description: string) => void
) => {
  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel) return;

    setConcursoNumber(concursoNumber + 1);
    setGameCount(prev => prev + 1); // Increment game count in each loop

    const currentBoardNumbers = csvData[concursoNumber % csvData.length];
    setBoardNumbers(currentBoardNumbers);
    
    // Add lunar phase analysis
    const currentDate = new Date();
    const lunarPhase = getLunarPhase(currentDate);
    const lunarPatterns = analyzeLunarPatterns([currentDate], [currentBoardNumbers]);
    
    // Update historical data with new information
    setNumbers(currentNumbers => {
      const newNumbers = [...currentNumbers, currentBoardNumbers].slice(-100);
      // Analyze frequency patterns
      const frequencyMap = new Map<number, number>();
      newNumbers.forEach(nums => {
        nums.forEach(n => frequencyMap.set(n, (frequencyMap.get(n) || 0) + 1));
      });
      return newNumbers;
    });
    
    setDates(currentDates => [...currentDates, currentDate].slice(-100));

    const playerPredictions = await Promise.all(
      players.map(player => 
        makePrediction(
          trainedModel, 
          currentBoardNumbers, 
          player.weights, 
          concursoNumber,
          setNeuralNetworkVisualization,
          { lunarPhase, lunarPatterns } // Pass lunar data to prediction
        )
      )
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

      const reward = calculateReward(matches);
      
      // Log significant achievements
      if (matches >= 11) {
        const logMessage = logReward(matches, player.id);
        addLog(logMessage, matches);
        
        // Notify about exceptional performance
        if (matches >= 13) {
          showToast?.("Desempenho Excepcional!", 
            `Jogador ${player.id} acertou ${matches} números!`);
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

    // Enhanced training data with lunar and frequency information
    const enhancedTrainingData = [...currentBoardNumbers, 
      ...updatedPlayers[0].predictions,
      lunarPhase === 'Cheia' ? 1 : 0,
      lunarPhase === 'Nova' ? 1 : 0,
      lunarPhase === 'Crescente' ? 1 : 0,
      lunarPhase === 'Minguante' ? 1 : 0
    ];

    setTrainingData(currentTrainingData => 
      [...currentTrainingData, enhancedTrainingData]);

    // Update model more frequently for better learning
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
    showToast
  ]);

  return gameLoop;
};
