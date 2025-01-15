import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';

export const cloneChampion = (champion: Player, count: number): Player[] => {
  return Array(count).fill(null).map((_, index) => ({
    id: Date.now() + index,
    name: `Clone ${index + 1} of ${champion.name}`,
    score: 0,
    predictions: [],
    weights: [...champion.weights],
    fitness: 0,
    generation: champion.generation + 1,
    matches: 0
  }));
};

export const updateModelWithChampionKnowledge = async (
  model: tf.LayersModel,
  champion: Player,
  trainingData: number[][]
): Promise<tf.LayersModel> => {
  // Prepara os dados de treinamento do campeão
  const xs = tf.tensor2d(trainingData.map(d => d.slice(0, -15)));
  const ys = tf.tensor2d(trainingData.map(d => d.slice(-15)));

  // Aplica os pesos do campeão como bias inicial
  const championLayer = tf.layers.dense({
    units: 15,
    weights: [tf.tensor2d([champion.weights]), tf.zeros([15])]
  });

  // Adiciona a camada do campeão ao modelo
  const updatedModel = tf.sequential();
  model.layers.forEach(layer => updatedModel.add(layer));
  updatedModel.add(championLayer);

  // Treina o modelo com os dados do campeão
  await updatedModel.fit(xs, ys, {
    epochs: 10,
    batchSize: 32,
    validationSplit: 0.2
  });

  xs.dispose();
  ys.dispose();

  return updatedModel;
};
