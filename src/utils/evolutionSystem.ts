import { v4 as uuidv4 } from 'uuid';
import { Player } from '../types/gameTypes';

interface Ancestry {
  parentIds: string[];
  generation: number;
  mutationHistory: {
    generation: number;
    mutatedGenes: string[];
  }[];
}

export const createOffspring = (
  parent1: Player,
  parent2: Player,
  generation: number
): Player => {
  const ancestry: Ancestry = {
    parentIds: [parent1.id, parent2.id],
    generation,
    mutationHistory: []
  };

  // Crossover dos pesos com tracking de genes
  const childWeights = parent1.weights.map((weight, index) => {
    const useParent1 = Math.random() > 0.5;
    return useParent1 ? weight : parent2.weights[index];
  });

  // Mutação com tracking
  const mutatedWeights = childWeights.map((weight, index) => {
    const shouldMutate = Math.random() < 0.1;
    if (shouldMutate) {
      ancestry.mutationHistory.push({
        generation,
        mutatedGenes: [`weight_${index}`]
      });
      return weight + (Math.random() - 0.5) * 0.1;
    }
    return weight;
  });

  return {
    id: uuidv4(),
    score: 0,
    predictions: [],
    weights: mutatedWeights,
    fitness: 0,
    generation,
    ancestry
  };
};

export const selectBestPlayers = (players: Player[]): Player[] => {
  // Sort by fitness and include ancestry in selection criteria
  const sortedPlayers = [...players].sort((a, b) => {
    if (Math.abs(b.fitness - a.fitness) < 0.1) {
      // If fitness is similar, prefer players with diverse ancestry
      return (b.ancestry?.parentIds.length || 0) - (a.ancestry?.parentIds.length || 0);
    }
    return b.fitness - a.fitness;
  });

  return sortedPlayers.slice(0, Math.ceil(players.length / 2));
};

export const analyzePopulationDiversity = (players: Player[]): number => {
  const weights = players.map(p => p.weights);
  const meanWeights = weights[0].map((_, i) => 
    weights.reduce((sum, w) => sum + w[i], 0) / weights.length
  );
  
  return weights.reduce((diversity, playerWeights) => 
    diversity + Math.sqrt(
      playerWeights.reduce((sum, w, i) => 
        sum + Math.pow(w - meanWeights[i], 2), 0
      )
    ), 0
  ) / players.length;
};