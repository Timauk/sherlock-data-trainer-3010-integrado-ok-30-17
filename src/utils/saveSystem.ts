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

const isFileSystemSupported = () => {
  return 'showDirectoryPicker' in window;
};

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

    // Sempre salva no localStorage
    localStorage.setItem('gameCheckpoint', JSON.stringify(save));
    
    // Tenta salvar no sistema de arquivos se suportado
    if (isFileSystemSupported()) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        const fileHandle = await handle.getFileHandle('checkpoint.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(save, null, 2));
        await writable.close();
      } catch (error) {
        console.error('Erro ao salvar arquivo:', error);
      }
    }
  } catch (error) {
    console.error('Erro ao salvar checkpoint:', error);
    throw error;
  }
};

export const loadGame = async (model: tf.LayersModel | null): Promise<GameSave | null> => {
  try {
    let save: GameSave | null = null;

    // Tenta carregar do sistema de arquivos primeiro
    if (isFileSystemSupported()) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        const fileHandle = await handle.getFileHandle('checkpoint.json');
        const file = await fileHandle.getFile();
        const content = await file.text();
        save = JSON.parse(content);
      } catch (error) {
        console.error('Erro ao carregar do sistema de arquivos:', error);
      }
    }

    // Se não conseguiu carregar do arquivo, tenta do localStorage
    if (!save) {
      const savedData = localStorage.getItem('gameCheckpoint');
      if (!savedData) return null;
      save = JSON.parse(savedData);
    }

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