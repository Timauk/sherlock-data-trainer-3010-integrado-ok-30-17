import { supabase } from '@/lib/supabase';
import { systemLogger } from '@/utils/logging/systemLogger';

interface DNA {
  weights: number[];
  learningRate: number;
  mutationRate: number;
  features: {
    pattern_recognition: number;
    frequency_analysis: number;
    adaptation_rate: number;
  };
}

export const geneticService = {
  createDNA(): DNA {
    return {
      weights: Array.from({ length: 15 }, () => Math.random()),
      learningRate: 0.001 + Math.random() * 0.009,
      mutationRate: 0.01 + Math.random() * 0.09,
      features: {
        pattern_recognition: Math.random(),
        frequency_analysis: Math.random(),
        adaptation_rate: Math.random()
      }
    };
  },

  mutate(dna: DNA, mutationStrength: number = 0.1): DNA {
    const mutated: DNA = JSON.parse(JSON.stringify(dna));
    
    // Mutação dos pesos
    mutated.weights = mutated.weights.map(weight => 
      Math.random() < mutationStrength ? weight + (Math.random() - 0.5) * 0.2 : weight
    );

    // Mutação das taxas
    if (Math.random() < mutationStrength) {
      mutated.learningRate *= 0.5 + Math.random();
    }
    if (Math.random() < mutationStrength) {
      mutated.mutationRate *= 0.5 + Math.random();
    }

    // Mutação das características
    Object.keys(mutated.features).forEach(key => {
      if (Math.random() < mutationStrength) {
        mutated.features[key as keyof typeof mutated.features] += (Math.random() - 0.5) * 0.2;
      }
    });

    return mutated;
  },

  async savePlayerDNA(playerId: number, dna: DNA) {
    const { error } = await supabase
      .from('players')
      .update({ dna })
      .eq('id', playerId);

    if (error) {
      systemLogger.log('system', 'Erro ao salvar DNA', { error, playerId });
      throw error;
    }
  },

  async getPlayerLineage(playerId: number) {
    const { data, error } = await supabase
      .rpc('get_player_lineage', { player_id: playerId });

    if (error) {
      systemLogger.log('system', 'Erro ao buscar linhagem', { error, playerId });
      throw error;
    }

    return data;
  }
};