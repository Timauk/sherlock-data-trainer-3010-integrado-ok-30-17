import { Player } from '@/types/gameTypes';

export const createPlayer = (id: number, generation: number): Player => {
  return {
    id,
    name: `Player ${id}`,
    score: 0,
    predictions: [],
    weights: Array(10).fill(0).map(() => Math.random()),
    fitness: 0,
    generation,
    matches: 0
  };
};

export const selectBestPlayers = (players: Player[]): Player[] => {
  return players
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, Math.max(1, Math.floor(players.length * 0.2)));
};

export const mutatePlayer = (player: Player, mutationRate: number = 0.1): Player => {
  const mutatedWeights = player.weights.map(weight => {
    if (Math.random() < mutationRate) {
      return weight + (Math.random() * 0.2 - 0.1);
    }
    return weight;
  });

  return {
    ...player,
    weights: mutatedWeights,
    score: 0,
    fitness: 0
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

  const child1: Player = {
    id: Date.now(),
    name: `Child of ${parent1.name} & ${parent2.name}`,
    score: 0,
    predictions: [],
    weights: child1Weights,
    fitness: 0,
    generation: Math.max(parent1.generation, parent2.generation) + 1,
    matches: 0
  };

  const child2: Player = {
    id: Date.now() + 1,
    name: `Child of ${parent2.name} & ${parent1.name}`,
    score: 0,
    predictions: [],
    weights: child2Weights,
    fitness: 0,
    generation: Math.max(parent1.generation, parent2.generation) + 1,
    matches: 0
  };

  return [child1, child2];
};

export const calculateFitness = (player: Player): number => {
  if (player.matches === 0) return 0;
  return player.score / player.matches;
};

export const evolvePopulation = (players: Player[]): Player[] => {
  const bestPlayers = selectBestPlayers(players);
  const newPopulation: Player[] = [...bestPlayers];

  while (newPopulation.length < players.length) {
    const parent1 = bestPlayers[Math.floor(Math.random() * bestPlayers.length)];
    const parent2 = bestPlayers[Math.floor(Math.random() * bestPlayers.length)];
    
    if (parent1 && parent2) {
      const children = crossoverPlayers(parent1, parent2);
      children.forEach(child => {
        if (newPopulation.length < players.length) {
          newPopulation.push(mutatePlayer(child));
        }
      });
    }
  }

  return newPopulation;
};