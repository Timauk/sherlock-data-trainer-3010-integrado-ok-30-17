export interface Player {
  id: number;  // Changed from string to number
  score: number;
  predictions: number[];
  weights: number[];
  fitness: number;
  generation: number;
  ancestry?: {
    parentIds: number[];  // Changed from string[] to number[]
    generation: number;
    mutationHistory: {
      generation: number;
      mutatedGenes: string[];
    }[];
  };
}