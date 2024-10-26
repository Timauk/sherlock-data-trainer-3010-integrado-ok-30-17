import { Player } from '../types/gameTypes';

export const createOffspring = (parent1: Player, parent2: Player, generation: number): Player => {
  // Crossover dos pesos
  const childWeights = parent1.weights.map((weight, index) => {
    return Math.random() > 0.5 ? weight : parent2.weights[index];
  });

  // Mutação
  const mutatedWeights = childWeights.map(weight => {
    return Math.random() < 0.1 ? weight + (Math.random() - 0.5) * 0.1 : weight;
  });

  return {
    id: Math.random(),
    score: 0,
    predictions: [],
    weights: mutatedWeights,
    fitness: 0,
    generation: generation + 1
  };
};

export const selectBestPlayers = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => b.fitness - a.fitness)
                    .slice(0, Math.ceil(players.length / 2));
};