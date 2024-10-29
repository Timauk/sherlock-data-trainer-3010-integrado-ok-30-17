import { Player } from '@/types/gameTypes';

type ToastFunction = {
  toast: {
    (props: { title: string; description: string; variant?: "default" | "destructive" }): void;
  };
};

interface GameState {
  players: Player[];
  generation: number;
  gameCount: number;
  evolutionData: any[];
  timestamp: string;
  path: string;
}

export const saveCheckpoint = async (data: GameState) => {
  try {
    const response = await fetch('http://localhost:3001/api/checkpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        players: data.players,
        generation: data.generation,
        gameCount: data.gameCount,
        evolutionData: data.evolutionData,
        timestamp: data.timestamp,
        path: data.path
      })
    });
    
    const result = await response.json();
    return result.filename;
  } catch (error) {
    console.error('Erro ao salvar checkpoint:', error);
    throw error;
  }
};

export const loadLastCheckpoint = async (): Promise<GameState | null> => {
  try {
    const response = await fetch('http://localhost:3001/api/checkpoint/latest');
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Erro ao carregar checkpoint');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar checkpoint:', error);
    return null;
  }
};

export const createSelectDirectory = (toastFn: ToastFunction) => {
  return async (): Promise<string> => {
    try {
      const defaultPath = './checkpoints';
      toastFn.toast({
        title: "Servidor Local Configurado",
        description: "Os checkpoints serão salvos na pasta 'checkpoints' do servidor",
      });
      return defaultPath;
    } catch (error) {
      console.error('Erro ao configurar armazenamento:', error);
      if (error instanceof Error) {
        toastFn.toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
      throw error;
    }
  };
};