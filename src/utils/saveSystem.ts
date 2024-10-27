import * as tf from '@tensorflow/tfjs';
import { Player } from '../types/gameTypes';

interface GameSave {
  timestamp: number;
  players: Player[];
  generation: number;
  gameCount: number;
  evolutionData: any[];
  modelWeights: number[][];
  concursoNumber: number;
  frequencyData: { [key: string]: number[] };
}

export const saveGame = async (
  players: Player[],
  generation: number,
  gameCount: number,
  evolutionData: any[],
  model: tf.LayersModel | null,
  concursoNumber: number,
  frequencyData: { [key: string]: number[] }
): Promise<void> => {
  try {
    const modelWeights = model 
      ? model.getWeights().map(w => Array.from(w.dataSync()))
      : [];

    const save: GameSave = {
      timestamp: Date.now(),
      players,
      generation,
      gameCount,
      evolutionData,
      modelWeights,
      concursoNumber,
      frequencyData
    };

    // Sempre salva no localStorage como backup
    localStorage.setItem('gameCheckpoint', JSON.stringify(save));
  } catch (error) {
    console.error('Erro ao salvar checkpoint:', error);
    throw error;
  }
};

export const loadGame = async (model: tf.LayersModel | null): Promise<GameSave | null> => {
  try {
    const savedData = localStorage.getItem('gameCheckpoint');
    if (!savedData) return null;
    
    const save: GameSave = JSON.parse(savedData);
    
    if (model && save.modelWeights.length > 0) {
      const weights = save.modelWeights.map(w => tf.tensor(w));
      model.setWeights(weights);
    }
    
    return save;
  } catch (error) {
    console.error('Erro ao carregar checkpoint:', error);
    return null;
  }
};