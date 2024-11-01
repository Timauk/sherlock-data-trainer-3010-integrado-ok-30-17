import { Player } from '@/types/playerTypes';
import { v4 as uuidv4 } from 'uuid';

export const calculateFitness = (player: Player, boardNumbers: number[]): number => {
  const matches = player.predictions.filter(num => boardNumbers.includes(num)).length;
  const consistencyBonus = calculateConsistencyBonus(player);
  const adaptabilityScore = calculateAdaptabilityScore(player);
  
  return matches + (consistencyBonus * 0.2) + (adaptabilityScore * 0.1);
};

const calculateConsistencyBonus = (player: Player): number => {
  if (player.predictions.length < 2) return 0;
  
  let consistentPredictions = 0;
  for (let i = 1; i < player.predictions.length; i++) {
    const prev = player.predictions[i - 1];
    const curr = player.predictions[i];
    
    if (Array.isArray(prev) && Array.isArray(curr)) {
      const intersection = (prev as number[]).filter(num => (curr as number[]).includes(num));
      if (intersection.length >= 10) consistentPredictions++;
    }
  }
  
  return (consistentPredictions / (player.predictions.length - 1)) * 5;
};

const calculateAdaptabilityScore = (player: Player): number => {
  if (player.predictions.length < 5) return 0;
  
  const recentPredictions = player.predictions.slice(-5);
  if (!recentPredictions.every(pred => Array.isArray(pred))) return 0;
  
  const validPredictions = recentPredictions.map(pred => pred as number[]);
  const uniqueNumbers = new Set(validPredictions.flat());
  
  return (uniqueNumbers.size / (25 * 0.6)) * 5;
};

export const createMutatedClone = (player: Player, mutationRate: number = 0.1): Player => {
  const mutatedWeights = player.weights.map(weight => {
    if (Math.random() < mutationRate) {
      const mutation = (Math.random() - 0.5) * 0.2;
      return weight * (1 + mutation);
    }
    return weight;
  });

  return {
    id: Math.floor(Math.random() * 1000000), // Generate numeric ID
    score: 0,
    predictions: [],
    weights: mutatedWeights,
    fitness: 0,
    generation: player.generation + 1
  };
};

export const crossoverPlayers = (parent1: Player, parent2: Player): Player => {
  const crossoverPoint = Math.floor(Math.random() * parent1.weights.length);
  const childWeights = [
    ...parent1.weights.slice(0, crossoverPoint),
    ...parent2.weights.slice(crossoverPoint)
  ];

  return {
    id: Math.floor(Math.random() * 1000000), // Generate numeric ID
    score: 0,
    predictions: [],
    weights: childWeights,
    fitness: 0,
    generation: Math.max(parent1.generation, parent2.generation) + 1
  };
};