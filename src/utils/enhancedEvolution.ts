import { Player } from '@/types/gameTypes';
import { systemLogger } from './logging/systemLogger';

export const evolvePopulation = (
  players: Player[],
  generation: number,
  mutationRate: number = 0.1
): Player[] => {
  const sortedPlayers = [...players].sort((a, b) => b.fitness - a.fitness);
  const eliteCount = Math.max(1, Math.floor(players.length * 0.1));
  const elite = sortedPlayers.slice(0, eliteCount);
  
  const newPopulation: Player[] = [];
  
  // Manter a elite
  elite.forEach(player => {
    newPopulation.push({
      ...player,
      generation: generation + 1
    });
  });
  
  // Gerar novos jogadores
  while (newPopulation.length < players.length) {
    const parent1 = selectParent(sortedPlayers);
    const parent2 = selectParent(sortedPlayers);
    
    if (parent1 && parent2) {
      const child = crossover(parent1, parent2, generation + 1);
      const mutatedChild = mutate(child, mutationRate);
      newPopulation.push(mutatedChild);
    }
  }
  
  systemLogger.log('action', `População evoluída para geração ${generation + 1}`);
  return newPopulation;
};

const selectParent = (players: Player[]): Player | null => {
  const totalFitness = players.reduce((sum, player) => sum + player.fitness, 0);
  let random = Math.random() * totalFitness;
  
  for (const player of players) {
    random -= player.fitness;
    if (random <= 0) {
      return player;
    }
  }
  
  return players[0];
};

const crossover = (parent1: Player, parent2: Player, generation: number): Player => {
  const weights = parent1.weights.map((weight, index) => {
    return Math.random() < 0.5 ? weight : parent2.weights[index];
  });

  return {
    ...parent1,
    id: Date.now() + Math.floor(Math.random() * 1000),
    weights,
    score: 0,
    fitness: 0,
    generation,
    matches: 0,
    predictions: []
  };
};

const mutate = (player: Player, mutationRate: number): Player => {
  const mutatedWeights = player.weights.map(weight => {
    if (Math.random() < mutationRate) {
      return weight + (Math.random() - 0.5) * 0.1;
    }
    return weight;
  });

  return {
    ...player,
    weights: mutatedWeights
  };
};