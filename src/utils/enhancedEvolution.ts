import { Player } from '@/types/gameTypes';

export const createNewPlayer = (id: number, generation: number): Player => {
  return {
    id,
    name: `Player ${id}`,
    score: 0,
    predictions: [],
    weights: Array.from({ length: 17 }, () => Math.random()),
    fitness: 0,
    generation,
    matches: 0
  };
};

export const evolvePlayer = (player: Player): Player => {
  return {
    ...player,
    name: `Player ${player.id}`,
    matches: player.matches,
    weights: player.weights.map(w => w + (Math.random() - 0.5) * 0.1)
  };
};

export const crossoverPlayers = (parent1: Player, parent2: Player): Player[] => {
  const crossoverPoint = Math.floor(Math.random() * parent1.weights.length);
  
  const child1Weights = [
    ...parent1.weights.slice(0, crossoverPoint),
    ...parent2.weights.slice(crossoverPoint)
  ];
  
  const child2Weights = [
    ...parent2.weights.slice(0, crossoverPoint),
    ...parent1.weights.slice(crossoverPoint)
  ];
  
  return [
    {
      id: Date.now(),
      name: `Child of ${parent1.id} & ${parent2.id}`,
      score: 0,
      predictions: [],
      weights: child1Weights,
      fitness: 0,
      generation: parent1.generation + 1,
      matches: 0
    },
    {
      id: Date.now() + 1,
      name: `Child of ${parent2.id} & ${parent1.id}`,
      score: 0,
      predictions: [],
      weights: child2Weights,
      fitness: 0,
      generation: parent2.generation + 1,
      matches: 0
    }
  ];
};

export const calculateFitness = (player: Player, targetNumbers: number[]): number => {
  if (!player.predictions.length) return 0;
  
  const lastPrediction = player.predictions[player.predictions.length - 1];
  const matches = lastPrediction.filter(num => targetNumbers.includes(num)).length;
  const fitness = matches / targetNumbers.length;
  
  return fitness;
};

export const updatePlayerStats = (
  player: Player,
  prediction: number[],
  actualNumbers: number[]
): Player => {
  const matches = prediction.filter(num => actualNumbers.includes(num)).length;
  const newScore = player.score + matches;
  const newFitness = calculateFitness(player, actualNumbers);
  
  return {
    ...player,
    score: newScore,
    predictions: [...player.predictions, prediction],
    fitness: newFitness,
    matches: player.matches + 1
  };
};