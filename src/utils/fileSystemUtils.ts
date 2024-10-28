import { useToast } from "@/components/ui/use-toast";

type ToastFunction = ReturnType<typeof useToast>;

export const saveCheckpoint = async (data: any) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `checkpoint-${timestamp}`;
    
    localStorage.setItem(key, JSON.stringify(data));
    return key;
  } catch (error) {
    console.error('Erro ao salvar checkpoint:', error);
    throw error;
  }
};

export const loadLastCheckpoint = async () => {
  try {
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith('checkpoint-'))
      .sort()
      .reverse();

    if (keys.length === 0) return null;

    const lastKey = keys[0];
    const data = localStorage.getItem(lastKey);
    
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erro ao carregar checkpoint:', error);
    return null;
  }
};

export const createSelectDirectory = (toastFn: ToastFunction) => {
  return async (): Promise<string> => {
    try {
      const defaultPath = 'local-storage';
      toastFn({
        title: "Local Storage Configurado",
        description: "Os checkpoints serão salvos localmente no navegador",
      });
      return defaultPath;
    } catch (error) {
      console.error('Erro ao configurar armazenamento:', error);
      if (error instanceof Error) {
        toastFn({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
      throw error;
    }
  };
};