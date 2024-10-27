import * as tf from '@tensorflow/tfjs';
import { Player } from '../types/gameTypes';

interface GameSave {
  timestamp: number;
  players: Player[];
  generation: number;
  gameCount: number;
  evolutionData: any[];
  modelWeights: number[][][];
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
      ? model.getWeights().map(w => Array.from(w.dataSync())).map(w => Array.isArray(w) ? w : [w])
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

    localStorage.setItem('gameCheckpoint', JSON.stringify(save));
    
    // Também salva em arquivo usando a API File System Access
    try {
      const handle = await window.showDirectoryPicker();
      const fileHandle = await handle.getFileHandle('checkpoint.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(save, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      // Fallback para localStorage apenas
    }
  } catch (error) {
    console.error('Erro ao salvar checkpoint:', error);
    throw error;
  }
};

export const loadGame = async (model: tf.LayersModel | null): Promise<GameSave | null> => {
  try {
    // Tenta carregar do arquivo primeiro
    try {
      const handle = await window.showDirectoryPicker();
      const fileHandle = await handle.getFileHandle('checkpoint.json');
      const file = await fileHandle.getFile();
      const content = await file.text();
      const save: GameSave = JSON.parse(content);
      
      if (model && save.modelWeights.length > 0) {
        const weights = save.modelWeights.map(w => tf.tensor(w));
        model.setWeights(weights);
      }
      
      return save;
    } catch (error) {
      // Fallback para localStorage
      const savedData = localStorage.getItem('gameCheckpoint');
      if (!savedData) return null;
      
      const save: GameSave = JSON.parse(savedData);
      
      if (model && save.modelWeights.length > 0) {
        const weights = save.modelWeights.map(w => tf.tensor(w));
        model.setWeights(weights);
      }
      
      return save;
    }
  } catch (error) {
    console.error('Erro ao carregar checkpoint:', error);
    return null;
  }
};