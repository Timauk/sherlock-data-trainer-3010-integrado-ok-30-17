import { useState, useEffect } from 'react';
import { Player } from '../types/gameTypes';
import { modelMonitoring } from '../utils/monitoring/modelMonitoring';
import { performanceMonitor } from '../utils/performance/performanceMonitor';
import { predictionMonitor } from '../utils/monitoring/predictionMonitor';
import { WorkerPool } from '../utils/performance/workerPool';

const workerPool = new WorkerPool();

export const useGameLoop = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);
  const [evolutionData, setEvolutionData] = useState<Player[]>([]);
  const [gameSpeed, setGameSpeed] = useState(1);

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const gameLoop = async (currentTime: number) => {
      if (!isRunning) return;

      const deltaTime = currentTime - lastTime;
      const interval = 1000 / (60 * gameSpeed);

      if (deltaTime >= interval) {
        try {
          // Update game state
          const startTime = performance.now();
          
          await workerPool.addTask(async () => {
            const updatedPlayers = await updatePlayers(players);
            setPlayers(updatedPlayers);

            // Update champion if necessary
            const currentChampion = findChampion(updatedPlayers);
            if (currentChampion && (!champion || currentChampion.score > champion.score)) {
              setChampion(currentChampion);
            }

            // Record performance metrics
            const endTime = performance.now();
            const accuracy = currentChampion ? currentChampion.fitness : 0;
            performanceMonitor.recordMetrics(accuracy, endTime - startTime);
            modelMonitoring.recordMetrics(accuracy, 0.001, 0);
          });

          lastTime = currentTime;
        } catch (error) {
          console.error('Error in game loop:', error);
          setIsRunning(false);
        }
      }

      frameId = requestAnimationFrame(gameLoop);
    };

    if (isRunning) {
      frameId = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isRunning, players, champion, gameSpeed]);

  const startGame = () => {
    setIsRunning(true);
  };

  const pauseGame = () => {
    setIsRunning(false);
  };

  const resetGame = () => {
    setIsRunning(false);
    setGeneration(0);
    setPlayers([]);
    setChampion(null);
    setEvolutionData([]);
  };

  const updateGameSpeed = (speed: number) => {
    setGameSpeed(speed);
  };

  const updatePlayers = async (currentPlayers: Player[]): Promise<Player[]> => {
    return currentPlayers.map(player => ({
      ...player,
      score: player.score + calculateScore(player),
      fitness: calculateFitness(player)
    }));
  };

  const calculateScore = (player: Player): number => {
    // Implement your scoring logic here
    return player.predictions.reduce((acc, pred) => acc + (pred > 0.5 ? 1 : 0), 0);
  };

  const calculateFitness = (player: Player): number => {
    // Implement your fitness calculation logic here
    return player.score / (player.generation + 1);
  };

  const findChampion = (currentPlayers: Player[]): Player | null => {
    if (currentPlayers.length === 0) return null;
    return currentPlayers.reduce((prev, current) => 
      (current.score > prev.score) ? current : prev
    );
  };

  return {
    isRunning,
    generation,
    players,
    champion,
    evolutionData,
    gameSpeed,
    startGame,
    pauseGame,
    resetGame,
    updateGameSpeed
  };
};